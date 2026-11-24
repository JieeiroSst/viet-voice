export function createPersistentFetchProvider({
  onProgress,
  getRate,
  readAsset,
  writeAsset,
  downloadAsset,
  createObjectURL = (blob) => URL.createObjectURL(blob),
  revokeObjectURL = (url) => URL.revokeObjectURL(url),
}) {
  const cachedAssets = new Map();
  const objectUrls = new Set();

  function loadAsset(url) {
    let assetPromise = cachedAssets.get(url);
    if (assetPromise) return assetPromise;

    assetPromise = (async () => {
      const key = `piper:${url}`;
      let blob = await readAsset(key);
      if (!blob) {
        blob = await downloadAsset(url, (progress) => onProgress?.({ ...progress, url }));
        await writeAsset(key, blob);
      } else {
        onProgress?.({ received: blob.size, total: blob.size, cached: true, url });
      }

      if (url.endsWith(".json")) return JSON.parse(await blob.text());

      const objectUrl = createObjectURL(blob);
      objectUrls.add(objectUrl);
      return objectUrl;
    })().catch((error) => {
      cachedAssets.delete(url);
      throw error;
    });

    cachedAssets.set(url, assetPromise);
    return assetPromise;
  }

  return {
    async fetch(url) {
      const asset = await loadAsset(url);
      if (!url.endsWith(".json")) return asset;

      return {
        ...asset,
        inference: {
          ...asset.inference,
          length_scale: asset.inference.length_scale / getRate(),
        },
      };
    },
    destroy() {
      for (const objectUrl of objectUrls) revokeObjectURL(objectUrl);
      objectUrls.clear();
      cachedAssets.clear();
    },
  };
}
