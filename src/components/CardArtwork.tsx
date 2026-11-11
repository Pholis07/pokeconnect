import { StyleSheet, Text, View } from "react-native";
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
import { OfflineImage } from "./OfflineImage";
import { useTheme } from "../theme";

export function CardArtwork({ uri, name }: { uri: string; name: string }) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const rotateX = useSharedValue(0),
    rotateY = useSharedValue(0),
    lightX = useSharedValue(0),
    lightY = useSharedValue(0),
    light = useSharedValue(0);
  const gesture = usePanGesture({
    activeOffsetX: [-8, 8],
    failOffsetY: [-14, 14],
    maxPointers: 1,
    onBegin: (e) => {
      lightX.set(e.x);
      lightY.set(e.y);
      light.set(withTiming(0.18, { duration: 120 }));
    },
    onUpdate: (e) => {
      lightX.set(e.x);
      lightY.set(e.y);
      if (!reduced) {
        rotateX.set(Math.max(-6, Math.min(6, -e.translationY / 16)));
        rotateY.set(Math.max(-9, Math.min(9, e.translationX / 16)));
      }
    },
    onDeactivate: (e) => {
      rotateX.set(
        withSpring(0, {
          duration: 400,
          dampingRatio: 1,
          velocity: -e.velocityY / 16,
          reduceMotion: ReduceMotion.System,
        }),
      );
      rotateY.set(
        withSpring(0, {
          duration: 400,
          dampingRatio: 1,
          velocity: e.velocityX / 16,
          reduceMotion: ReduceMotion.System,
        }),
      );
    },
    onFinalize: () => light.set(withTiming(0, { duration: 140 })),
  });
  const card = useAnimatedStyle(() => ({
    transform: [
      { perspective: 950 },
      { rotateX: `${rotateX.get()}deg` },
      { rotateY: `${rotateY.get()}deg` },
    ],
  }));
  const glare = useAnimatedStyle(() => ({
    opacity: light.get(),
    transform: [{ translateX: lightX.get() - 100 }, { translateY: lightY.get() - 100 }],
  }));
  return (
    <View style={{ gap: 10 }}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
          style={[styles.frame, { backgroundColor: t.line }, card]}
        >
          <OfflineImage
            uri={uri}
            style={styles.image}
            contentFit="contain"
            accessibilityLabel={`Carta ${name} a tamaño completo`}
          />
          <Animated.View pointerEvents="none" style={[styles.glare, glare]} />
        </Animated.View>
      </GestureDetector>
      <Text style={{ color: t.sub, textAlign: "center", fontSize: 12 }}>
        {reduced ? "Toca la carta para iluminarla" : "Arrastra de lado para inclinar la carta"}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  frame: { width: "100%", aspectRatio: 0.727, borderRadius: 18, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  glare: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#FFFFFF",
  },
});
