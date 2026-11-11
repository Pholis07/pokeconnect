import records from "./pokemon-data.json";

export type Move = {
  id: number;
  name: string;
  type: string;
  power: number;
  accuracy: number;
  pp: number;
  category: "physical" | "special";
};
export type Evolution = { id: number; name: string; parent: number; condition: string };
export type CatalogEntry = {
  id: number;
  name: string;
  generation: number;
  types: string[];
  stats: Record<string, number>;
  description: string;
  moves: Move[];
  evolutions: Evolution[];
};
export type Pokemon = CatalogEntry & {
  artwork: string;
  front: string;
  back: string;
  speciesUrl: string;
};
const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
export const catalog: Pokemon[] = (records as CatalogEntry[]).map((p) => ({
  ...p,
  artwork: `${SPRITES}/other/official-artwork/${p.id}.png`,
  front: `${SPRITES}/${p.id}.png`,
  back: `${SPRITES}/back/${p.id}.png`,
  speciesUrl: `https://pokeapi.co/api/v2/pokemon-species/${p.id}/`,
}));
export const byName = new Map(catalog.map((p) => [p.name, p]));
export const byId = new Map(catalog.map((p) => [p.id, p]));
export const GENERATIONS = [
  "Todas",
  "Kanto",
  "Johto",
  "Hoenn",
  "Sinnoh",
  "Teselia",
  "Kalos",
  "Alola",
  "Galar",
  "Paldea",
];
export const STAT_LABELS: Record<string, string> = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. especial",
  "special-defense": "Def. especial",
  speed: "Velocidad",
};
export const matches = (p: Pokemon, query: string) =>
  p.name.replace(/-/g, " ").includes(query.trim().toLowerCase()) ||
  `#${String(p.id).padStart(3, "0")}`.includes(query.trim());
