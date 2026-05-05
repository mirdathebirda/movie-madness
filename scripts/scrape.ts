import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const WATCH_REGION = "US";

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
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function scrapeWatchedFromRss(username: string): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `https://letterboxd.com/${username}/rss/page/${page}/`;
    let xml: string;
    try {
      xml = await fetchPage(url);
    } catch {
      hasMore = false;
      break;
    }

    const $ = cheerio.load(xml, { xmlMode: true });
    const items = $("item");

    if (items.length === 0) {
      hasMore = false;
      break;
    }

    items.each((_, el) => {
      const link = $(el).find("link").text();
      if (link) {
        const match = link.match(/letterboxd\.com\/.*\/film\/([^/]+)/);
        if (match) slugs.push(match[1]);
      }
    });

    page++;
    await delay(1000);
  }

  return [...new Set(slugs)];
}

async function scrapeTop500Rss(): Promise<{ title: string; year: number; slug: string }[]> {
  const films: { title: string; year: number; slug: string }[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `https://letterboxd.com/official/list/letterboxds-top-500-films/rss/page/${page}/`;
    let xml: string;
    try {
      xml = await fetchPage(url);
    } catch {
      hasMore = false;
      break;
    }

    const $ = cheerio.load(xml, { xmlMode: true });
    const items = $("item");

    if (items.length === 0) {
      hasMore = false;
      break;
    }

    items.each((_, el) => {
      const titleText = $(el).find("title").text();
      const link = $(el).find("link").text();

      const titleMatch = titleText.match(/^(.+?)\s*\((\d{4})\)/);
      const slugMatch = link.match(/\/film\/([^/]+)/);

      if (titleMatch && slugMatch) {
        films.push({
          title: titleMatch[1].trim(),
          year: parseInt(titleMatch[2]),
          slug: slugMatch[1],
        });
      } else if (slugMatch) {
        films.push({
          title: titleText.trim(),
          year: 0,
          slug: slugMatch[1],
        });
      }
    });

    page++;
    await delay(1000);
  }

  return films;
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
  return flatrate.map((p: { provider_id: number; provider_name: string; logo_path: string }) => ({
    id: p.provider_id,
    name: p.provider_name,
    logoPath: p.logo_path,
  }));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY environment variable is required");
    process.exit(1);
  }

  console.log("Scraping Letterboxd Top 500 (RSS)...");
  const top500Films = await scrapeTop500Rss();
  console.log(`Found ${top500Films.length} films in Top 500`);

  console.log("Scraping Miranda's watched films (RSS)...");
  const mirandaWatched = await scrapeWatchedFromRss("mirdathebirda");
  console.log(`Found ${mirandaWatched.length} films watched by Miranda`);

  console.log("Scraping Elleen's watched films (RSS)...");
  const elleenWatched = await scrapeWatchedFromRss("elleenpan");
  console.log(`Found ${elleenWatched.length} films watched by Elleen`);

  const watchedSet = new Set([...mirandaWatched, ...elleenWatched]);
  const eligibleFilms = top500Films.filter((f) => !watchedSet.has(f.slug));
  console.log(
    `${eligibleFilms.length} eligible films after filtering watched lists`
  );

  const movies: Movie[] = [];

  for (let i = 0; i < eligibleFilms.length; i++) {
    const film = eligibleFilms[i];
    console.log(`[${i + 1}/${eligibleFilms.length}] Processing: ${film.title} (${film.year})`);

    const tmdbResult = await searchTmdb(film.title, film.year || undefined);
    if (!tmdbResult) {
      console.log(`  Skipping — not found on TMDB`);
      continue;
    }

    const providers = await getWatchProviders(tmdbResult.id);

    movies.push({
      title: film.title,
      year: film.year,
      tmdbId: tmdbResult.id,
      posterPath: tmdbResult.posterPath,
      overview: tmdbResult.overview,
      providers,
    });

    console.log(
      `  ✓ ${providers.length > 0 ? providers.map((p) => p.name).join(", ") : "no streaming"}`
    );

    await delay(300);
  }

  console.log(`\nTotal eligible movies: ${movies.length}`);

  const outDir = path.join(process.cwd(), "public");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "eligible-movies.json"),
    JSON.stringify(movies, null, 2)
  );

  console.log("Written to public/eligible-movies.json");
}

main().catch(console.error);
