import { useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useReducedMotion } from "react-native-reanimated";
import { radius, TYPE_COLORS, useTheme } from "../theme";

const FEATURED = [
  {
    id: 25,
    name: "pikachu",
    label: "Pikachu",
    type: "electric",
    copy: "Una pequeña chispa. Una gran aventura.",
  },
  {
    id: 1,
    name: "bulbasaur",
    label: "Bulbasaur",
    type: "grass",
    copy: "Las grandes aventuras empiezan con una semilla.",
  },
  {
    id: 4,
    name: "charmander",
    label: "Charmander",
    type: "fire",
    copy: "Enciende tu curiosidad. Encuentra tu compañero.",
  },
];

export function FeaturedCarousel() {
  const t = useTheme();
  const reduced = useReducedMotion();
  const list = useRef<FlatList>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.container}>
      {width > 0 && (
        <FlatList
          ref={list}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          key={width}
          data={FEATURED}
          extraData={t}
          initialScrollIndex={page}
          keyExtractor={(item) => item.name}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          onMomentumScrollEnd={(e) =>
            setPage(
              Math.max(
                0,
                Math.min(FEATURED.length - 1, Math.round(e.nativeEvent.contentOffset.x / width)),
              ),
            )
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Conocer a ${item.label}, destacado ${FEATURED.indexOf(item) + 1} de ${FEATURED.length}`}
              onPress={() => router.push(`/pokemon/${item.name}`)}
              style={({ pressed }) => [
                styles.card,
                { width, backgroundColor: t.card, borderColor: pressed ? t.tint : t.line },
              ]}
            >
              {({ pressed }) => (
                <>
                  <View
                    pointerEvents="none"
                    style={[
                      styles.halo,
                      { backgroundColor: TYPE_COLORS[item.type], opacity: pressed ? 0.3 : 0.12 },
                    ]}
                  />
                  <View style={styles.copy}>
                    <Text style={[styles.eyebrow, { color: t.tint }]}>COMPAÑERO DESTACADO</Text>
                    <Text style={[styles.name, { color: t.text }]}>{item.label}</Text>
                    <Text style={[styles.description, { color: t.sub }]}>{item.copy}</Text>
                    <View style={styles.link}>
                      <Text style={[styles.linkText, { color: t.tint }]}>Conocer más</Text>
                      <Ionicons name="arrow-forward" size={18} color={t.tint} />
                    </View>
                  </View>
                  <Image
                    source={{
                      uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${item.id}.png`,
                    }}
                    style={styles.image}
                    contentFit="contain"
                  />
                </>
              )}
            </Pressable>
          )}
        />
      )}
      <View style={styles.pagination}>
        {FEATURED.map((item, index) => (
          <Pressable
            key={item.name}
            accessibilityRole="button"
            accessibilityLabel={`Ver destacado ${item.label}`}
            accessibilityState={{ selected: page === index }}
            style={styles.dotTarget}
            onPress={() => {
              list.current?.scrollToIndex({ index, animated: !reduced });
              setPage(index);
            }}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: page === index ? t.tint : t.sub,
                  opacity: page === index ? 1 : 0.4,
                },
              ]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 240 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 20,
    overflow: "hidden",
    minHeight: 196,
  },
  copy: { flex: 1, gap: 10 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  name: { fontSize: 26, fontWeight: "800", letterSpacing: -0.7 },
  description: { fontSize: 14, lineHeight: 21 },
  link: { flexDirection: "row", gap: 6, alignItems: "center", minHeight: 32 },
  linkText: { fontSize: 14, fontWeight: "700" },
  image: { width: "36%", aspectRatio: 0.8 },
  halo: { position: "absolute", width: 220, height: 220, borderRadius: 110, right: -70, top: -30 },
  pagination: { flexDirection: "row", justifyContent: "center" },
  dotTarget: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
