import { byName } from "./catalog";
import type { TrainerData } from "./trainer-model";
export const ROUTES = [
  {
    id: "first-connection",
    title: "Primera conexión",
    subtitle: "Conoce, elige y combate con tus primeros compañeros.",
    seen: 3,
    favorites: 1,
    team: 2,
    wins: 1,
    saved: 0,
    cards: 0,
    generation: 0,
  },
  {
    id: "kanto-explorer",
    title: "Tras las huellas de Kanto",
    subtitle: "Une exploración y estrategia en la región original.",
    seen: 10,
    favorites: 3,
    team: 6,
    wins: 3,
    saved: 2,
    cards: 0,
    generation: 1,
  },
  {
    id: "living-album",
    title: "Del Pokémon a la carta",
    subtitle: "Conecta tus descubrimientos con las ilustraciones del JCC.",
    seen: 15,
    favorites: 5,
    team: 6,
    wins: 5,
    saved: 3,
    cards: 3,
    generation: 0,
  },
];
export function routeProgress(route: (typeof ROUTES)[number], trainer: TrainerData) {
  const seen = trainer.seen.filter(
    (name) => !route.generation || byName.get(name)?.generation === route.generation,
  ).length;
  return [
    {
      label: route.generation ? "Pokémon de Kanto explorados" : "Pokémon explorados",
      value: seen,
      target: route.seen,
      href: "/",
    },
    {
      label: "Favoritos",
      value: trainer.favorites.length,
      target: route.favorites,
      href: "/coleccion",
    },
    {
      label: "Compañeros en el equipo",
      value: trainer.team.length,
      target: route.team,
      href: "/equipo",
    },
    {
      label: "Compañeros con una victoria",
      value: trainer.wins.length,
      target: route.wins,
      href: "/equipo",
    },
    {
      label: "Fichas con imágenes descargadas",
      value: trainer.saved.length,
      target: route.saved,
      href: "/coleccion",
    },
    {
      label: "Cartas favoritas en el álbum",
      value: trainer.cards.length,
      target: route.cards,
      href: "/cartas",
    },
  ].filter((goal) => goal.target > 0);
}
