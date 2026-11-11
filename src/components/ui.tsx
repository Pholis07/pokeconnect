import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, useTheme } from "../theme";

export function Page({ title, children }: { title: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[ui.page, { paddingBottom: insets.bottom + 24 }]}
      >
        {children}
      </ScrollView>
    </>
  );
}
export function Section({ title, children }: { title: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
      style={[ui.panel, { backgroundColor: t.card, borderColor: t.line }]}
    >
      <Text accessibilityRole="header" style={[ui.heading, { color: t.text }]}>
        {title}
      </Text>
      {children}
    </Animated.View>
  );
}
export function Choice({
  title,
  selected,
  disabled,
  onPress,
}: {
  title: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.choice,
        {
          backgroundColor: selected ? t.tint : t.card,
          borderColor: selected ? t.tint : t.line,
          opacity: disabled ? 0.45 : pressed ? 0.65 : 1,
        },
      ]}
    >
      <Text style={{ color: selected ? t.onTint : t.text, fontWeight: "600", textAlign: "center" }}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Copy({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={[ui.copy, { color: t.sub }]}>{children}</Text>;
}
export const ui = StyleSheet.create({
  page: { padding: 20, gap: 20, width: "100%", maxWidth: 760, alignSelf: "center" },
  panel: { padding: 20, gap: 14, borderRadius: radius.card, borderWidth: 1 },
  heading: { fontSize: 21, fontWeight: "800", letterSpacing: -0.5 },
  copy: { fontSize: 15, lineHeight: 23 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" },
  choice: {
    borderRadius: radius.button,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 16, padding: 14, fontSize: 16 },
  big: { fontSize: 34, fontWeight: "800", letterSpacing: -1 },
  muted: { fontSize: 13, lineHeight: 20 },
  empty: { padding: 24, gap: 12, alignItems: "center" },
});
