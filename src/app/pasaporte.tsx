import { Text, View } from "react-native";
import { router, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { CountUp } from "../components/CountUp";
import { VictorySpark } from "../components/VictorySpark";
import { useState } from "react";
import { Choice, Copy, Page, Section, ui } from "../components/ui";
import { ROUTES, routeProgress } from "../lib/passport";
import { perform, updateTrainer, useTrainer } from "../lib/trainer";
import { useTheme } from "../theme";

export default function Passport() {
  const t = useTheme();
  const state = useTrainer();
  const [spark, setSpark] = useState(0);
  return (
    <Page title="Pasaporte de entrenador">
      <Text style={[ui.big, { color: t.text }]}>Cada conexión deja huella.</Text>
      <Copy>
        Explora Pokémon, forma un equipo y descubre sus cartas. Completa una ruta para estampar tu
        pasaporte. Tu progreso es local y permanece al cerrar la app.
      </Copy>
      <View style={ui.row}>
        <CountUp
          value={state.seen.length}
          suffix="explorados"
          style={{ color: t.text, fontSize: 16, fontWeight: "700" }}
        />
        <CountUp
          value={state.wins.length}
          suffix="compañeros con victorias"
          style={{ color: t.text, fontSize: 16, fontWeight: "700" }}
        />
        <Copy>
          {state.stamps.length}/{ROUTES.length} sellos
        </Copy>
      </View>
      {spark > 0 && <VictorySpark key={spark} />}
      {ROUTES.map((route) => {
        const goals = routeProgress(route, state);
        const complete = goals.every((g) => g.value >= g.target);
        const claimed = state.stamps.includes(route.id);
        const fraction =
          goals.reduce((sum, g) => sum + Math.min(g.value / g.target, 1), 0) / goals.length;
        return (
          <Section key={route.id} title={`${claimed ? "Sello conseguido · " : ""}${route.title}`}>
            <Copy>{route.subtitle}</Copy>
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}
              style={{ height: 8, borderRadius: 4, backgroundColor: t.track, overflow: "hidden" }}
            >
              <View style={{ height: 8, width: `${fraction * 100}%`, backgroundColor: t.tint }} />
            </View>
            {goals.map((g) => (
              <Choice
                key={g.label}
                title={`${g.value >= g.target ? "Completado · " : ""}${g.label}: ${Math.min(g.value, g.target)}/${g.target}`}
                onPress={() => router.push(g.href as Href)}
              />
            ))}
            <Choice
              title={
                claimed
                  ? "Sello en tu pasaporte"
                  : complete
                    ? "Estampar pasaporte"
                    : "Completa los retos para conseguir el sello"
              }
              selected={claimed}
              disabled={claimed || !complete}
              onPress={() =>
                void perform(async () => {
                  await updateTrainer((current) => {
                    if (!routeProgress(route, current).every((g) => g.value >= g.target))
                      throw new Error("Todavía faltan retos por completar.");
                    return { ...current, stamps: [...new Set([...current.stamps, route.id])] };
                  });
                  setSpark((v) => v + 1);
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                })
              }
            />
          </Section>
        );
      })}
    </Page>
  );
}
