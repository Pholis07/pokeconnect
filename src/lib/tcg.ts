import AsyncStorage from "@react-native-async-storage/async-storage";
export type CardBrief = { id: string; localId: string; name: string; image?: string };
export type CardDetail = CardBrief & {
  rarity?: string;
  illustrator?: string;
  hp?: number;
  types?: string[];
  set: { id: string; name: string };
  attacks?: { name: string; damage?: string | number; effect?: string }[];
};
export type CardLanguage = "es" | "en";
const API = "https://api.tcgdex.net/v2";
const inFlight = new Map<string, Promise<unknown>>();
async function cachedJSON<T>(url: string): Promise<T> {
  const pending = inFlight.get(url);
  if (pending) return pending as Promise<T>;
  const operation = (async () => {
    const key = `pokeconnect.tcg.v1:${url}`;
    const stored = await AsyncStorage.getItem(key).catch(() => null);
    if (stored) {
      try {
        return JSON.parse(stored) as T;
      } catch {
        /* La caché dañada se vuelve a descargar. */
      }
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`No se pudieron cargar las cartas (${response.status}).`);
      const value = await response.json();
      // La caché es opcional: un fallo de almacenamiento no debe ocultar datos descargados.
      await AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
      return value as T;
    } finally {
      clearTimeout(timer);
    }
  })();
  inFlight.set(url, operation);
  void operation.then(
    () => inFlight.delete(url),
    () => inFlight.delete(url),
  );
  return operation;
}
export async function listCards(lang: CardLanguage, query: string, dex: string, page: number) {
  const params = new URLSearchParams({
    "pagination:page": String(page),
    "pagination:itemsPerPage": "20",
    image: "notnull:",
  });
  if (query.trim()) params.set("name", query.trim());
  if (dex) params.set("dexId", `eq:${dex}`);
  const value = await cachedJSON<CardBrief[]>(`${API}/${lang}/cards?${params}`);
  if (!Array.isArray(value))
    throw new Error("La respuesta de cartas no tiene el formato esperado.");
  return value.filter(
    (c) => typeof c.id === "string" && typeof c.name === "string" && typeof c.image === "string",
  );
}
export async function getCard(lang: CardLanguage, id: string) {
  const value = await cachedJSON<CardDetail>(`${API}/${lang}/cards/${encodeURIComponent(id)}`);
  if (!value || typeof value.name !== "string" || !value.set)
    throw new Error("No se pudo leer esta carta.");
  return value;
}
export const cardImage = (image: string, quality: "low" | "high" = "low") =>
  `${image}/${quality}.webp`;
