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

export default function Home() {
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [activePlatforms, setActivePlatforms] = useState<number[]>([8, 1899, 15, 11, 258]);
  const [noMatch, setNoMatch] = useState(false);
  const [movieCount, setMovieCount] = useState<number | null>(null);

  const allPlatforms = useMemo(() => {
    return [...KNOWN_PLATFORMS].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  async function spin() {
    if (activePlatforms.length === 0) {
      setNoMatch(true);
      setCurrentMovie(null);
      return;
    }

    setSpinning(true);
    setNoMatch(false);

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms: activePlatforms }),
      });
      const data = await res.json();

      setMovieCount(data.eligibleCount ?? null);

      if (!data.movie) {
        setNoMatch(true);
        setCurrentMovie(null);
      } else {
        setCurrentMovie(data.movie);
      }
    } catch (err) {
      console.error(err);
      setNoMatch(true);
      setCurrentMovie(null);
    } finally {
      setSpinning(false);
    }
  }

  function togglePlatform(id: number) {
    setActivePlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex items-center justify-center h-screen overflow-hidden px-8 gap-12">
      <div className="flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[#2E3440] mb-2 tracking-tight">
          Movie Madness
        </h1>
        <p className="text-[#4C566A] mb-4 text-lg font-medium">
          Top 500 films neither of us has watched
        </p>

        <PlatformFilter
          platforms={allPlatforms}
          active={activePlatforms}
          onToggle={togglePlatform}
        />

        <button
          onClick={spin}
          disabled={spinning || activePlatforms.length === 0}
          className="relative mt-6 px-10 py-4 rounded-2xl text-xl font-bold text-white bg-gradient-to-r from-[#81A1C1] via-[#88C0D0] to-[#D08770] animate-gradient animate-pulse-glow transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none"
        >
          {spinning ? "Searching..." : "🎬 Spin"}
        </button>

        {movieCount !== null && (
          <p className="mt-3 text-xs text-[#4C566A]">
            {movieCount} films available on selected platforms
          </p>
        )}

        {noMatch && !spinning && (
          <p className="mt-2 text-[#BF616A] font-medium">
            No match found — try selecting more platforms
          </p>
        )}
      </div>

      <div className="w-80 flex items-center justify-center">
        {currentMovie && !spinning && (
          <div className="animate-fade-in">
            <MovieCard movie={currentMovie} />
          </div>
        )}

        {spinning && (
          <div className="w-12 h-12 rounded-full border-4 border-[#81A1C1] border-t-[#D08770] animate-spin" />
        )}
      </div>
    </div>
  );
}
