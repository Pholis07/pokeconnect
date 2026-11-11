import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../theme";

function Spark({ index, color }: { index: number; color: string }) {
  const progress = useSharedValue(0);
  const angle = (index / 10) * Math.PI * 2;
  useEffect(() => {
    progress.set(withTiming(1, { duration: 280, easing: Easing.bezier(0.23, 1, 0.32, 1) }));
  }, [progress]);
  const motion = useAnimatedStyle(() => ({
    opacity: 1 - progress.get(),
    transform: [
      { translateX: Math.cos(angle) * 86 * progress.get() },
      { translateY: Math.sin(angle) * 50 * progress.get() },
      { rotate: `${angle}rad` },
      { scale: 1 - 0.5 * progress.get() },
    ],
  }));
  return <Animated.View style={[styles.spark, { backgroundColor: color }, motion]} />;
}

export function VictorySpark() {
  const t = useTheme();
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <View pointerEvents="none" accessible={false} style={styles.burst}>
      {Array.from({ length: 10 }, (_, i) => (
        <Spark key={i} index={i} color={i % 2 ? t.tint : t.text} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  burst: { position: "absolute", top: "50%", left: "50%", width: 0, height: 0 },
  spark: { position: "absolute", width: 12, height: 4, borderRadius: 2 },
});
