import assert from "node:assert/strict";
import { damage, effectiveness, resolveRound } from "./battle.ts";

const f = (attack, defense) => ({ name: "x", front: "", back: "", hp: 50, attack, defense });

assert.equal(damage(f(100, 1), f(1, 100), 0.5), 20); // ataque = defensa: 20 base
assert.equal(damage(f(100, 1), f(1, 100), 0), 17); // tirada mínima: -15%
assert.equal(damage(f(100, 1), f(1, 100), 1), 23); // tirada máxima: +15%
assert.equal(damage(f(100, 1), f(1, 200), 0.5), 10); // el doble de defensa: la mitad de daño
assert.equal(damage(f(1, 1), f(1, 255), 0.5), 1); // nunca menos de 1
console.log("battle: ok");

const fire = {
  id: 1,
  name: "Fuego",
  type: "fire",
  power: 80,
  accuracy: 100,
  pp: 10,
  category: "special",
};
const fighter = (name, types, speed = 50) => ({
  name,
  types,
  type: types[0],
  hp: 100,
  attack: 50,
  defense: 50,
  specialAttack: 100,
  specialDefense: 100,
  speed,
  moves: [fire],
});
assert.equal(effectiveness("electric", ["ground"]), 0);
assert.equal(effectiveness("fire", ["grass", "steel"]), 4);
assert.equal(effectiveness("water", ["water", "dragon"]), 0.25);
assert.equal(
  damage(fighter("a", ["electric"]), fighter("d", ["ground"]), 0.5, { ...fire, type: "electric" }),
  0,
);
const attacker = fighter("a", ["fire"]),
  defender = fighter("d", ["grass"]);
assert.ok(
  damage(attacker, defender, 1, fire) >
    damage({ ...attacker, types: ["normal"] }, defender, 1, fire),
);
assert.ok(
  damage({ ...attacker, specialAttack: 200 }, defender, 1, fire) >
    damage(attacker, defender, 1, fire),
);
const faster = fighter("fast", ["normal"], 100),
  slower = fighter("slow", ["normal"], 10);
assert.equal(resolveRound([slower, faster], [100, 100], fire, () => 0).hits[0].attacker, 1);
const knockout = resolveRound([faster, slower], [100, 1], fire, () => 0);
assert.equal(knockout.hp[1], 0);
assert.equal(knockout.hits.length, 1);
assert.equal(
  resolveRound([faster, slower], [100, 100], { ...fire, accuracy: 1 }, () => 0.5).hits[0].hit,
  false,
);
assert.equal(
  resolveRound([faster, slower], [100, 100], { ...fire, accuracy: 1 }, () => 0.5).hits[0].dealt,
  0,
);
console.log("battle: types, immunity, STAB, special stats, speed, accuracy and KO: ok");

assert.ok(
  damage(fighter("ditto", ["normal"]), fighter("ghost", ["ghost"]), 0.5, {
    ...fire,
    id: 165,
    type: "normal",
  }) > 0,
);
console.log("battle: Forcejeo ignores immunity: ok");
