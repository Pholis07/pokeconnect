import { useSyncExternalStore } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  emptyTrainer,
  parseTrainer,
  toggleMember,
  type TrainerData,
  type SavedCard,
} from "./trainer-model";

const KEY = "pokeconnect.trainer.v1";
let snapshot = { ...emptyTrainer(), ready: false, error: "" };
const initial = snapshot;
const listeners = new Set<() => void>();
let hydration: Promise<void> | undefined;
let writes: Promise<unknown> = Promise.resolve();
const publish = () => listeners.forEach((fn) => fn());
export function initializeTrainer() {
  hydration ??= AsyncStorage.getItem(KEY)
    .then((raw) => {
      snapshot = { ...parseTrainer(raw), ready: true, error: "" };
      publish();
    })
    .catch(() => {
      snapshot = {
        ...snapshot,
        error: "No se pudo leer tu progreso. Reintenta para evitar sobrescribirlo.",
      };
      publish();
      hydration = undefined;
    });
  return hydration;
}
export function useTrainer() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => snapshot,
    () => initial,
  );
}
export function updateTrainer(change: (data: TrainerData) => TrainerData): Promise<void> {
  const operation = writes.then(async () => {
    await initializeTrainer();
    if (!snapshot.ready) throw new Error(snapshot.error);
    const data = change(snapshot);
    if (data === snapshot) return;
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
    snapshot = { ...data, ready: true, error: "" };
    publish();
  });
  writes = operation.catch(() => {});
  return operation;
}
export async function perform(action: () => Promise<unknown>) {
  try {
    await action();
  } catch (error) {
    Alert.alert(
      "No se pudo guardar",
      error instanceof Error ? error.message : "Inténtalo de nuevo.",
    );
  }
}
export const toggleFavorite = (name: string) =>
  updateTrainer((s) => ({ ...s, favorites: toggleMember(s.favorites, name) }));
export const toggleTeam = (name: string) =>
  updateTrainer((s) => ({ ...s, team: toggleMember(s.team, name, 6) }));
export const toggleCompare = (name: string) =>
  updateTrainer((s) => ({ ...s, compare: toggleMember(s.compare, name, 2) }));
export const markSeen = (name: string) =>
  updateTrainer((s) => (s.seen.includes(name) ? s : { ...s, seen: [...s.seen, name] }));
export const recordWin = (name: string) =>
  updateTrainer((s) => (s.wins.includes(name) ? s : { ...s, wins: [...s.wins, name] }));
export const toggleCard = (card: SavedCard) =>
  updateTrainer((s) => ({
    ...s,
    cards: s.cards.some((c) => c.id === card.id && c.lang === card.lang)
      ? s.cards.filter((c) => c.id !== card.id || c.lang !== card.lang)
      : [...s.cards, card],
  }));
