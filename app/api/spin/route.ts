import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const WATCH_REGION = "US";
const MAX_ATTEMPTS = 20;

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function scrapeTop500Slugs(): Promise<{ title: string; year: number; slug: string }[]> {
  const films: { title: string; year: number; slug: string }[] = [];
  let page = 1;

  while (true) {
    const url = `https://letterboxd.com/official/list/letterboxds-top-500-films/rss/page/${page}/`;
    let xml: string;
    try {
      xml = await fetchPage(url);
    } catch {
      break;
    }

    const $ = cheerio.load(xml, { xmlMode: true });
    const items = $("item");
    if (items.length === 0) break;

    items.each((_, el) => {
      const titleText = $(el).find("title").text();
      const link = $(el).find("link").text();
      const titleMatch = titleText.match(/^(.+?)\s*\((\d{4})\)/);
      const slugMatch = link.match(/\/film\/([^/]+)/);

      if (slugMatch) {
        films.push({
          title: titleMatch ? titleMatch[1].trim() : titleText.trim(),
          year: titleMatch ? parseInt(titleMatch[2]) : 0,
          slug: slugMatch[1],
        });
      }
    });

    page++;
  }

  return films;
}

async function scrapeWatchedSlugs(username: string): Promise<Set<string>> {
  const slugs = new Set<string>();
  let page = 1;

  while (true) {
    const url = `https://letterboxd.com/${username}/rss/page/${page}/`;
    let xml: string;
    try {
      xml = await fetchPage(url);
    } catch {
      break;
    }

    const $ = cheerio.load(xml, { xmlMode: true });
    const items = $("item");
    if (items.length === 0) break;

    items.each((_, el) => {
      const link = $(el).find("link").text();
      if (link) {
        const match = link.match(/letterboxd\.com\/.*\/film\/([^/]+)/);
        if (match) slugs.add(match[1]);
      }
    });

    page++;
  }

  return slugs;
}

async function searchTmdb(title: string, year?: number) {
  const params = new URLSearchParams({ api_key: TMDB_API_KEY!, query: title });
  if (year) params.set("year", year.toString());

  const res = await fetch(`https://api.themoviedb.org/3/search/movie?${params}`);
  const data = await res.json();

  if (data.results?.length > 0) {
    const movie = data.results[0];
    return {
      id: movie.id as number,
      posterPath: movie.poster_path as string | null,
      overview: movie.overview as string,
    };
  }
  return null;
}

async function getProviders(tmdbId: number) {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`
  );
  const data = await res.json();
  const regionData = data.results?.[WATCH_REGION];
  if (!regionData?.flatrate) return [];

  return regionData.flatrate.map(
    (p: { provider_id: number; provider_name: string; logo_path: string }) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path,
    })
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(request: NextRequest) {
  try {
    const { platforms } = (await request.json()) as { platforms: number[] };

    const [top500, mirandaWatched, elleenWatched] = await Promise.all([
      scrapeTop500Slugs(),
      scrapeWatchedSlugs("mirdathebirda"),
      scrapeWatchedSlugs("elleenpan"),
    ]);

    const watchedSet = new Set([...mirandaWatched, ...elleenWatched]);
    const eligible = top500.filter((f) => !watchedSet.has(f.slug));
    const shuffled = shuffle(eligible);

    for (let i = 0; i < Math.min(shuffled.length, MAX_ATTEMPTS); i++) {
      const film = shuffled[i];
      const tmdb = await searchTmdb(film.title, film.year || undefined);
      if (!tmdb) continue;

      const providers = await getProviders(tmdb.id);
      const matchesPlatform =
        platforms.length === 0 || providers.some((p: { id: number }) => platforms.includes(p.id));

      if (matchesPlatform) {
        return NextResponse.json({
          movie: {
            title: film.title,
            year: film.year,
            tmdbId: tmdb.id,
            posterPath: tmdb.posterPath,
            overview: tmdb.overview,
            providers,
          },
          eligibleCount: eligible.length,
        });
      }
    }

    return NextResponse.json({ movie: null, eligibleCount: eligible.length });
  } catch (err) {
    console.error("Spin error:", err);
    return NextResponse.json({ error: "Failed to fetch movie data" }, { status: 500 });
  }
}
