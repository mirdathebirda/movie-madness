interface Movie {
  title: string;
  year: number;
  tmdbId: number;
  posterPath: string | null;
  overview: string;
  providers: { id: number; name: string; logoPath: string }[];
}

const PROVIDER_COLORS: Record<number, string> = {
  8: "bg-[#BF616A]",
  15: "bg-[#A3BE8C]",
  258: "bg-[#8FBCBB]",
  337: "bg-[#B48EAD]",
  1899: "bg-[#D08770]",
  531: "bg-[#81A1C1]",
  387: "bg-[#88C0D0]",
  2: "bg-[#EBCB8B]",
};

function getProviderColor(id: number): string {
  if (PROVIDER_COLORS[id]) return PROVIDER_COLORS[id];
  const colors = ["bg-[#81A1C1]", "bg-[#88C0D0]", "bg-[#8FBCBB]", "bg-[#B48EAD]", "bg-[#D08770]", "bg-[#A3BE8C]"];
  return colors[id % colors.length];
}

export default function MovieCard({ movie }: { movie: Movie }) {
  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w300${movie.posterPath}`
    : null;

  return (
    <div className="flex bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl border border-[#D8DEE9] ring-1 ring-[#81A1C1]/10">
      {posterUrl && (
        <img
          src={posterUrl}
          alt={`${movie.title} poster`}
          className="w-36 object-cover shrink-0"
        />
      )}
      <div className="p-4 flex flex-col justify-center min-w-0">
        <h2 className="text-lg font-bold text-[#2E3440] leading-tight">{movie.title}</h2>
        <p className="text-[#81A1C1] text-sm font-medium">{movie.year}</p>
        <p className="text-[#4C566A] mt-2 text-xs leading-relaxed line-clamp-3">
          {movie.overview}
        </p>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {movie.providers.map((p) => (
            <span
              key={p.id}
              className={`${getProviderColor(p.id)} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}
            >
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
