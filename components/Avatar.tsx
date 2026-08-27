// Todos los tonos son suficientemente claros para texto negro encima — la
// marca del programa es negro + dorado, sin colores fuera de esa paleta.
const PALETTE = [
  "bg-primary",
  "bg-accent",
  "bg-gray-600",
  "bg-gray-700",
  "bg-gray-800",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % PALETTE.length;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-base",
  lg: "h-20 w-20 text-2xl",
};

export function Avatar({
  name,
  imageUrl,
  size = "md",
}: {
  name: string;
  imageUrl?: string | null;
  size?: keyof typeof SIZES;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={`${SIZES[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${SIZES[size]} ${colorFor(name)} flex items-center justify-center rounded-full font-semibold text-bg`}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
