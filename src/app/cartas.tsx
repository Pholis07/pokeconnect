import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CardDeck } from "../components/CardDeck";
import { OfflineImage } from "../components/OfflineImage";
import { Choice, Copy, ui } from "../components/ui";
import { cardImage, listCards, type CardBrief, type CardLanguage } from "../lib/tcg";
import { useTrainer } from "../lib/trainer";
import { pretty, useTheme } from "../theme";

export default function Cards() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ dex?: string; pokemon?: string; album?: string }>();
  const [deck, setDeck] = useState(false);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<CardLanguage>("es");
  const [page, setPage] = useState(1);
  const [album, setAlbum] = useState(params.album === "1");
  const [attempt, setAttempt] = useState(0);
  const state = useTrainer();
  const key = JSON.stringify([lang, query, params.dex, page, attempt]);
  const [result, setResult] = useState<{ key: string; cards: CardBrief[] }>({ key: "", cards: [] });
  const [failure, setFailure] = useState<{ key: string; message: string }>({
    key: "",
    message: "",
  });
  useEffect(() => {
    if (album) return;
    let cancelled = false;
    listCards(lang, query, params.dex ?? "", page).then(
      (cards) => {
        if (!cancelled) {
          setResult({ key, cards });
          setFailure({ key: "", message: "" });
        }
      },
      () => {
        if (!cancelled)
          setFailure({
            key,
            message: "No pudimos conectar con las cartas. Reintenta o abre tu álbum guardado.",
          });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [lang, query, params.dex, page, attempt, album, key]);
  const loading = !album && result.key !== key && failure.key !== key;
  const error = !album && failure.key === key ? failure.message : "";
  const cards = album
    ? state.cards
        .filter(
          (c) => c.lang === lang && (!query || c.name.toLowerCase().includes(query.toLowerCase())),
        )
        .map((c) => ({
          id: c.id,
          name: c.name,
          image: c.image,
          localId: c.id.split("-").pop() ?? "",
        }))
    : result.key === key
      ? result.cards
      : [];
  return (
    <>
      <Stack.Screen
        options={{
          title: album
            ? "Mi álbum"
            : params.pokemon
              ? `Cartas de ${pretty(params.pokemon)}`
              : "Cartas Pokémon",
        }}
      />
      <FlatList
        data={deck ? [] : cards}
        numColumns={2}
        keyExtractor={(c) => `${lang}:${c.id}`}
        columnWrapperStyle={{ gap: 14 }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[ui.page, { paddingBottom: insets.bottom + 24 }]}
        ListHeaderComponent={
          <View style={{ gap: 16, paddingBottom: 18 }}>
            <Text style={[ui.big, { color: t.text }]}>Un Pokémon. Muchas historias.</Text>
            <Copy>
              Ilustraciones reales del JCC Pokémon. Abre una carta para ver su expansión, rareza y
              ataques.
            </Copy>
            <View style={ui.row}>
              <Choice
                title="Español"
                selected={lang === "es"}
                onPress={() => {
                  setLang("es");
                  setPage(1);
                }}
              />
              <Choice
                title="English"
                selected={lang === "en"}
                onPress={() => {
                  setLang("en");
                  setPage(1);
                }}
              />
              <Choice
                title={deck ? "Ver cuadrícula" : "Ver como baraja"}
                selected={deck}
                onPress={() => setDeck((v) => !v)}
              />
              <Choice
                title={album ? "Mi álbum" : "Ver mi álbum"}
                selected={album}
                onPress={() => {
                  setAlbum(!album);
                  setPage(1);
                }}
              />
            </View>
            <TextInput
              accessibilityLabel="Buscar cartas por nombre"
              value={draft}
              onChangeText={setDraft}
              placeholder="Nombre de la carta"
              placeholderTextColor={t.sub}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={() => {
                setQuery(draft);
                setPage(1);
              }}
              style={[ui.input, { color: t.text, borderColor: t.line, backgroundColor: t.card }]}
            />
            <View style={ui.row}>
              <Choice
                title="Buscar cartas"
                onPress={() => {
                  setQuery(draft);
                  setPage(1);
                }}
              />
              {query.length > 0 && (
                <Choice
                  title="Limpiar búsqueda"
                  onPress={() => {
                    setQuery("");
                    setDraft("");
                    setPage(1);
                  }}
                />
              )}
            </View>
            <Copy>
              {album
                ? `${cards.length} cartas favoritas en este idioma`
                : `Página ${page} · ${lang === "es" ? "Español" : "Inglés"}${params.pokemon ? ` · ${pretty(params.pokemon)}` : ""}`}
            </Copy>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver carta ${item.name} ${item.id}`}
            onPress={() => router.push({ pathname: "/carta/[id]", params: { id: item.id, lang } })}
            style={({ pressed }) => ({
              flex: 1,
              maxWidth: "48%",
              gap: 8,
              marginBottom: 18,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <OfflineImage
              uri={cardImage(item.image!)}
              style={{
                width: "100%",
                aspectRatio: 0.727,
                borderRadius: 10,
                backgroundColor: t.line,
              }}
              contentFit="contain"
              accessibilityLabel={`Carta ${item.name}`}
            />
            <Text style={{ color: t.text, fontSize: 15, fontWeight: "700" }}>{item.name}</Text>
            <Copy>{item.id}</Copy>
          </Pressable>
        )}
        ListEmptyComponent={
          deck && cards.length > 0 ? (
            <CardDeck key={`${lang}:${page}:${query}:${album}`} cards={cards} lang={lang} />
          ) : (
            <View style={ui.empty}>
              {loading ? (
                <>
                  <ActivityIndicator color={t.tint} />
                  <Copy>Buscando cartas…</Copy>
                </>
              ) : error ? (
                <>
                  <Copy>{error}</Copy>
                  <Choice title="Reintentar cartas" onPress={() => setAttempt((v) => v + 1)} />
                </>
              ) : (
                <Copy>
                  {album
                    ? "Abre una carta y guárdala en tu álbum para verla aquí."
                    : "No encontramos cartas con imagen para esta búsqueda. Prueba otro nombre o idioma."}
                </Copy>
              )}
            </View>
          )
        }
        ListFooterComponent={
          <View style={{ gap: 16 }}>
            {!album && !loading && !error && (
              <View style={ui.row}>
                <Choice
                  title="Anterior"
                  disabled={page === 1}
                  onPress={() => setPage((v) => v - 1)}
                />
                <Choice
                  title="Siguiente"
                  disabled={cards.length < 20}
                  onPress={() => setPage((v) => v + 1)}
                />
              </View>
            )}
            <Copy>
              Datos e imágenes: TCGdex. Pokémon y sus ilustraciones pertenecen a sus respectivos
              titulares.
            </Copy>
          </View>
        }
      />
    </>
  );
}
