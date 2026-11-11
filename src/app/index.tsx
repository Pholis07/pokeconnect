import { useEffect, useMemo, useRef, useState } from "react";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Choice, ui } from "../components/ui";
import { catalog, matches } from "../lib/catalog";
import { useTrainer } from "../lib/trainer";
import { PokedexFilters } from "../components/PokedexFilters";
import { FeaturedCarousel } from "../components/FeaturedCarousel";
import { Button } from "../components/Button";
import { PokemonRow } from "../components/PokemonRow";
import { useTheme } from "../theme";

export default function Index() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const player = useRef<AudioPlayer | null>(null);
  useEffect(
    () => () => {
      player.current?.remove();
    },
    [],
  );
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [generation, setGeneration] = useState(0);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const state = useTrainer();
  const data = useMemo(
    () =>
      catalog.filter(
        (p) =>
          matches(p, query) &&
          (type === "all" || p.types.includes(type)) &&
          (!generation || p.generation === generation) &&
          (!favoritesOnly || state.favorites.includes(p.name)),
      ),
    [query, type, generation, favoritesOnly, state.favorites],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "PokeConnect",
          headerTitleAlign: "left",
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir cámara"
              onPress={() => router.push("/camara")}
              style={({ pressed }) => [
                styles.camera,
                { backgroundColor: t.card, borderColor: t.line, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Ionicons name="camera-outline" size={24} color={t.text} />
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={data}
        keyExtractor={(p) => p.name}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={5}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: t.tint }]}>TU PRÓXIMA AVENTURA</Text>
            <Text style={[styles.title, { color: t.text }]}>Un mundo por descubrir.</Text>
            <Text style={[styles.subtitle, { color: t.sub }]}>
              Conoce a tus favoritos. Encuentra a tu próximo compañero.
            </Text>
            <View style={ui.row}>
              <Choice title="Cartas JCC" onPress={() => router.push("/cartas")} />
              <Choice title="Mi colección" onPress={() => router.push("/coleccion")} />
              <Choice
                title={`Equipo ${state.team.length}/6`}
                onPress={() => router.push("/equipo")}
              />
              <Choice title="Comparador" onPress={() => router.push("/comparar")} />
              <Choice
                title={`Pasaporte · ${state.stamps.length} sellos`}
                onPress={() => router.push("/pasaporte")}
              />
            </View>
            <FeaturedCarousel />
            <View style={[styles.search, { backgroundColor: t.card, borderColor: t.line }]}>
              <Ionicons name="search-outline" size={22} color={t.sub} />
              <TextInput
                accessibilityLabel="Buscar Pokémon por nombre o número"
                placeholder="Nombre o número de Pokémon"
                placeholderTextColor={t.sub}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={[styles.input, { color: t.text }]}
              />
              {query.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Limpiar búsqueda"
                  onPress={() => setQuery("")}
                  style={styles.clear}
                >
                  <Ionicons name="close-circle" size={22} color={t.sub} />
                </Pressable>
              )}
            </View>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: t.text }]}>Pokédex nacional</Text>
            </View>
            <PokedexFilters
              type={type}
              generation={generation}
              favoritesOnly={favoritesOnly}
              resultCount={data.length}
              onTypeChange={setType}
              onGenerationChange={setGeneration}
              onFavoritesChange={() => setFavoritesOnly((value) => !value)}
              onReset={() => {
                setType("all");
                setGeneration(0);
                setFavoritesOnly(false);
              }}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={36} color={t.sub} />
            <Text style={[styles.emptyTitle, { color: t.text }]}>No encontramos ese Pokémon</Text>
            <Text style={[styles.subtitle, { color: t.sub }]}>
              {query.trim()
                ? `Prueba otro nombre o número para “${query}”, o cambia los filtros.`
                : favoritesOnly
                  ? "No tienes favoritos con estos filtros. Prueba otro tipo o región."
                  : "Prueba otra combinación de tipo y región."}
            </Text>
            <Button
              title="Ver todos los Pokémon"
              onPress={() => {
                setQuery("");
                setType("all");
                setGeneration(0);
                setFavoritesOnly(false);
              }}
            />
          </View>
        }
        renderItem={({ item }) => (
          <PokemonRow
            name={item.name}
            url={item.speciesUrl}
            onPress={() => {
              void Haptics.selectionAsync();
              router.push(`/pokemon/${item.name}`);
              try {
                player.current ??= createAudioPlayer(null);
                player.current.replace({
                  uri: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${item.id}.ogg`,
                });
                player.current.play();
              } catch {
                /* El audio opcional nunca debe impedir abrir la ficha. */
              }
            }}
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, alignSelf: "center", width: "100%", maxWidth: 720 },
  header: { gap: 16, paddingTop: 16, paddingBottom: 16 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.6 },
  title: { fontSize: 36, fontWeight: "800", letterSpacing: -1.4, lineHeight: 41, maxWidth: 330 },
  subtitle: { fontSize: 15, lineHeight: 23 },
  camera: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    paddingLeft: 16,
    minHeight: 56,
  },
  input: { flex: 1, minWidth: 0, paddingVertical: 16, fontSize: 15 },
  clear: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  sectionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 21, fontWeight: "800", letterSpacing: -0.5 },
  empty: { paddingVertical: 32, gap: 16, alignItems: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
});
