import { router } from "expo-router";
import { View } from "react-native";
import { Choice, Copy, Page, Section, ui } from "../components/ui";
import { PokemonRow } from "../components/PokemonRow";
import { useTrainer } from "../lib/trainer";
import { byName } from "../lib/catalog";

export default function Collection() {
  const state = useTrainer();
  const render = (name: string) => {
    const p = byName.get(name);
    return p ? (
      <PokemonRow
        key={name}
        name={name}
        url={p.speciesUrl}
        onPress={() => router.push(`/pokemon/${name}`)}
      />
    ) : null;
  };
  return (
    <Page title="Mi colección">
      <Copy>
        Tus favoritos, imágenes descargadas y descubrimientos se guardan en este dispositivo.
      </Copy>
      <View style={ui.row}>
        <Choice title={`Equipo · ${state.team.length}/6`} onPress={() => router.push("/equipo")} />
        <Choice
          title={`Álbum · ${state.cards.length}`}
          onPress={() => router.push({ pathname: "/cartas", params: { album: "1" } })}
        />
        <Choice title="Mi pasaporte" onPress={() => router.push("/pasaporte")} />
      </View>
      <Section title={`Favoritos · ${state.favorites.length}`}>
        {state.favorites.length ? (
          state.favorites.map(render)
        ) : (
          <Copy>Abre una ficha y toca «Añadir favorito» para empezar.</Copy>
        )}
      </Section>
      <Section title={`Guía con imágenes sin conexión · ${state.saved.length}`}>
        {state.saved.length ? (
          state.saved.map(render)
        ) : (
          <Copy>
            Todos los datos de la Pokédex están incluidos. Descarga las imágenes desde una ficha
            para verla completa sin internet.
          </Copy>
        )}
      </Section>
      <Section title={`Explorados · ${state.seen.length}/1025`}>
        <Copy>Tu pasaporte cuenta los Pokémon distintos cuyas fichas has abierto.</Copy>
      </Section>
    </Page>
  );
}
