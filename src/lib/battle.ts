import chart from "./type-chart.json" with { type: "json" };
import type { Pokemon, Move } from "./catalog";

export type Fighter = {
  name: string;
  type: string;
  types: string[];
  front: string;
  back: string;
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  moves: Move[];
};
export const effectiveness = (type: string, targets: string[]) =>
  targets.reduce(
    (multiplier, target) =>
      multiplier * ((chart as Record<string, Record<string, number>>)[type]?.[target] ?? 1),
    1,
  );
export const toFighter = (p: Pokemon): Fighter => ({
  name: p.name,
  type: p.types[0],
  types: p.types,
  front: p.front,
  back: p.back,
  hp: p.stats.hp * 2 + 60,
  attack: p.stats.attack,
  defense: p.stats.defense,
  specialAttack: p.stats["special-attack"],
  specialDefense: p.stats["special-defense"],
  speed: p.stats.speed,
  moves: p.moves,
});
type Combatant = {
  attack: number;
  defense: number;
  types?: string[];
  specialAttack?: number;
  specialDefense?: number;
};
export function damage(a: Combatant, d: Combatant, roll = Math.random(), move?: Move) {
  if (!move) return Math.max(1, Math.round((a.attack / d.defense) * 20 * (0.85 + roll * 0.3)));
  const multiplier = move.id === 165 ? 1 : effectiveness(move.type, d.types ?? []);
  if (multiplier === 0) return 0;
  const attack = move.category === "special" ? (a.specialAttack ?? a.attack) : a.attack;
  const defense = Math.max(
    1,
    move.category === "special" ? (d.specialDefense ?? d.defense) : d.defense,
  );
  const stab = move.id !== 165 && a.types?.includes(move.type) ? 1.5 : 1;
  return Math.max(
    1,
    Math.floor(
      ((22 * move.power * attack) / defense / 50 + 2) *
        stab *
        multiplier *
        (0.85 + Math.min(1, Math.max(0, roll)) * 0.15),
    ),
  );
}
export type TurnHit = {
  attacker: 0 | 1;
  move: Move;
  dealt: number;
  hit: boolean;
  multiplier: number;
};
export function resolveRound(
  fighters: [Fighter, Fighter],
  hp: [number, number],
  move: Move,
  random: () => number = Math.random,
): { hits: TurnHit[]; hp: [number, number] } {
  const foe = fighters[1];
  const available = foe.moves;
  const foeMove =
    available[Math.min(available.length - 1, Math.floor(random() * available.length))];
  const order: (0 | 1)[] = fighters[0].speed >= foe.speed ? [0, 1] : [1, 0];
  const remaining: [number, number] = [...hp];
  const hits: TurnHit[] = [];
  for (const attacker of order) {
    const defender = attacker === 0 ? 1 : 0;
    if (remaining[attacker] <= 0 || remaining[defender] <= 0) break;
    const selected = attacker === 0 ? move : foeMove;
    const hit = random() * 100 < selected.accuracy;
    const dealt = hit ? damage(fighters[attacker], fighters[defender], random(), selected) : 0;
    remaining[defender] = Math.max(0, remaining[defender] - dealt);
    hits.push({
      attacker,
      move: selected,
      dealt,
      hit,
      multiplier: selected.id === 165 ? 1 : effectiveness(selected.type, fighters[defender].types),
    });
  }
  return { hits, hp: remaining };
}
