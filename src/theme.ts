import { useColorScheme } from "react-native";

const light = {
  bg: "#F7F6F2",
  card: "#FFFFFF",
  text: "#202922",
  sub: "#606A63",
  line: "#E1E5DF",
  tint: "#C33D36",
  onTint: "#FFFFFF",
  track: "#E1E5DF",
  wash: "25",
  rowWash: "14",
};
const dark = {
  bg: "#111714",
  card: "#1D2721",
  text: "#F3F5EF",
  sub: "#AFBDB3",
  line: "#344239",
  tint: "#FF9186",
  onTint: "#111714",
  track: "#344239",
  wash: "33",
  rowWash: "20",
};

export const useTheme = () => (useColorScheme() === "dark" ? dark : light);

export const radius = { card: 28, row: 24, button: 18, chip: 999 };

export const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

export const TYPE_ES: Record<string, string> = {
  normal: "Normal",
  fire: "Fuego",
  water: "Agua",
  electric: "Eléctrico",
  grass: "Planta",
  ice: "Hielo",
  fighting: "Lucha",
  poison: "Veneno",
  ground: "Tierra",
  flying: "Volador",
  psychic: "Psíquico",
  bug: "Bicho",
  rock: "Roca",
  ghost: "Fantasma",
  dragon: "Dragón",
  dark: "Siniestro",
  steel: "Acero",
  fairy: "Hada",
};

// Texto negro o blanco según la luminancia del fondo, para que el chip siempre cumpla contraste.
export const onColor = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111318" : "#FFFFFF";
};

export const pretty = (name: string) =>
  name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
export const num = (id: number | string) => `#${String(id).padStart(3, "0")}`;

export const hpColor = (ratio: number) =>
  ratio > 0.5 ? "#34C759" : ratio > 0.2 ? "#FF9F0A" : "#FF453A";

// Controles sobre el video de la cámara: no dependen del tema.
export const overlay = { scrim: "rgba(0,0,0,0.5)", icon: "#FFFFFF" };
