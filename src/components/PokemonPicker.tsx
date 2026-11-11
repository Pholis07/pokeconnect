import { useState } from "react";
import { TextInput, View } from "react-native";
import { catalog, matches } from "../lib/catalog";
import { pretty, useTheme } from "../theme";
import { Choice, Copy, ui } from "./ui";

export function PokemonPicker({
  onSelect,
  exclude = [],
}: {
  onSelect: (name: string) => void;
  exclude?: string[];
}) {
  const t = useTheme();
  const [query, setQuery] = useState("");
  const results = catalog.filter((p) => !exclude.includes(p.name) && matches(p, query)).slice(0, 6);
  return (
    <View style={{ gap: 12 }}>
      <TextInput
        accessibilityLabel="Buscar Pokémon para seleccionar"
        placeholder="Busca por nombre o número"
        placeholderTextColor={t.sub}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        style={[ui.input, { color: t.text, borderColor: t.line, backgroundColor: t.card }]}
      />
      <View style={ui.row}>
        {results.map((p) => (
          <Choice
            key={p.name}
            title={`${pretty(p.name)} #${p.id}`}
            onPress={() => onSelect(p.name)}
          />
        ))}
      </View>
      {results.length === 0 && <Copy>No encontramos ese Pokémon.</Copy>}
    </View>
  );
}
