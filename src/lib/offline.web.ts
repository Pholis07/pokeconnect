import { updateTrainer } from "./trainer";
import { byName } from "./catalog";

export async function saveImages(urls: string[]): Promise<Record<string, string>> {
  const pairs = await Promise.all(
    [...new Set(urls)].map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("No se pudo descargar la imagen.");
      const blob = await response.blob();
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      return [url, data] as const;
    }),
  );
  return Object.fromEntries(pairs);
}
export async function savePokemon(name: string) {
  const pokemon = byName.get(name);
  if (!pokemon) throw new Error("No encontramos ese Pokémon.");
  const images = await saveImages([pokemon.artwork, pokemon.front]);
  try {
    Object.assign(images, await saveImages([pokemon.back]));
  } catch {
    images[pokemon.back] = images[pokemon.front];
  }
  await updateTrainer((s) => ({
    ...s,
    images: { ...s.images, ...images },
    saved: [...new Set([...s.saved, name])],
  }));
}
