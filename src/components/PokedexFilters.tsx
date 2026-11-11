import { useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { BottomSheet } from "@expo/ui";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GENERATIONS } from "../lib/catalog";
import { TYPE_COLORS, TYPE_ES, useTheme } from "../theme";

type Field = "type" | "generation";
type Props = {
  type: string;
  generation: number;
  favoritesOnly: boolean;
  resultCount: number;
  onTypeChange: (type: string) => void;
  onGenerationChange: (generation: number) => void;
  onFavoritesChange: () => void;
  onReset: () => void;
};
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
const regionName = (index: number) => (index === 8 ? "Galar y Hisui" : GENERATIONS[index]);

function FilterChip({
  label,
  accessibilityLabel,
  selected,
  expanded,
  icon,
  color,
  onPress,
  compact = false,
}: {
  label?: string;
  accessibilityLabel: string;
  selected?: boolean;
  expanded?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  onPress: () => void;
  compact?: boolean;
}) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected, ...(expanded === undefined ? {} : { expanded }) }}
      aria-expanded={expanded}
      aria-pressed={compact ? !!selected : undefined}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={() => {
        setFocused(false);
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        compact ? styles.favorite : styles.selector,
        {
          backgroundColor: selected ? `${t.tint}14` : t.card,
          borderColor: selected || focused ? t.tint : t.line,
          opacity: pressed ? 0.65 : 1,
          outlineColor: t.tint,
          outlineStyle: "solid",
          outlineWidth: focused ? 2 : 0,
          outlineOffset: 3,
        },
      ]}
    >
      {color ? (
        <View accessible={false} style={[styles.dot, { backgroundColor: color }]} />
      ) : (
        <Ionicons
          name={icon}
          size={compact ? 21 : 18}
          color={selected ? t.tint : t.sub}
          accessible={false}
        />
      )}
      {label && (
        <Text style={[styles.chipLabel, { color: selected ? t.text : t.sub }]}>{label}</Text>
      )}
      {!compact && (
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={t.sub}
          accessible={false}
        />
      )}
    </Pressable>
  );
}

export function PokedexFilters({
  type,
  generation,
  favoritesOnly,
  resultCount,
  onTypeChange,
  onGenerationChange,
  onFavoritesChange,
  onReset,
}: Props) {
  const t = useTheme();
  const { height, width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [field, setField] = useState<Field>("type");
  const [presented, setPresented] = useState(false);
  const [focusedOption, setFocusedOption] = useState<string | null>(null);
  const active = type !== "all" || generation !== 0 || favoritesOnly;
  const singleColumn = width < 360 || fontScale > 1.3;
  const options =
    field === "type"
      ? [
          { value: "all", label: "Todos los tipos", detail: "", color: undefined },
          ...Object.entries(TYPE_ES).map(([value, label]) => ({
            value,
            label,
            detail: "",
            color: TYPE_COLORS[value],
          })),
        ]
      : GENERATIONS.map((_, index) => ({
          value: String(index),
          label: index ? regionName(index) : "Todas las regiones",
          detail: index ? `Generación ${ROMAN[index]}` : "Las nueve generaciones",
          color: undefined,
        }));
  const selected = field === "type" ? type : String(generation);
  const open = (next: Field) => {
    Keyboard.dismiss();
    setField(next);
    setPresented(true);
  };
  const choose = (value: string) => {
    if (field === "type") onTypeChange(value);
    else onGenerationChange(Number(value));
    setPresented(false);
    void Haptics.selectionAsync();
  };
  return (
    <View style={styles.filters}>
      <View style={styles.toolbar}>
        <FilterChip
          label={type === "all" ? "Tipo" : TYPE_ES[type]}
          accessibilityLabel={`Filtrar por tipo: ${type === "all" ? "todos" : TYPE_ES[type]}`}
          selected={type !== "all"}
          expanded={presented && field === "type"}
          icon="shapes-outline"
          color={type === "all" ? undefined : TYPE_COLORS[type]}
          onPress={() => open("type")}
        />
        <FilterChip
          label={generation ? regionName(generation) : "Región"}
          accessibilityLabel={`Filtrar por región: ${generation ? regionName(generation) : "todas"}`}
          selected={generation !== 0}
          expanded={presented && field === "generation"}
          icon="map-outline"
          onPress={() => open("generation")}
        />
        <FilterChip
          compact
          accessibilityLabel="Solo favoritos"
          selected={favoritesOnly}
          icon={favoritesOnly ? "heart" : "heart-outline"}
          onPress={() => {
            onFavoritesChange();
            void Haptics.selectionAsync();
          }}
        />
      </View>
      <View style={styles.summary}>
        <Text
          accessibilityLiveRegion="polite"
          aria-live="polite"
          style={[styles.results, { color: t.sub }]}
        >
          <Text style={[styles.resultNumber, { color: t.text }]}>{resultCount}</Text>
          {" Pokémon"}
          {favoritesOnly ? " · favoritos" : ""}
        </Text>
        {active && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpiar filtros"
            onPress={onReset}
            style={({ pressed }) => [styles.reset, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="close" size={15} color={t.tint} accessible={false} />
            <Text style={[styles.resetLabel, { color: t.tint }]}>Limpiar</Text>
          </Pressable>
        )}
      </View>
      <BottomSheet
        isPresented={presented}
        onDismiss={() => setPresented(false)}
        contentPadding={0}
        containerColor={t.bg}
        testID="pokedex-filter-sheet"
      >
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16), maxHeight: height - insets.top - 32 },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeading}>
              <Text accessibilityRole="header" style={[styles.sheetTitle, { color: t.text }]}>
                {field === "type" ? "Tipo de Pokémon" : "Región de origen"}
              </Text>
              <Text style={[styles.sheetDescription, { color: t.sub }]}>
                {field === "type"
                  ? "Elige un tipo para explorar."
                  : "Cada región corresponde a una generación."}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar filtros"
              onPress={() => setPresented(false)}
              style={({ pressed }) => [
                styles.close,
                { backgroundColor: t.card, opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <Ionicons name="close" size={22} color={t.text} />
            </Pressable>
          </View>
          <ScrollView
            nestedScrollEnabled
            style={{ maxHeight: Math.max(120, height * 0.58) }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.optionsContent}
          >
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel={field === "type" ? "Tipos de Pokémon" : "Regiones"}
              style={styles.options}
            >
              {options.map((option) => {
                const checked = selected === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityLabel={
                      option.detail ? `${option.label}, ${option.detail}` : option.label
                    }
                    accessibilityState={{ checked }}
                    aria-checked={checked}
                    onFocus={() => setFocusedOption(option.value)}
                    onBlur={() => setFocusedOption(null)}
                    onPress={() => choose(option.value)}
                    style={({ pressed }) => [
                      styles.option,
                      singleColumn || option.value === "all" || option.value === "0"
                        ? styles.fullOption
                        : styles.halfOption,
                      {
                        backgroundColor: checked ? `${t.tint}14` : t.card,
                        borderColor: checked || focusedOption === option.value ? t.tint : t.line,
                        opacity: pressed ? 0.65 : 1,
                      },
                    ]}
                  >
                    {!!option.color && (
                      <View
                        accessible={false}
                        style={[styles.dot, { backgroundColor: option.color }]}
                      />
                    )}
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, { color: t.text }]}>{option.label}</Text>
                      {!!option.detail && (
                        <Text style={[styles.optionDetail, { color: t.sub }]}>{option.detail}</Text>
                      )}
                    </View>
                    {checked && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={t.tint}
                        accessible={false}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 4 },
  toolbar: { flexDirection: "row", alignItems: "stretch", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  selector: { flex: 1, minWidth: 0 },
  favorite: { minWidth: 48, alignSelf: "flex-start" },
  chipLabel: { flexShrink: 1, fontSize: 14, fontWeight: "600" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  summary: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minHeight: 48,
  },
  results: { flexShrink: 1, fontSize: 14, fontVariant: ["tabular-nums"] },
  resultNumber: { fontWeight: "700" },
  reset: {
    minHeight: 48,
    minWidth: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingLeft: 8,
  },
  resetLabel: { fontSize: 14, fontWeight: "600" },
  sheet: { width: "100%", maxWidth: 680, alignSelf: "center" },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sheetHeading: { flex: 1, gap: 8 },
  sheetTitle: { fontSize: 23, fontWeight: "700", letterSpacing: -0.5 },
  sheetDescription: { fontSize: 14, lineHeight: 21 },
  close: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  optionsContent: { paddingHorizontal: 20, paddingBottom: 8 },
  options: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 52,
    padding: 14,
  },
  fullOption: { width: "100%" },
  halfOption: { width: "48%" },
  optionText: { flex: 1, gap: 4 },
  optionLabel: { fontSize: 15, fontWeight: "600" },
  optionDetail: { fontSize: 12, lineHeight: 18 },
});
