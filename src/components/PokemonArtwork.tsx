import { StyleSheet, Text } from "react-native";
import { OfflineImage } from "./OfflineImage";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { num, pretty, useTheme } from "../theme";
import type { Pokemon } from "../lib/pokeapi";

export function PokemonArtwork({ pokemon, accent }: { pokemon: Pokemon; accent: string }) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const lightX = useSharedValue(0);
  const lightY = useSharedValue(0);
  const light = useSharedValue(0);
  const gesture = usePanGesture({
    activeOffsetX: [-8, 8],
    failOffsetY: [-12, 12],
    maxPointers: 1,
    onBegin: (e) => {
      lightX.set(e.x);
      lightY.set(e.y);
      light.set(withTiming(0.22, { duration: 120 }));
    },
    onUpdate: (e) => {
      lightX.set(e.x);
      lightY.set(e.y);
      if (!reduced) {
        tiltX.set(Math.max(-7, Math.min(7, -e.translationY / 12)));
        tiltY.set(Math.max(-9, Math.min(9, e.translationX / 12)));
      }
    },
    onDeactivate: (e) => {
      tiltX.set(
        withSpring(0, {
          duration: 400,
          dampingRatio: 1,
          velocity: -e.velocityY / 12,
          reduceMotion: ReduceMotion.System,
        }),
      );
      tiltY.set(
        withSpring(0, {
          duration: 400,
          dampingRatio: 1,
          velocity: e.velocityX / 12,
          reduceMotion: ReduceMotion.System,
        }),
      );
    },
    onFinalize: () => {
      light.set(withTiming(0, { duration: 160 }));
    },
  });
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 850 },
      { rotateX: `${tiltX.get()}deg` },
      { rotateY: `${tiltY.get()}deg` },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: light.get(),
    transform: [{ translateX: lightX.get() - 110 }, { translateY: lightY.get() - 110 }],
  }));
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
        style={[
          styles.card,
          { backgroundColor: `${accent}${t.wash}`, borderColor: `${accent}66` },
          cardStyle,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.light, { backgroundColor: accent }, glowStyle]}
        />
        <Text style={[styles.number, { color: t.sub }]}>{num(pokemon.id)}</Text>
        <OfflineImage
          uri={pokemon.artwork}
          style={styles.artwork}
          contentFit="contain"
          accessibilityLabel={pretty(pokemon.name)}
        />
        <Text style={[styles.hint, { color: t.sub }]}>
          {reduced ? "Toca para iluminar" : "Arrastra de lado para explorar la ficha"}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 0,
    marginBottom: 0,
    padding: 20,
    borderRadius: 32,
    borderWidth: 1,
    overflow: "hidden",
  },
  light: { position: "absolute", left: 0, top: 0, width: 220, height: 220, borderRadius: 110 },
  number: { fontSize: 18, fontWeight: "700", fontVariant: ["tabular-nums"] },
  artwork: { width: "100%", height: 260 },
  hint: { fontSize: 12, textAlign: "center", paddingTop: 8 },
});
