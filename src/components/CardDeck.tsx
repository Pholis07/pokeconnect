import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { CardBrief, CardLanguage } from "../lib/tcg";
import { cardImage } from "../lib/tcg";
import { OfflineImage } from "./OfflineImage";
import { Choice, Copy, ui } from "./ui";
import { useTheme } from "../theme";

export function CardDeck({ cards, lang }: { cards: CardBrief[]; lang: CardLanguage }) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(300);
  const x = useSharedValue(0);
  const origin = useSharedValue(0);
  const dismissing = useSharedValue(false);
  const dragged = useSharedValue(false);
  const next = useCallback(() => {
    setIndex((i) => (i + 1) % Math.max(1, cards.length));
    void Haptics.selectionAsync();
  }, [cards.length]);
  useEffect(() => {
    x.set(0);
    dismissing.set(false);
  }, [index, x, dismissing]);
  const gesture = usePanGesture({
    enabled: cards.length > 1,
    activeOffsetX: [-10, 10],
    failOffsetY: [-16, 16],
    maxPointers: 1,
    onBegin: () => {
      dragged.set(false);
      if (!dismissing.get()) origin.set(x.get());
    },
    onActivate: () => {
      dragged.set(true);
    },
    onUpdate: (e) => {
      if (!reduced && !dismissing.get()) x.set(origin.get() + e.translationX);
    },
    onDeactivate: (e) => {
      if (dismissing.get()) return;
      if (!e.canceled && (Math.abs(e.translationX) > width * 0.25 || Math.abs(e.velocityX) > 500)) {
        dismissing.set(true);
        if (reduced) {
          scheduleOnRN(next);
          return;
        }
        const direction = e.velocityX === 0 ? Math.sign(e.translationX) : Math.sign(e.velocityX);
        x.set(
          withSpring(
            direction * width * 1.4,
            {
              duration: 300,
              dampingRatio: 0.8,
              velocity: e.velocityX,
              reduceMotion: ReduceMotion.System,
            },
            (finished) => {
              if (finished) scheduleOnRN(next);
            },
          ),
        );
      } else {
        x.set(
          withSpring(0, {
            duration: 400,
            dampingRatio: 0.8,
            velocity: e.velocityX,
            reduceMotion: ReduceMotion.System,
          }),
        );
      }
    },
  });
  const motion = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { rotateZ: `${(x.get() / width) * 12}deg` }],
  }));
  if (!cards.length) return <Copy>Añade cartas a tu álbum para explorar tu baraja.</Copy>;
  const current = cards[index % cards.length];
  return (
    <View style={{ gap: 16 }}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.stage}>
        {Array.from(
          { length: Math.min(2, cards.length - 1) },
          (_, i) => cards[(index + i + 1) % cards.length],
        )
          .reverse()
          .map((card, i) => (
            <View
              key={card.id}
              pointerEvents="none"
              accessible={false}
              style={[
                styles.back,
                {
                  backgroundColor: t.card,
                  transform: [
                    { translateY: (2 - i) * 9 },
                    { rotateZ: `${(2 - i) * 3}deg` },
                    { scale: 0.95 + i * 0.02 },
                  ],
                },
              ]}
            >
              <OfflineImage
                uri={cardImage(card.image!)}
                style={styles.image}
                contentFit="contain"
              />
            </View>
          ))}
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.front, motion]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir carta de la baraja ${current.name}`}
              onPress={() => {
                if (!dragged.get() && !dismissing.get())
                  router.push({ pathname: "/carta/[id]", params: { id: current.id, lang } });
              }}
            >
              <OfflineImage
                uri={cardImage(current.image!, "high")}
                style={styles.image}
                contentFit="contain"
              />
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </View>
      <Copy>
        {current.name} · {(index % cards.length) + 1} de {cards.length}
      </Copy>
      <Copy>Desliza hacia un lado para pasar la carta. Tócala para abrirla.</Copy>
      <View style={ui.row}>
        <Choice
          title="Abrir esta carta"
          onPress={() => router.push({ pathname: "/carta/[id]", params: { id: current.id, lang } })}
        />
        <Choice
          title="Carta anterior"
          disabled={cards.length < 2}
          onPress={() => setIndex((i) => (i - 1 + cards.length) % cards.length)}
        />
        <Choice title="Siguiente carta" disabled={cards.length < 2} onPress={next} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  stage: { width: "100%", aspectRatio: 0.727, marginBottom: 22 },
  back: { position: "absolute", inset: 0, borderRadius: 18, overflow: "hidden" },
  front: { width: "100%", borderRadius: 18, overflow: "hidden" },
  image: { width: "100%", aspectRatio: 0.727 },
});
