import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CardArtwork } from "../../components/CardArtwork";
import { VictorySpark } from "../../components/VictorySpark";
import * as Haptics from "expo-haptics";
import { Choice, Copy, Page, Section, ui } from "../../components/ui";
import { cardImage, getCard, type CardDetail, type CardLanguage } from "../../lib/tcg";
import { perform, toggleCard, updateTrainer, useTrainer } from "../../lib/trainer";
import { saveImages } from "../../lib/offline";
import { useTheme } from "../../theme";

export default function Card() {
  const t = useTheme();
  const params = useLocalSearchParams<{ id: string; lang?: string }>();
  const lang: CardLanguage = params.lang === "en" ? "en" : "es";
  const [attempt, setAttempt] = useState(0);
  const [card, setCard] = useState<CardDetail | null>(null);
  const [error, setError] = useState(false);
  const [spark, setSpark] = useState(0);
  const [saving, setSaving] = useState(false);
  const state = useTrainer();
  const saved = state.cards.find((c) => c.id === params.id && c.lang === lang);
  useEffect(() => {
    let cancelled = false;
    getCard(lang, params.id).then(
      (value) => {
        if (!cancelled) setCard(value);
      },
      () => {
        if (!cancelled) setError(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [params.id, lang, attempt]);
  const image = card?.image ?? saved?.image;
  const title = card?.name ?? saved?.name ?? "Carta Pokémon";
  return (
    <Page title={title}>
      {!!image && <CardArtwork uri={cardImage(image!, "high")} name={title} />}
      <Text style={[ui.big, { color: t.text }]}>{title}</Text>
      <Copy>
        {lang === "es" ? "Carta en español" : "Card in English"} · {params.id}
      </Copy>
      {!card && !error && <ActivityIndicator color={t.tint} />}
      {error && !card && (
        <>
          <Copy>
            No se pudo descargar la información de esta carta. La imagen guardada, si existe, sigue
            disponible.
          </Copy>
          <Choice
            title="Reintentar información"
            onPress={() => {
              setError(false);
              setAttempt((v) => v + 1);
            }}
          />
        </>
      )}
      {!!image && (
        <View>
          <Choice
            title={saved ? "Quitar de mi álbum" : "Añadir a mi álbum"}
            selected={!!saved}
            onPress={() =>
              void perform(async () => {
                await toggleCard({ id: params.id, lang, name: title, image: image! });
                if (!saved) {
                  setSpark((v) => v + 1);
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              })
            }
          />
          {spark > 0 && <VictorySpark key={spark} />}
        </View>
      )}
      {!!image && (
        <Choice
          title={
            saving
              ? "Descargando carta…"
              : state.images[cardImage(image, "high")]
                ? "Carta descargada"
                : "Descargar carta sin conexión"
          }
          disabled={saving || !!state.images[cardImage(image, "high")]}
          onPress={() => {
            setSaving(true);
            void perform(async () => {
              const images = await saveImages([cardImage(image, "high"), cardImage(image)]);
              await updateTrainer((s) => ({
                ...s,
                images: { ...s.images, ...images },
                cards: s.cards.some((c) => c.id === params.id && c.lang === lang)
                  ? s.cards
                  : [...s.cards, { id: params.id, lang, name: title, image }],
              }));
            }).finally(() => setSaving(false));
          }}
        />
      )}
      {card && (
        <>
          <Section title="La historia de esta edición">
            <Copy>Expansión: {card.set.name}</Copy>
            <Copy>Rareza: {card.rarity ?? "Sin dato"}</Copy>
            <Copy>Ilustración: {card.illustrator ?? "Sin dato"}</Copy>
            {!!card.hp && (
              <Copy>
                PS: {card.hp} · {card.types?.join(" / ")}
              </Copy>
            )}
          </Section>
          <Section title="Ataques impresos">
            {card.attacks?.length ? (
              card.attacks.map((a, i) => (
                <View key={i} style={{ gap: 6 }}>
                  <Text style={{ color: t.text, fontWeight: "700" }}>
                    {a.name}
                    {a.damage !== undefined ? ` · ${a.damage}` : ""}
                  </Text>
                  {!!a.effect && <Copy>{a.effect}</Copy>}
                </View>
              ))
            ) : (
              <Copy>Esta carta no tiene ataques registrados.</Copy>
            )}
          </Section>
        </>
      )}
      <Copy>
        Fuente: TCGdex. El álbum guarda favoritas; no certifica que poseas las cartas físicas.
      </Copy>
    </Page>
  );
}
