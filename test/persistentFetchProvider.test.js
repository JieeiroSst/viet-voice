import assert from "node:assert/strict";
import test from "node:test";
import { createPersistentFetchProvider } from "../src/persistentFetchProvider.js";

test("reuses cached voice assets across chunks and revokes each model URL once", async () => {
  const storedAssets = new Map();
  const revokedUrls = [];
  let downloadCount = 0;
  let readCount = 0;
  let objectUrlCount = 0;
  let rate = 1;

  const provider = createPersistentFetchProvider({
    getRate: () => rate,
    readAsset: async (key) => {
      readCount += 1;
      return storedAssets.get(key);
    },
    writeAsset: async (key, blob) => storedAssets.set(key, blob),
    downloadAsset: async (url) => {
      downloadCount += 1;
      return url.endsWith(".json")
        ? new Blob([JSON.stringify({ inference: { length_scale: 1.2 } })])
        : new Blob(["model"]);
    },
    createObjectURL: () => `blob:model-${++objectUrlCount}`,
    revokeObjectURL: (url) => revokedUrls.push(url),
  });

  const configUrl = "https://example.test/voice.onnx.json";
  const modelUrl = "https://example.test/voice.onnx";
  const firstConfig = await provider.fetch(configUrl);
  rate = 0.5;
  const secondConfig = await provider.fetch(configUrl);
  const firstModelUrl = await provider.fetch(modelUrl);
  const secondModelUrl = await provider.fetch(modelUrl);

  assert.equal(firstConfig.inference.length_scale, 1.2);
  assert.equal(secondConfig.inference.length_scale, 2.4);
  assert.notEqual(firstConfig, secondConfig);
  assert.equal(firstModelUrl, secondModelUrl);
  assert.equal(downloadCount, 2);
  assert.equal(readCount, 2);
  assert.equal(objectUrlCount, 1);

  provider.destroy();
  assert.deepEqual(revokedUrls, [firstModelUrl]);
});
