"use client";

import { useState, useMemo, useEffect } from "react";
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

interface EligibleFilm {
  title: string;
  year: number;
  tmdbId: number;
  posterPath: string | null;
  overview: string;
}

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_PATH = "/movie-madness";
const MAX_ATTEMPTS = 15;

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

async function getProviders(tmdbId: number): Promise<Provider[]> {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`
  );
  const data = await res.json();
  const flatrate = data.results?.US?.flatrate || [];
  return flatrate.map((p: { provider_id: number; provider_name: string; logo_path: string }) => ({
    id: p.provider_id,
    name: p.provider_name,
    logoPath: p.logo_path,
  }));
}

export default function Home() {
  const [eligibleFilms, setEligibleFilms] = useState<EligibleFilm[]>([]);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [activePlatforms, setActivePlatforms] = useState<number[]>([8, 1899, 15, 11, 258]);
  const [noMatch, setNoMatch] = useState(false);

  useEffect(() => {
    fetch(`${BASE_PATH}/eligible-movies.json`)
      .then((res) => res.json())
      .then((data: EligibleFilm[]) => setEligibleFilms(data))
      .catch(console.error);
  }, []);

  const allPlatforms = useMemo(() => {
    return [...KNOWN_PLATFORMS].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  async function spin() {
    if (activePlatforms.length === 0 || eligibleFilms.length === 0) {
      setNoMatch(true);
      setCurrentMovie(null);
      return;
    }

    setSpinning(true);
    setNoMatch(false);

    const shuffled = [...eligibleFilms].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(shuffled.length, MAX_ATTEMPTS); i++) {
      const film = shuffled[i];
      const providers = await getProviders(film.tmdbId);
      const matches = providers.some((p) => activePlatforms.includes(p.id));

      if (matches) {
        setCurrentMovie({ ...film, providers });
        setSpinning(false);
        return;
      }
    }

    setNoMatch(true);
    setCurrentMovie(null);
    setSpinning(false);
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

        <p className="mt-3 text-xs text-[#4C566A]">
          {eligibleFilms.length} films in pool
        </p>

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
