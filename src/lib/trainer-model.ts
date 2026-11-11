export type SavedCard = { id: string; lang: "es" | "en"; name: string; image: string };
export type TrainerData = {
  favorites: string[];
  team: string[];
  compare: string[];
  seen: string[];
  wins: string[];
  stamps: string[];
  cards: SavedCard[];
  images: Record<string, string>;
  saved: string[];
};
export const emptyTrainer = (): TrainerData => ({
  favorites: [],
  team: [],
  compare: [],
  seen: [],
  wins: [],
  stamps: [],
  cards: [],
  images: {},
  saved: [],
});
export function toggleMember(items: string[], name: string, limit = Infinity) {
  if (items.includes(name)) return items.filter((item) => item !== name);
  if (items.length >= limit)
    throw new Error(`El máximo es ${limit}. Quita un Pokémon antes de añadir otro.`);
  return [...items, name];
}
export function parseTrainer(raw: string | null): TrainerData {
  if (!raw) return emptyTrainer();
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("No se pudo leer tu progreso guardado.");
  const base = emptyTrainer();
  for (const key of ["favorites", "team", "compare", "seen", "wins", "stamps", "saved"] as const) {
    if (
      parsed[key] !== undefined &&
      (!Array.isArray(parsed[key]) || !parsed[key].every((v: unknown) => typeof v === "string"))
    )
      throw new Error("El progreso guardado tiene un formato inesperado.");
    base[key] = [...new Set<string>(parsed[key] ?? [])];
  }
  if (base.team.length > 6 || base.compare.length > 2)
    throw new Error("El equipo guardado tiene más plazas de las permitidas.");
  if (
    parsed.cards !== undefined &&
    (!Array.isArray(parsed.cards) ||
      !parsed.cards.every(
        (c: SavedCard) =>
          c &&
          typeof c.id === "string" &&
          typeof c.name === "string" &&
          typeof c.image === "string" &&
          ["es", "en"].includes(c.lang),
      ))
  )
    throw new Error("No se pudo leer el álbum guardado.");
  base.cards = parsed.cards ?? [];
  if (
    parsed.images !== undefined &&
    (!parsed.images ||
      typeof parsed.images !== "object" ||
      Array.isArray(parsed.images) ||
      !Object.values(parsed.images).every((v) => typeof v === "string"))
  )
    throw new Error("No se pudieron leer las imágenes guardadas.");
  base.images = parsed.images ?? {};
  return base;
}
