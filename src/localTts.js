import OnnxWebWorkerRuntime from "piper-tts-web/src/Runtime/Onnx/OnnxWebWorkerRuntime.js";
import HuggingFaceVoiceProvider from "piper-tts-web/src/Provider/Voice/HuggingFaceVoiceProvider.js";
import { createPersistentFetchProvider } from "./persistentFetchProvider.js";

export const VOICES = {
  vi: "vi_VN-vais1000-medium",
  en: "en_US-ljspeech-medium",
};

const MODEL_REVISION = "e5349433ed883a32f893a434dc43a6c66b95ef7c";
const MODEL_BASE_URL = `https://huggingface.co/rhasspy/piper-voices/resolve/${MODEL_REVISION}/`;
const DATABASE_NAME = "vietvoice-offline-models";
const STORE_NAME = "assets";
const MODEL_SIZES = {
  "vi_VN-vais1000-medium": 63_221_984,
  "en_US-ljspeech-medium": 63_531_379,
};

let databasePromise;

function openDatabase() {
  if (!("indexedDB" in globalThis)) {
    return Promise.reject(new Error("Trình duyệt này không hỗ trợ lưu mô hình ngoại tuyến."));
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Không thể mở bộ nhớ mô hình."));
    request.onblocked = () => reject(new Error("Bộ nhớ mô hình đang bị khóa ở thẻ khác."));
  });
  return databasePromise;
}

async function readAsset(key) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Không thể đọc mô hình đã lưu."));
  });
}

async function writeAsset(key, value) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Không thể lưu mô hình."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Lưu mô hình bị hủy."));
  });
}

function expectedSizeFor(url) {
  if (!url.endsWith(".onnx")) return 0;
  const voice = Object.keys(MODEL_SIZES).find((modelId) => url.includes(`${modelId}.onnx`));
  return voice ? MODEL_SIZES[voice] : 0;
}

async function downloadAsset(url, onProgress) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("Chưa có mô hình này trên thiết bị. Kết nối Internet để tải voice lần đầu.");
  }
  if (!response.ok) {
    throw new Error(`Không tải được mô hình giọng đọc (HTTP ${response.status}).`);
  }

  const expectedSize = expectedSizeFor(url);
  const total = expectedSize || Number(response.headers.get("content-length")) || 0;
  const reader = response.body?.getReader();
  if (!reader) {
    const blob = await response.blob();
    onProgress({ received: blob.size, total: total || blob.size, cached: false });
    return blob;
  }

  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    onProgress({ received, total, cached: false });
  }

  return new Blob(chunks, {
    type: url.endsWith(".json") ? "application/json" : "application/octet-stream",
  });
}

class LocalPhonemizer {
  constructor() {
    this.worker = new Worker("/worker/PhonemizeWebWorker.js", { type: "module" });
    this.worker.postMessage({ type: "constructor", data: { basePath: "/piper/" } });
  }

  phonemize(text, voiceData) {
    return new Promise((resolve, reject) => {
      this.worker.onmessage = ({ data }) => resolve(data);
      this.worker.onerror = (event) => reject(new Error(event.message || "Không thể khởi động bộ đọc văn bản."));
      this.worker.postMessage({ type: "phonemize", data: [text, voiceData] });
    });
  }

  destroy() {
    this.worker.postMessage({ type: "destroy" });
    this.worker.terminate();
  }
}

export function createLocalTtsEngine({ onProgress, getRate }) {
  const provider = new HuggingFaceVoiceProvider({
    provider: createPersistentFetchProvider({
      onProgress,
      getRate,
      readAsset,
      writeAsset,
      downloadAsset,
    }),
    baseUrl: MODEL_BASE_URL,
  });
  const onnxRuntime = new OnnxWebWorkerRuntime({ basePath: "/onnx/", numThreads: 1 });
  const phonemizeRuntime = new LocalPhonemizer();

  return {
    async generate(text, voice) {
      const voiceData = await provider.fetch(voice);
      const phonemeData = await phonemizeRuntime.phonemize(text, voiceData);
      return onnxRuntime.generate(phonemeData, voiceData, 0);
    },
    destroy() {
      onnxRuntime.destroy();
      phonemizeRuntime.destroy();
      provider.destroy();
    },
  };
}

export async function requestPersistentStorage() {
  if (navigator.storage?.persist) await navigator.storage.persist();
}
