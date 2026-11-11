import { Directory, File, Paths } from "expo-file-system";
import { updateTrainer } from "./trainer";
import { byName } from "./catalog";

export async function saveImages(urls: string[]): Promise<Record<string, string>> {
  const directory = new Directory(Paths.document, "pokeconnect-images");
  directory.create({ idempotent: true, intermediates: true });
  const pairs = await Promise.all(
    [...new Set(urls)].map(async (url) => {
      const file = new File(directory, encodeURIComponent(url));
      let result = file;
      if (!file.exists) {
        try {
          result = await File.downloadFileAsync(url, file, { idempotent: true });
        } catch (error) {
          if (file.exists) file.delete();
          throw error;
        }
      }
      return [url, result.uri] as const;
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
