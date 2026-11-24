import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "node_modules/piper-tts-web/dist/onnx/*.wasm", dest: "onnx" },
        { src: "node_modules/piper-tts-web/dist/piper/*", dest: "piper" },
        { src: "node_modules/piper-tts-web/dist/worker/PhonemizeWebWorker.js", dest: "worker" },
      ],
    }),
  ],
});
