import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { PokemonArtwork } from "../../components/PokemonArtwork";
import { Button } from "../../components/Button";
import { TypeChip } from "../../components/TypeChip";
import { Choice, Copy, Page, Section, ui } from "../../components/ui";
import { byName, byId, STAT_LABELS } from "../../lib/catalog";
import {
  markSeen,
  perform,
  toggleCompare,
  toggleFavorite,
  toggleTeam,
  useTrainer,
} from "../../lib/trainer";
import { savePokemon } from "../../lib/offline";
import { num, pretty, TYPE_COLORS, useTheme } from "../../theme";

export default function PokemonDetail() {
  const t = useTheme();
  const { name } = useLocalSearchParams<{ name: string }>();
  const p = byName.get(name);
  const state = useTrainer();
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (p) void perform(() => markSeen(p.name));
  }, [p]);
  if (!p)
    return (
      <Page title="Pokémon">
        <Copy>No encontramos este Pokémon en la Pokédex nacional.</Copy>
        <Button title="Volver a la Pokédex" onPress={() => router.replace("/")} />
      </Page>
    );
  const accent = TYPE_COLORS[p.types[0]] ?? t.tint;
  return (
    <Page title={pretty(p.name)}>
      <PokemonArtwork key={p.name} pokemon={p} accent={accent} />
      <View style={ui.row}>
        <Text style={[ui.big, { color: t.text, flex: 1 }]}>{pretty(p.name)}</Text>
        <Copy>{num(p.id)}</Copy>
      </View>
      <View style={ui.row}>
        {p.types.map((type) => (
          <TypeChip key={type} type={type} />
        ))}
      </View>
      <Copy>{p.description}</Copy>
      <View style={ui.row}>
        <Choice
          title={state.favorites.includes(name) ? "En favoritos" : "Añadir favorito"}
          selected={state.favorites.includes(name)}
          onPress={() => void perform(() => toggleFavorite(name))}
        />
        <Choice
          title={state.team.includes(name) ? "En mi equipo" : "Añadir al equipo"}
          selected={state.team.includes(name)}
          onPress={() => void perform(() => toggleTeam(name))}
        />
        <Choice
          title={state.compare.includes(name) ? "En comparador" : "Comparar"}
          selected={state.compare.includes(name)}
          onPress={() => void perform(() => toggleCompare(name))}
        />
      </View>
      <Choice
        title={
          saving
            ? "Descargando imágenes…"
            : state.saved.includes(name)
              ? "Imágenes guardadas sin conexión"
              : "Descargar imágenes de la ficha"
        }
        disabled={saving || state.saved.includes(name)}
        selected={state.saved.includes(name)}
        onPress={() => {
          setSaving(true);
          void perform(() => savePokemon(name)).finally(() => setSaving(false));
        }}
      />
      <Copy>
        Los datos de esta ficha ya están disponibles sin conexión. Descarga las imágenes para
        completar tu guía.
      </Copy>
      <Button title="Entrar al combate" onPress={() => router.push(`/batalla/${p.name}`)} />
      <Button
        title={`Ver cartas de ${pretty(p.name)}`}
        onPress={() =>
          router.push({ pathname: "/cartas", params: { dex: String(p.id), pokemon: p.name } })
        }
      />
      <Section title="Estadísticas base">
        {Object.entries(p.stats).map(([stat, value]) => (
          <View key={stat} style={{ gap: 6 }}>
            <View style={ui.row}>
              <Copy>{STAT_LABELS[stat] ?? stat}</Copy>
              <Text style={{ color: t.text, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                {value}
              </Text>
            </View>
            <View
              style={{ height: 7, borderRadius: 4, backgroundColor: t.track, overflow: "hidden" }}
            >
              <View
                style={{ height: 7, width: `${(value / 255) * 100}%`, backgroundColor: accent }}
              />
            </View>
          </View>
        ))}
      </Section>
      <Section title="Evoluciones">
        {p.evolutions.length === 1 ? (
          <Copy>Este Pokémon no tiene evoluciones registradas.</Copy>
        ) : (
          p.evolutions.map((e) => (
            <View
              key={e.id}
              style={{ gap: 7, paddingVertical: 8, borderBottomWidth: 1, borderColor: t.line }}
            >
              <Choice
                title={`${e.parent ? `${pretty(byId.get(e.parent)?.name ?? String(e.parent))} → ` : ""}${pretty(e.name)}`}
                selected={e.name === p.name}
                onPress={() => router.push(`/pokemon/${e.name}`)}
              />
              <Copy>{e.condition}</Copy>
            </View>
          ))
        )}
      </Section>
      <Section title="Movimientos del simulador">
        {p.moves.map((m) => (
          <View key={m.id} style={{ gap: 6 }}>
            <View style={ui.row}>
              <Text style={{ color: t.text, fontWeight: "700" }}>{m.name}</Text>
              <TypeChip type={m.type} small />
            </View>
            <Copy>
              Potencia {m.power} · Precisión {m.accuracy}% · {m.pp} PP ·{" "}
              {m.category === "special" ? "Especial" : "Físico"}
            </Copy>
          </View>
        ))}
        <Copy>
          Combate simplificado con daño, precisión, PP, velocidad y tipos; sin estados ni
          habilidades.
        </Copy>
      </Section>
    </Page>
  );
}
