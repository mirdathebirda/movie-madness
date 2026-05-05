"use client";

import { useState, useMemo } from "react";
import MovieCard from "./components/MovieCard";
import PlatformFilter from "./components/PlatformFilter";

interface Provider {
  id: number;
  name: string;
  logoPath: string;
}

interface Movie {
  title: string;
  year: number;
  tmdbId: number;
  posterPath: string | null;
  overview: string;
  providers: Provider[];
}

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

const KNOWN_PLATFORMS = [
  { id: 8, name: "Netflix" },
  { id: 9, name: "Amazon Prime Video" },
  { id: 15, name: "Hulu" },
  { id: 337, name: "Disney+" },
  { id: 1899, name: "Max" },
  { id: 531, name: "Paramount+" },
  { id: 387, name: "Peacock" },
  { id: 350, name: "Apple TV+" },
  { id: 258, name: "Criterion Channel" },
  { id: 2, name: "Apple TV" },
  { id: 386, name: "Peacock Premium" },
  { id: 37, name: "Showtime" },
  { id: 73, name: "Tubi" },
  { id: 300, name: "Pluto TV" },
  { id: 257, name: "fuboTV" },
  { id: 215, name: "Hoopla" },
  { id: 10, name: "Amazon Video" },
  { id: 192, name: "YouTube" },
  { id: 188, name: "YouTube Premium" },
  { id: 283, name: "Crunchyroll" },
  { id: 442, name: "AMC+" },
  { id: 230, name: "Kanopy" },
  { id: 191, name: "Starz" },
  { id: 100, name: "GuideDoc" },
  { id: 151, name: "BritBox" },
  { id: 296, name: "Raiplay" },
  { id: 11, name: "MUBI" },
];

async function discoverMovie(platformIds: number[]): Promise<Movie | null> {
  const randomPage = Math.floor(Math.random() * 5) + 1;
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    with_watch_providers: platformIds.join("|"),
    watch_region: "US",
    with_watch_monetization_types: "flatrate",
    sort_by: "vote_average.desc",
    "vote_count.gte": "200",
    page: randomPage.toString(),
  });

  const res = await fetch(
    `https://api.themoviedb.org/3/discover/movie?${params}`
  );
  const data = await res.json();

  if (!data.results || data.results.length === 0) return null;

  const randomIdx = Math.floor(Math.random() * data.results.length);
  const picked = data.results[randomIdx];

  const provRes = await fetch(
    `https://api.themoviedb.org/3/movie/${picked.id}/watch/providers?api_key=${TMDB_API_KEY}`
  );
  const provData = await provRes.json();
  const flatrate = provData.results?.US?.flatrate || [];
  const providers: Provider[] = flatrate.map((p: { provider_id: number; provider_name: string; logo_path: string }) => ({
    id: p.provider_id,
    name: p.provider_name,
    logoPath: p.logo_path,
  }));

  return {
    title: picked.title,
    year: picked.release_date ? parseInt(picked.release_date.slice(0, 4)) : 0,
    tmdbId: picked.id,
    posterPath: picked.poster_path,
    overview: picked.overview,
    providers,
  };
}

export default function Home() {
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [activePlatforms, setActivePlatforms] = useState<number[]>([8, 1899, 15, 11, 258]);
  const [noMatch, setNoMatch] = useState(false);

  const allPlatforms = useMemo(() => {
    return [...KNOWN_PLATFORMS].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  async function spin() {
    if (activePlatforms.length === 0) return;
    setSpinning(true);
    setNoMatch(false);

    const movie = await discoverMovie(activePlatforms);

    if (movie) {
      setCurrentMovie(movie);
    } else {
      setNoMatch(true);
      setCurrentMovie(null);
    }

    setSpinning(false);
  }

  function togglePlatform(id: number) {
    setActivePlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <h1 className="text-4xl md:text-5xl font-bold text-[#2E3440] mb-2 tracking-tight">
        Movie Madness
      </h1>
      <p className="text-[#4C566A] mb-8 text-lg font-medium">
        Select your platforms, then spin
      </p>

      <PlatformFilter
        platforms={allPlatforms}
        active={activePlatforms}
        onToggle={togglePlatform}
      />

      <button
        onClick={spin}
        disabled={spinning || activePlatforms.length === 0}
        className="relative mt-8 px-10 py-4 rounded-2xl text-xl font-bold text-white bg-gradient-to-r from-[#81A1C1] via-[#88C0D0] to-[#D08770] animate-gradient animate-pulse-glow transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none"
      >
        {spinning ? "Searching..." : "🎬 Spin"}
      </button>

      {noMatch && !spinning && (
        <p className="mt-6 text-[#BF616A] font-medium">
          No match found — try selecting more platforms
        </p>
      )}

      {currentMovie && !spinning && (
        <div className="mt-10 w-full max-w-md animate-fade-in">
          <MovieCard movie={currentMovie} />
        </div>
      )}

      {spinning && (
        <div className="mt-10 w-full max-w-md flex justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-[#81A1C1] border-t-[#D08770] animate-spin" />
        </div>
      )}
    </div>
  );
}
