interface Platform {
  id: number;
  name: string;
}

const PLATFORM_COLORS: Record<number, { active: string; inactive: string }> = {
  8: {
    active: "bg-[#BF616A] text-[#2E3440]",
    inactive: "bg-[#3B4252] text-[#BF616A] border border-[#BF616A]",
  },
  15: {
    active: "bg-[#88C0D0] text-[#2E3440]",
    inactive: "bg-[#3B4252] text-[#88C0D0] border border-[#88C0D0]",
  },
  258: {
    active: "bg-[#8FBCBB] text-[#2E3440]",
    inactive: "bg-[#3B4252] text-[#8FBCBB] border border-[#8FBCBB]",
  },
};

export default function PlatformFilter({
  platforms,
  active,
  onToggle,
}: {
  platforms: Platform[];
  active: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <div className="flex gap-3 flex-wrap justify-center">
      {platforms.map((platform) => {
        const isActive = active.includes(platform.id);
        const colors = PLATFORM_COLORS[platform.id];
        return (
          <button
            key={platform.id}
            onClick={() => onToggle(platform.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
              isActive ? colors.active : colors.inactive
            }`}
          >
            {platform.name}
          </button>
        );
      })}
    </div>
  );
}
