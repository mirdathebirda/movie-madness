import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const WATCH_REGION = "US";
const PROVIDER_IDS = [8, 15, 258]; // Netflix, Hulu, Criterion Channel

interface Movie {
  title: string;
  year: number;
  tmdbId: number;
  posterPath: string | null;
  overview: string;
  providers: { id: number; name: string; logoPath: string }[];
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function scrapeLetterboxdList(baseUrl: string): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `${baseUrl}page/${page}/`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const filmElements = $(".poster-container .film-poster");

    if (filmElements.length === 0) {
      hasMore = false;
      break;
    }

    filmElements.each((_, el) => {
      const slug = $(el).attr("data-film-slug");
      if (slug) slugs.push(slug);
    });

    page++;
    await delay(500);
  }

  return slugs;
}

async function scrapeWatchedFilms(username: string): Promise<string[]> {
  const baseUrl = `https://letterboxd.com/${username}/films/`;
  return scrapeLetterboxdList(baseUrl);
}

async function scrapeTop500(): Promise<string[]> {
  const baseUrl =
    "https://letterboxd.com/official/list/letterboxds-top-500-films/";
  return scrapeLetterboxdList(baseUrl);
}

async function searchTmdb(
  title: string,
  year?: number
): Promise<{ id: number; posterPath: string | null; overview: string } | null> {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    query: title,
  });
  if (year) params.set("year", year.toString());

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?${params}`
  );
  const data = await res.json();

  if (data.results && data.results.length > 0) {
    const movie = data.results[0];
    return {
      id: movie.id,
      posterPath: movie.poster_path,
      overview: movie.overview,
    };
  }
  return null;
}

async function getWatchProviders(
  tmdbId: number
): Promise<{ id: number; name: string; logoPath: string }[]> {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`
  );
  const data = await res.json();

  const regionData = data.results?.[WATCH_REGION];
  if (!regionData) return [];

  const flatrate = regionData.flatrate || [];
  return flatrate
    .filter((p: { provider_id: number }) => PROVIDER_IDS.includes(p.provider_id))
    .map((p: { provider_id: number; provider_name: string; logo_path: string }) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path,
    }));
}

async function getFilmDetails(
  slug: string
): Promise<{ title: string; year: number } | null> {
  const url = `https://letterboxd.com/film/${slug}/`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr("content")?.replace(/\s*\(\d{4}\)$/, "") ||
    $("h1.headline-1").text().trim();
  const yearText = $('meta[property="og:title"]')
    .attr("content")
    ?.match(/\((\d{4})\)/)?.[1];
  const year = yearText ? parseInt(yearText) : 0;

  if (!title) return null;
  return { title, year };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY environment variable is required");
    process.exit(1);
  }

  console.log("Scraping Letterboxd Top 500...");
  const top500Slugs = await scrapeTop500();
  console.log(`Found ${top500Slugs.length} films in Top 500`);

  console.log("Scraping Miranda's watched films...");
  const mirandaWatched = await scrapeWatchedFilms("mirdathebirda");
  console.log(`Found ${mirandaWatched.length} films watched by Miranda`);

  console.log("Scraping Elleen's watched films...");
  const elleenWatched = await scrapeWatchedFilms("elleenpan");
  console.log(`Found ${elleenWatched.length} films watched by Elleen`);

  const watchedSet = new Set([...mirandaWatched, ...elleenWatched]);
  const eligibleSlugs = top500Slugs.filter((slug) => !watchedSet.has(slug));
  console.log(
    `${eligibleSlugs.length} eligible films after filtering watched lists`
  );

  const movies: Movie[] = [];

  for (let i = 0; i < eligibleSlugs.length; i++) {
    const slug = eligibleSlugs[i];
    console.log(`[${i + 1}/${eligibleSlugs.length}] Processing: ${slug}`);

    const details = await getFilmDetails(slug);
    if (!details) {
      console.log(`  Skipping ${slug} — couldn't get details`);
      continue;
    }

    const tmdbResult = await searchTmdb(details.title, details.year);
    if (!tmdbResult) {
      console.log(`  Skipping ${slug} — not found on TMDB`);
      continue;
    }

    const providers = await getWatchProviders(tmdbResult.id);
    if (providers.length === 0) {
      console.log(`  Skipping ${slug} — not on any of our platforms`);
      continue;
    }

    movies.push({
      title: details.title,
      year: details.year,
      tmdbId: tmdbResult.id,
      posterPath: tmdbResult.posterPath,
      overview: tmdbResult.overview,
      providers,
    });

    console.log(
      `  ✓ ${details.title} (${details.year}) — ${providers.map((p) => p.name).join(", ")}`
    );

    await delay(300);
  }

  console.log(`\nTotal eligible movies with streaming: ${movies.length}`);

  const outDir = path.join(process.cwd(), "public");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "eligible-movies.json"),
    JSON.stringify(movies, null, 2)
  );

  console.log("Written to public/eligible-movies.json");
}

main().catch(console.error);
