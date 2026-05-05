interface Movie {
  title: string;
  year: number;
  tmdbId: number;
  posterPath: string | null;
  overview: string;
  providers: { id: number; name: string; logoPath: string }[];
}

const PROVIDER_COLORS: Record<number, string> = {
  8: "bg-[#BF616A]", // Netflix — red
  15: "bg-[#88C0D0]", // Hulu — cyan
  258: "bg-[#8FBCBB]", // Criterion — sea green
};

export default function MovieCard({ movie }: { movie: Movie }) {
  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    : null;

  return (
    <div className="bg-[#3B4252] rounded-2xl overflow-hidden shadow-xl border border-[#4C566A]">
      {posterUrl && (
        <img
          src={posterUrl}
          alt={`${movie.title} poster`}
          className="w-full h-auto object-cover"
        />
      )}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-[#ECEFF4]">{movie.title}</h2>
        <p className="text-[#D8DEE9] text-sm mt-1">{movie.year}</p>
        <p className="text-[#D8DEE9] mt-3 text-sm leading-relaxed line-clamp-4">
          {movie.overview}
        </p>
        <div className="flex gap-2 mt-4 flex-wrap">
          {movie.providers.map((p) => (
            <span
              key={p.id}
              className={`${PROVIDER_COLORS[p.id] || "bg-[#4C566A]"} text-[#2E3440] text-xs font-bold px-3 py-1 rounded-full`}
            >
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
