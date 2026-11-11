import { useEffect } from "react";
import { TextInput, type StyleProp, type TextStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedInput = Animated.createAnimatedComponent(TextInput);

// El texto cambia en el hilo de UI; React no renderiza cada número intermedio.
export function CountUp({
  value,
  style,
  suffix = "Pokémon",
  label,
}: {
  value: number;
  style?: StyleProp<TextStyle>;
  suffix?: string;
  label?: string;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? value : 0);
  useEffect(() => {
    progress.set(
      reduced
        ? value
        : withTiming(value, { duration: 260, easing: Easing.bezier(0.23, 1, 0.32, 1) }),
    );
  }, [value, reduced, progress]);
  const animatedProps = useAnimatedProps(() => {
    const text = `${Math.round(progress.get())} ${suffix}`;
    return { text, defaultValue: text };
  });
  return (
    <AnimatedInput
      editable={false}
      caretHidden
      pointerEvents="none"
      accessibilityLabel={label ?? `${value} ${suffix}`}
      underlineColorAndroid="transparent"
      defaultValue={`${reduced ? value : 0} ${suffix}`}
      animatedProps={animatedProps}
      style={[{ padding: 0, fontVariant: ["tabular-nums"] }, style]}
    />
  );
}
