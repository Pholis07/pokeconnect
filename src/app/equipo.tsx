import { Text, View } from "react-native";
import { router } from "expo-router";
import { Page, Section, Choice, Copy, ui } from "../components/ui";
import { PokemonPicker } from "../components/PokemonPicker";
import { OfflineImage } from "../components/OfflineImage";
import { TypeChip } from "../components/TypeChip";
import { byName } from "../lib/catalog";
import { useTrainer, toggleTeam, perform } from "../lib/trainer";
import { effectiveness } from "../lib/battle";
import { TYPE_ES, pretty, useTheme } from "../theme";

export default function Team() {
  const t = useTheme();
  const state = useTrainer();
  const team = state.team.flatMap((name) => byName.get(name) ?? []);
  const weaknesses = Object.keys(TYPE_ES)
    .map((type) => ({ type, count: team.filter((p) => effectiveness(type, p.types) > 1).length }))
    .filter((x) => x.count >= 2)
    .sort((a, b) => b.count - a.count);
  return (
    <Page title="Mi equipo">
      <Text style={[ui.big, { color: t.text }]}>{team.length} de 6 compañeros</Text>
      <Copy>
        Elige tus compañeros y revisa qué tipos ponen en riesgo a varios miembros. Puedes combatir
        con cualquiera.
      </Copy>
      {team.map((p, index) => (
        <Section key={p.name} title={`${index + 1}. ${pretty(p.name)}`}>
          <View style={ui.row}>
            <OfflineImage uri={p.front} style={{ width: 72, height: 72 }} />
            {p.types.map((type) => (
              <TypeChip key={type} type={type} small />
            ))}
          </View>
          <View style={ui.row}>
            <Choice title="Ver ficha" onPress={() => router.push(`/pokemon/${p.name}`)} />
            <Choice title="Combatir" onPress={() => router.push(`/batalla/${p.name}`)} />
            <Choice
              title="Quitar del equipo"
              onPress={() => void perform(() => toggleTeam(p.name))}
            />
          </View>
        </Section>
      ))}
      {team.length < 6 && (
        <Section title="Añadir un compañero">
          <PokemonPicker
            exclude={state.team}
            onSelect={(name) => void perform(() => toggleTeam(name))}
          />
        </Section>
      )}
      <Section title="Debilidades compartidas">
        {weaknesses.length ? (
          weaknesses.map((x) => (
            <Copy key={x.type}>
              {TYPE_ES[x.type]}: {x.count} compañeros reciben daño supereficaz.
            </Copy>
          ))
        ) : (
          <Copy>
            {team.length < 2
              ? "Añade al menos dos compañeros para analizar el equipo."
              : "No hay tipos supereficaces contra dos o más compañeros."}
          </Copy>
        )}
      </Section>
    </Page>
  );
}
