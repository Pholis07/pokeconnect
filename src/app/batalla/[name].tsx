import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  ReduceMotion,
  cancelAnimation,
  useReducedMotion,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { VictorySpark } from "../../components/VictorySpark";
import { Button } from "../../components/Button";
import { resolveRound, toFighter, type Fighter, type TurnHit } from "../../lib/battle";
import { recordWin, perform } from "../../lib/trainer";
import type { Move } from "../../lib/catalog";
import { Choice, Copy, ui } from "../../components/ui";
import { OfflineImage } from "../../components/OfflineImage";
import { fetchPokemon } from "../../lib/pokeapi";
import { hpColor, pretty, radius, TYPE_COLORS, useTheme } from "../../theme";

const MAX_ID = 151; // rival aleatorio entre los de la primera generación
const FOE_TURN_MS = 800;
const LUNGE = 36; // cuánto embiste el atacante hacia su rival

// Último golpe: `seq` cambia en cada ataque y cada sprite decide si embiste o recibe.
type Fx = { seq: number; attacker: 0 | 1; dealt: number };
const NO_FX: Fx = { seq: 0, attacker: 0, dealt: 0 };

function HpBar({ value, max }: { value: number; max: number }) {
  const t = useTheme();
  const ratio = value / max;
  const fill = useAnimatedStyle(() => ({
    transform: [
      { scaleX: withTiming(ratio, { duration: 220, reduceMotion: ReduceMotion.System }) },
    ],
  }));
  return (
    <View style={[styles.track, { backgroundColor: t.track }]}>
      <Animated.View style={[styles.fill, { backgroundColor: hpColor(ratio) }, fill]} />
    </View>
  );
}

type SpriteProps = {
  uri: string;
  size: number;
  self: 0 | 1;
  fx: Fx;
  fainted: boolean;
  won: boolean;
};

// Entra deslizando, respira en reposo, embiste al atacar, tiembla y parpadea al recibir, cae al perder y salta al ganar.
function FighterSprite({ uri, size, self, fx, fainted, won }: SpriteProps) {
  const reduced = useReducedMotion();
  const dir = self === 0 ? 1 : -1; // el propio mira a la derecha, el rival a la izquierda
  const x = useSharedValue(reduced ? 0 : -dir * 140);
  const bob = useSharedValue(0);
  const jump = useSharedValue(0);
  const alpha = useSharedValue(1);
  const dmg = useSharedValue(0);

  useEffect(() => {
    x.set(withSpring(0, { duration: 400, dampingRatio: 1, reduceMotion: ReduceMotion.System }));
    if (!reduced)
      bob.set(
        withRepeat(
          withSequence(withTiming(-6, { duration: 900 }), withTiming(0, { duration: 900 })),
          -1,
        ),
      );
    return () => {
      cancelAnimation(x);
      cancelAnimation(bob);
    };
  }, [x, bob, reduced]);

  useEffect(() => {
    if (!fx.seq || reduced) return;
    if (fx.attacker === self) {
      x.set(
        withSequence(withTiming(LUNGE * dir, { duration: 110 }), withSpring(0, { damping: 10 })),
      );
      return;
    }
    x.set(
      withSequence(
        withTiming(-10 * dir, { duration: 40 }),
        withRepeat(withTiming(10 * dir, { duration: 70 }), 4, true),
        withTiming(0, { duration: 40 }),
      ),
    );
    alpha.set(
      withSequence(
        withTiming(0.3, { duration: 60 }),
        withTiming(1, { duration: 120 }),
        withTiming(0.3, { duration: 60 }),
        withTiming(1, { duration: 120 }),
      ),
    );
    dmg.set(0);
    dmg.set(withTiming(1, { duration: 800 }));
  }, [fx, self, dir, x, alpha, dmg, reduced]);

  useEffect(() => {
    if (fainted) alpha.set(withTiming(0.25, { duration: 500 })); // declarado después del parpadeo: gana el último estado
  }, [fainted, alpha]);

  useEffect(() => {
    if (won && !reduced)
      jump.set(withSequence(withTiming(-18, { duration: 130 }), withTiming(0, { duration: 130 })));
    return () => cancelAnimation(jump);
  }, [won, jump, reduced]);

  const body = useAnimatedStyle(() => ({
    opacity: alpha.get(),
    transform: [{ translateX: x.get() }, { translateY: bob.get() + jump.get() }],
  }));
  const floating = useAnimatedStyle(() => ({
    opacity: interpolate(dmg.get(), [0, 0.15, 1], [0, 1, 0]),
    transform: [
      { translateY: -50 * dmg.get() },
      { scale: interpolate(dmg.get(), [0, 0.2, 1], [0.5, 1.3, 1]) },
    ],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={body}>
        <OfflineImage uri={uri} style={{ width: size, height: size }} contentFit="contain" />
      </Animated.View>
      <Animated.Text pointerEvents="none" style={[styles.dmg, floating]}>
        -{fx.dealt}
      </Animated.Text>
    </View>
  );
}

export default function Batalla() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { name } = useLocalSearchParams<{ name: string }>();
  const [fighters, setFighters] = useState<[Fighter, Fighter] | null>(null);
  const [hp, setHp] = useState<[number, number]>([0, 0]);
  const [log, setLog] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fx, setFx] = useState<Fx>(NO_FX);
  const acting = useRef(false);
  const [pp, setPp] = useState<Record<number, number>>({});
  const [round, setRound] = useState(0); // cambia en cada combate: los sprites vuelven a hacer su entrada
  const foeTurn = useRef<ReturnType<typeof setTimeout>>(undefined);

  const start = async () => {
    try {
      setError(null);
      const rival = Math.floor(Math.random() * MAX_ID) + 1;
      const [me, foe] = (await Promise.all([fetchPokemon(name), fetchPokemon(rival)])).map(
        toFighter,
      );
      setFighters([me, foe]);
      setPp(Object.fromEntries(me.moves.map((move) => [move.id, move.pp])));
      acting.current = false;
      setHp([me.hp, foe.hp]);
      setFx(NO_FX);
      setRound((r) => r + 1);
      setLog(`¡Un ${pretty(foe.name)} salvaje apareció!`);
      setBusy(false);
    } catch {
      setError("No se pudo iniciar el combate. Revisa tu conexión.");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar
    start();
    return () => clearTimeout(foeTurn.current); // al salir no deben dispararse el golpe ni la vibración pendientes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  if (!fighters) {
    return (
      <View style={styles.center}>
        {error ? (
          <>
            <Text style={[styles.logText, { color: t.sub }]}>{error}</Text>
            <Button title="Reintentar" onPress={start} />
          </>
        ) : (
          <ActivityIndicator size="large" color={t.tint} />
        )}
      </View>
    );
  }

  const [me, foe] = fighters;
  const over = hp[0] === 0 || hp[1] === 0;

  const attack = (move: Move) => {
    if (acting.current || over || (pp[move.id] ?? 0) <= 0) return;
    acting.current = true;
    setBusy(true);
    const result = resolveRound(fighters, hp, move);
    if (result.hits.some((hit) => hit.attacker === 0))
      setPp((current) => ({ ...current, [move.id]: current[move.id] - 1 }));
    let currentHp: [number, number] = [...hp];
    const show = (hit: TurnHit) => {
      const target = hit.attacker === 0 ? 1 : 0;
      currentHp = [...currentHp];
      currentHp[target] = Math.max(0, currentHp[target] - hit.dealt);
      setHp(currentHp);
      setFx((f) => ({ seq: f.seq + 1, attacker: hit.attacker, dealt: hit.dealt }));
      const effectiveness =
        hit.multiplier === 0
          ? " No afecta al rival."
          : hit.multiplier > 1
            ? " ¡Es supereficaz!"
            : hit.multiplier < 1
              ? " Es poco eficaz."
              : "";
      setLog(
        `${pretty(fighters[hit.attacker].name)} usa ${hit.move.name}. ${hit.hit ? `${hit.dealt} de daño.${effectiveness}` : "¡Falló!"}`,
      );
    };
    const finish = () => {
      setBusy(false);
      acting.current = false;
      if (result.hp[1] === 0) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        void perform(() => recordWin(me.name));
        setLog(`¡${pretty(me.name)} ganó el combate!`);
      } else if (result.hp[0] === 0) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setLog(`${pretty(foe.name)} te derrotó`);
      }
    };
    show(result.hits[0]);
    if (result.hits.length === 1) {
      finish();
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    foeTurn.current = setTimeout(() => {
      show(result.hits[1]);
      finish();
    }, FOE_TURN_MS);
  };

  const panel = (f: Fighter, i: 0 | 1) => {
    const info = (
      <View style={[styles.info, { backgroundColor: t.card }]}>
        <View style={styles.infoTop}>
          <Text style={[styles.name, { color: t.text }]} numberOfLines={1}>
            {pretty(f.name)}
          </Text>
          <Text style={[styles.hpText, { color: t.sub }]}>
            {hp[i]}/{f.hp}
          </Text>
        </View>
        <HpBar value={hp[i]} max={f.hp} />
      </View>
    );
    const sprite = (
      <FighterSprite
        key={`${round}-${i}`}
        uri={i === 0 ? f.back : f.front}
        size={i === 0 ? 150 : 130}
        self={i}
        fx={fx}
        fainted={hp[i] === 0}
        won={hp[i] > 0 && hp[1 - i] === 0}
      />
    );
    return (
      <View
        style={[styles.panel, { backgroundColor: `${TYPE_COLORS[f.type] ?? t.tint}${t.wash}` }]}
      >
        {i === 0 ? sprite : info}
        {i === 0 ? info : sprite}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Stack.Screen options={{ title: "Combate" }} />

      <View style={styles.arena}>
        {panel(foe, 1)}
        {panel(me, 0)}
      </View>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View
          style={[styles.logCard, { backgroundColor: t.card }]}
          accessibilityLiveRegion="polite"
        >
          <Animated.Text
            key={log}
            entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}
            style={[styles.logText, { color: t.text }]}
          >
            {log}
          </Animated.Text>
          {hp[0] > 0 && hp[1] === 0 && <VictorySpark key={`victory-${round}`} />}
        </View>
        <Copy>El más veloz ataca primero. Físico y especial usan defensas distintas.</Copy>
        {over ? (
          <Button title="Revancha" onPress={start} />
        ) : (
          <View style={[ui.row, { alignItems: "stretch" }]}>
            {me.moves.map((move) => (
              <View key={move.id} style={{ flexBasis: "47%", flexGrow: 1 }}>
                <Choice
                  title={`${move.name} · ${pp[move.id] ?? 0}/${move.pp} PP`}
                  disabled={busy || (pp[move.id] ?? 0) <= 0}
                  onPress={() => attack(move)}
                />
              </View>
            ))}
            {!me.moves.some((move) => (pp[move.id] ?? 0) > 0) && (
              <Button title="Sin PP · Reiniciar combate" onPress={start} />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  screen: { flex: 1 },
  screenContent: { flexGrow: 1 },
  arena: { flexGrow: 1, flexShrink: 0, padding: 16, gap: 16, justifyContent: "center" },
  actions: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  panel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 28,
    padding: 14,
  },
  info: { flex: 1, borderRadius: radius.row, padding: 14, gap: 10 },
  infoTop: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  name: { flex: 1, fontSize: 17, fontWeight: "800", textTransform: "capitalize" },
  hpText: { fontSize: 14, fontWeight: "600", fontVariant: ["tabular-nums"] },
  track: { height: 10, borderRadius: 5, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 5, transformOrigin: "left" },
  dmg: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    fontSize: 30,
    fontWeight: "900",
    color: "#FF453A",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  logCard: { borderRadius: radius.row, padding: 16, minHeight: 56, justifyContent: "center" },
  logText: { fontSize: 17, fontWeight: "600", textAlign: "center" },
});
