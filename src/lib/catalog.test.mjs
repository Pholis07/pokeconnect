import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const data = JSON.parse(readFileSync(new URL("./pokemon-data.json", import.meta.url), "utf8"));
assert.equal(data.length, 1025);
assert.equal(new Set(data.map((p) => p.name)).size, 1025);
for (const [i, p] of data.entries()) {
  assert.equal(p.id, i + 1);
  assert.ok(p.generation >= 1 && p.generation <= 9);
  assert.ok(p.types.length >= 1 && p.types.length <= 2);
  assert.equal(Object.keys(p.stats).length, 6);
  assert.ok(Object.values(p.stats).every((v) => Number.isInteger(v) && v > 0));
  assert.ok(p.moves.length >= 1 && p.moves.length <= 4);
  assert.ok(p.moves.every((m) => m.power > 0 && m.pp > 0 && m.accuracy > 0 && m.accuracy <= 100));
  assert.ok(p.description);
  assert.ok(p.evolutions.some((e) => e.id === p.id));
}
assert.deepEqual(data[24].types, ["electric"]);
assert.equal(data[24].stats.speed, 90);
assert.ok(data[0].evolutions.some((e) => e.id === 2 && e.condition.includes("16")));
assert.ok(data[132].evolutions.length >= 9);
console.log("catalog: 1025 complete records, branching evolution and moves: ok");
