import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { cubicBezier, useReducedMotion } from "react-native-reanimated";
import { radius, useTheme } from "../theme";

type Props = { title: string; onPress: () => void; disabled?: boolean };

export function Button({ title, onPress, disabled = false }: Props) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      pressRetentionOffset={16}
      style={styles.wrap}
    >
      <Animated.View
        style={[
          styles.btn,
          {
            backgroundColor: t.tint,
            opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
            transform: [{ scale: pressed && !reduced ? 0.97 : 1 }],
            transitionProperty: ["transform", "opacity"],
            transitionDuration: 120,
            transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
          },
        ]}
      >
        <Text style={[styles.label, { color: t.onTint }]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "stretch" },
  btn: {
    minHeight: 56,
    padding: 14,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 17, fontWeight: "700" },
});
