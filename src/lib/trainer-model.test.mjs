import assert from "node:assert/strict";
import { emptyTrainer, parseTrainer, toggleMember } from "./trainer-model.ts";
const six = ["a", "b", "c", "d", "e", "f"];
assert.throws(() => toggleMember(six, "g", 6), /máximo/);
assert.deepEqual(toggleMember(six, "a", 6), ["b", "c", "d", "e", "f"]);
assert.throws(() => toggleMember(["a", "b"], "c", 2), /máximo/);
assert.deepEqual(toggleMember(["a"], "b", 2), ["a", "b"]);
const state = {
  ...emptyTrainer(),
  favorites: ["pikachu"],
  team: ["bulbasaur"],
  cards: [
    {
      id: "cel25-5",
      lang: "es",
      name: "Pikachu",
      image: "https://assets.tcgdex.net/es/swsh/cel25/5",
    },
  ],
};
assert.deepEqual(parseTrainer(JSON.stringify(state)), state);
assert.deepEqual(parseTrainer(null), emptyTrainer());
assert.throws(() => parseTrainer("{broken"));
assert.throws(() => parseTrainer(JSON.stringify({ team: [1] })));
assert.throws(() => parseTrainer(JSON.stringify({ team: [...six, "g"] })));
assert.throws(() => parseTrainer(JSON.stringify({ images: { x: 123 } })));
assert.throws(() => parseTrainer(JSON.stringify({ cards: [{ id: "x", lang: "bad" }] })));
console.log("trainer-model: limits, hydration and invalid stored data: ok");
