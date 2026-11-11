import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(readFileSync(new URL("./tcg.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const card = {
  id: "cel25-5",
  localId: "5",
  name: "Pikachu",
  image: "https://assets.tcgdex.net/es/swsh/cel25/5",
};
const storage = () => ({ getItem: async () => null, setItem: async () => {} });
const response = () => ({ ok: true, json: async () => [card] });
function load(store, fetcher) {
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require: (name) => {
      assert.equal(name, "@react-native-async-storage/async-storage");
      return { __esModule: true, default: store };
    },
    fetch: fetcher,
    AbortController,
    URLSearchParams,
    setTimeout,
    clearTimeout,
  });
  return exports;
}

for (const failure of ["getItem", "setItem"]) {
  const store = storage();
  store[failure] = async () => {
    throw new Error("Almacenamiento no disponible");
  };
  const tcg = load(store, async () => response());
  const cards = await tcg.listCards("es", "pikachu", "", 1);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].id, card.id);
}
let requests = 0;
const retry = load(storage(), async () => {
  requests++;
  if (requests === 1) throw new Error("Sin conexión");
  return response();
});
await assert.rejects(retry.listCards("es", "", "", 1), /Sin conexión/);
assert.equal((await retry.listCards("es", "", "", 1)).length, 1);
assert.equal(requests, 2);
let concurrent = 0;
const dedup = load(storage(), async () => {
  concurrent++;
  return response();
});
await Promise.all([dedup.listCards("es", "", "", 1), dedup.listCards("es", "", "", 1)]);
assert.equal(concurrent, 1);
console.log("tcg: read/write cache failures, network retry and concurrent requests: ok");
