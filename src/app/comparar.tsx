import { Text, View } from "react-native";
import { router } from "expo-router";
import { Page, Section, Choice, Copy, ui } from "../components/ui";
import { OfflineImage } from "../components/OfflineImage";
import { PokemonPicker } from "../components/PokemonPicker";
import { byName, STAT_LABELS } from "../lib/catalog";
import { toggleCompare, useTrainer, perform } from "../lib/trainer";
import { pretty, useTheme } from "../theme";

export default function Compare() {
  const t = useTheme();
  const state = useTrainer();
  const selected = state.compare.flatMap((n) => byName.get(n) ?? []);
  return (
    <Page title="Comparador">
      <Copy>
        Elige dos Pokémon. El valor mayor se destaca; las estadísticas base no determinan por sí
        solas el resultado de un combate.
      </Copy>
      <View style={[ui.row, { alignItems: "stretch" }]}>
        {selected.map((p) => (
          <View key={p.name} style={{ flex: 1, minWidth: 130, gap: 10, alignItems: "center" }}>
            <OfflineImage
              uri={p.artwork}
              style={{ width: 130, height: 130 }}
              contentFit="contain"
            />
            <Choice title={pretty(p.name)} onPress={() => router.push(`/pokemon/${p.name}`)} />
            <Choice
              title={`Quitar ${pretty(p.name)}`}
              onPress={() => void perform(() => toggleCompare(p.name))}
            />
          </View>
        ))}
      </View>
      {selected.length < 2 && (
        <Section title={`Elegir Pokémon ${selected.length + 1}`}>
          <PokemonPicker
            exclude={state.compare}
            onSelect={(name) => void perform(() => toggleCompare(name))}
          />
        </Section>
      )}
      {selected.length === 2 && (
        <Section title="Cara a cara">
          {[...Object.keys(STAT_LABELS), "total"].map((stat) => {
            const values = selected.map((p) =>
              stat === "total" ? Object.values(p.stats).reduce((a, b) => a + b, 0) : p.stats[stat],
            );
            return (
              <View key={stat} style={{ gap: 8, paddingVertical: 6 }}>
                <Copy>{stat === "total" ? "Total base" : STAT_LABELS[stat]}</Copy>
                <View style={ui.row}>
                  {values.map((value, i) => (
                    <Text
                      key={i}
                      style={{
                        flex: 1,
                        color: value > values[1 - i] ? t.tint : t.text,
                        fontWeight: "800",
                        fontSize: 22,
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {value}
                      {value > values[1 - i] ? " ↑" : ""}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
        </Section>
      )}
    </Page>
  );
}
