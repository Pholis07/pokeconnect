import { byName, byId, type Pokemon } from "./catalog";
import names from "./pokemon-names.json";
export type { Pokemon } from "./catalog";

export const API = "https://pokeapi.co/api/v2";
const MIRROR = "https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2";
const ids = new Map(names.map((name, i) => [name, i + 1]));
const cache = new Map<string, Promise<any>>();

async function request(url: string, timeout: number): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

// La copia oficial permite seguir usando fichas y combates si pokeapi.co no responde.
export const get = (url: string): Promise<any> => {
  let hit = cache.get(url);
  if (!hit) {
    hit = request(url, 4000).catch((error) => {
      if (!url.startsWith(`${API}/`) || url.includes("?")) throw error;
      const path = url.slice(API.length).replace(/\/$/, "");
      return request(`${MIRROR}${path}/index.json`, 10000);
    });
    hit.catch(() => cache.delete(url));
    cache.set(url, hit);
  }
  return hit;
};

export const idOf = (url: string) => url.split("/").filter(Boolean).pop()!;

// Único lugar que conoce la forma de /pokemon/<x>; las pantallas reciben este tipo.
export const fetchPokemon = async (nameOrId: string | number): Promise<Pokemon> => {
  const local =
    typeof nameOrId === "number"
      ? byId.get(nameOrId)
      : (byName.get(nameOrId) ?? byId.get(Number(nameOrId)));
  if (local) return local;
  const id = typeof nameOrId === "string" ? (ids.get(nameOrId) ?? nameOrId) : nameOrId;
  const p = await get(`${API}/pokemon/${id}`);
  return {
    generation: 0,
    description: "Sin descripción disponible.",
    moves: [],
    evolutions: [],
    id: p.id,
    name: p.name,
    types: p.types.map((x: any) => x.type.name),
    stats: Object.fromEntries(p.stats.map((s: any) => [s.stat.name, s.base_stat])),
    artwork: p.sprites.other["official-artwork"].front_default ?? p.sprites.front_default,
    front: p.sprites.front_default,
    back: p.sprites.back_default ?? p.sprites.front_default,
    speciesUrl: p.species.url,
  };
};
