import { Image, type ImageProps } from "expo-image";
import { useTrainer } from "../lib/trainer";

export function OfflineImage({ uri, ...props }: Omit<ImageProps, "source"> & { uri: string }) {
  const { images } = useTrainer();
  return <Image source={{ uri: images[uri] ?? uri }} cachePolicy="memory-disk" {...props} />;
}
