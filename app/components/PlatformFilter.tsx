"use client";

import { useState } from "react";

interface Platform {
  id: number;
  name: string;
}

const ACCENT_COLORS = [
  "bg-[#BF616A]",
  "bg-[#D08770]",
  "bg-[#EBCB8B]",
  "bg-[#A3BE8C]",
  "bg-[#8FBCBB]",
  "bg-[#88C0D0]",
  "bg-[#81A1C1]",
  "bg-[#B48EAD]",
];

function getColor(index: number): string {
  return ACCENT_COLORS[index % ACCENT_COLORS.length];
}

export default function PlatformFilter({
  platforms,
  active,
  onToggle,
}: {
  platforms: Platform[];
  active: number[];
  onToggle: (id: number) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = platforms.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-md">
      <input
        type="text"
        placeholder="Search platforms..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 rounded-xl bg-white border border-[#D8DEE9] text-[#2E3440] placeholder-[#4C566A]/50 focus:outline-none focus:ring-2 focus:ring-[#81A1C1] mb-3 text-sm"
      />
      <div className="flex gap-2 flex-wrap justify-center max-h-40 overflow-y-auto">
        {filtered.map((platform, i) => {
          const isActive = active.includes(platform.id);
          const color = getColor(i);
          return (
            <button
              key={platform.id}
              onClick={() => onToggle(platform.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? `${color} text-white shadow-sm`
                  : "bg-white text-[#4C566A] border border-[#D8DEE9] hover:border-[#81A1C1]"
              }`}
            >
              {platform.name}
            </button>
          );
        })}
      </div>
      {platforms.length > 0 && (
        <p className="text-center text-xs text-[#4C566A] mt-2">
          {active.length} of {platforms.length} selected
        </p>
      )}
    </div>
  );
}
