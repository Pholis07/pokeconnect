import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { OfflineImage } from "./OfflineImage";
import Animated, { cubicBezier, useReducedMotion } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { byName } from "../lib/catalog";
import { num, pretty, radius, TYPE_COLORS, useTheme } from "../theme";
import { TypeChip } from "./TypeChip";

const GAP = 12;

const sprite = (id: string) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

type Props = { name: string; url: string; onPress: () => void };

export function PokemonRow({ name, onPress }: Props) {
  const t = useTheme();
  const pokemon = byName.get(name);
  const id = String(pokemon?.id ?? 0);
  const types = pokemon?.types ?? [];
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();

  const accent = types[0] ? TYPE_COLORS[types[0]] : undefined;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          transform: [{ scale: pressed && !reduced ? 0.98 : 1 }],
          transitionProperty: "transform",
          transitionDuration: 120,
          transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${pretty(name)}, ${num(id)}`}
        pressRetentionOffset={16}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[styles.row, { backgroundColor: t.card, borderColor: pressed ? t.tint : t.line }]}
        onPress={onPress}
      >
        <View style={[styles.disc, { backgroundColor: accent ? `${accent}${t.wash}` : t.bg }]}>
          <OfflineImage uri={sprite(id)} style={styles.img} recyclingKey={name} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.num, { color: t.sub }]}>{num(id)}</Text>
          <Text style={[styles.name, { color: t.text }]} numberOfLines={1}>
            {pretty(name)}
          </Text>
          <View style={styles.chips}>
            {types.map((ty) => (
              <TypeChip key={ty} type={ty} small />
            ))}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={t.sub} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { minHeight: 104, marginBottom: GAP },
  row: {
    minHeight: 104,
    borderWidth: 1,
    borderRadius: radius.row,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  disc: { width: 76, height: 76, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  img: { width: 76, height: 76 },
  text: { flex: 1, gap: 4 },
  name: { fontSize: 19, fontWeight: "700", textTransform: "capitalize" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, minHeight: 20 }, // altura reservada: no hay salto al llegar los tipos
  num: { fontSize: 12, fontWeight: "600", fontVariant: ["tabular-nums"], paddingRight: 8 },
});
