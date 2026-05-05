"use client";

import { useState, useEffect } from "react";
import MovieCard from "./components/MovieCard";
import PlatformFilter from "./components/PlatformFilter";

interface Movie {
  title: string;
  year: number;
  tmdbId: number;
  posterPath: string | null;
  overview: string;
  providers: { id: number; name: string; logoPath: string }[];
}

const ALL_PLATFORMS = [
  { id: 8, name: "Netflix" },
  { id: 15, name: "Hulu" },
  { id: 258, name: "Criterion" },
];

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [activePlatforms, setActivePlatforms] = useState<number[]>(
    ALL_PLATFORMS.map((p) => p.id)
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/eligible-movies.json")
      .then((res) => res.json())
      .then((data) => {
        setMovies(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const filteredMovies = movies.filter((m) =>
    m.providers.some((p) => activePlatforms.includes(p.id))
  );

  function spin() {
    if (filteredMovies.length === 0) return;
    setSpinning(true);

    setTimeout(() => {
      const idx = Math.floor(Math.random() * filteredMovies.length);
      setCurrentMovie(filteredMovies[idx]);
      setSpinning(false);
    }, 800);
  }

  function togglePlatform(id: number) {
    setActivePlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#2E3440] px-4 py-12">
      <h1 className="text-4xl md:text-5xl font-bold text-[#ECEFF4] mb-2 tracking-tight">
        Mirdo Movie Madness
      </h1>
      <p className="text-[#D8DEE9] mb-8 text-lg">
        {loaded
          ? `${filteredMovies.length} movies waiting to be watched`
          : "Loading..."}
      </p>

      <PlatformFilter
        platforms={ALL_PLATFORMS}
        active={activePlatforms}
        onToggle={togglePlatform}
      />

      <button
        onClick={spin}
        disabled={spinning || filteredMovies.length === 0}
        className="relative mt-8 px-10 py-4 rounded-2xl text-xl font-bold text-[#2E3440] bg-gradient-to-r from-[#81A1C1] via-[#88C0D0] to-[#D08770] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#81A1C1]/20"
      >
        {spinning ? "Spinning..." : "🎬 Spin"}
      </button>

      {currentMovie && !spinning && (
        <div className="mt-10 w-full max-w-md animate-fade-in">
          <MovieCard movie={currentMovie} />
        </div>
      )}

      {spinning && (
        <div className="mt-10 w-full max-w-md flex justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-[#81A1C1] border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
