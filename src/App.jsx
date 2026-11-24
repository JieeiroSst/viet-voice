import React, { useEffect, useMemo, useRef, useState } from "react";
import { createLocalTtsEngine, requestPersistentStorage, VOICES } from "./localTts.js";
import { splitSpeechText } from "./speechText.js";

const sampleText = {
  vi: "Xin chào! Chào mừng bạn đến với VietVoice. Hãy nhập một đoạn văn bản tiếng Việt, chọn giọng đọc và nhấn nút phát để bắt đầu.",
  en: "Hello! Welcome to VietVoice. Enter some English text, choose a voice, and press play to hear it spoken aloud.",
};

const voiceOptions = [
  { id: VOICES.vi, language: "vi", labels: { vi: "Tiếng Việt — giọng đọc Việt Nam", en: "Vietnamese — Vietnamese voice" } },
  { id: VOICES.en, language: "en", labels: { vi: "Tiếng Anh — giọng Mỹ", en: "English — US voice" } },
];

const translations = {
  vi: {
    switchLanguage: "Chuyển sang tiếng Anh",
    metaDescription: "Chuyển văn bản thành giọng nói bằng mô hình chạy trực tiếp trên thiết bị.",
    freeLabel: "Miễn phí · Chạy cục bộ",
    eyebrow: "GIỌNG ĐỌC NGOẠI TUYẾN",
    headlineStart: "Để con chữ",
    headlineEnd: "lên tiếng.",
    intro: "Tạo giọng nói trên thiết bị, không cần API hay voice của hệ điều hành.",
    workspaceLabel: "Công cụ chuyển văn bản thành giọng nói",
    stepOne: "BƯỚC 1",
    stepTwo: "BƯỚC 2",
    textTitle: "Văn bản của bạn",
    sample: "Dùng văn bản mẫu",
    inputLabel: "Nhập văn bản cần đọc",
    placeholder: "Nhập hoặc dán nội dung bạn muốn chuyển thành giọng nói...",
    words: "từ",
    unlimited: "không giới hạn ký tự",
    characters: "ký tự",
    settingsTitle: "Tùy chỉnh giọng đọc",
    voice: "Giọng đọc",
    voiceHint: "Mỗi voice tải khoảng 60 MB một lần; xử lý tại máy và dùng ngoại tuyến sau đó.",
    rate: "Tốc độ",
    slow: "Chậm",
    fast: "Nhanh",
    volume: "Âm lượng",
    quiet: "Nhỏ",
    loud: "Lớn",
    play: "Tạo và nghe",
    pause: "Tạm dừng",
    resume: "Tiếp tục",
    stop: "Dừng",
    stopAria: "Dừng phát",
    playing: "Đang phát",
    paused: "Đang tạm dừng",
    downloading: "Đang tải mô hình",
    generating: "Đang tạo giọng nói trên thiết bị",
    cancelling: "Đang dừng tác vụ hiện tại",
    ready: "Sẵn sàng phát",
    downloadProgress: "Đã tải",
    estimatedDuration: "Thời lượng ước tính",
    minutes: "phút",
    localAudio: "Văn bản và âm thanh được xử lý trên thiết bị; chỉ mô hình giọng nói được tải lần đầu.",
    localModel: "Mô hình cục bộ",
    emptyText: "Bạn hãy nhập văn bản trước khi phát nhé.",
    unsupported: "Trình duyệt này không hỗ trợ chạy mô hình giọng nói cục bộ.",
    audioUnsupported: "Trình duyệt này không hỗ trợ phát âm thanh cục bộ.",
    playbackError: "Không thể phát âm thanh. Hãy kiểm tra thiết bị đầu ra âm thanh và thử lại.",
    modelError: "Không thể tải hoặc chạy mô hình giọng nói.",
  },
  en: {
    switchLanguage: "Switch to Vietnamese",
    metaDescription: "Turn text into speech with an on-device model.",
    freeLabel: "Free · Runs locally",
    eyebrow: "OFFLINE VOICE",
    headlineStart: "Let your words",
    headlineEnd: "speak.",
    intro: "Generate speech on your device, without an API or operating-system voice.",
    workspaceLabel: "Text-to-speech tool",
    stepOne: "STEP 1",
    stepTwo: "STEP 2",
    textTitle: "Your text",
    sample: "Try a sample",
    inputLabel: "Enter text to read aloud",
    placeholder: "Type or paste the text you want to turn into speech...",
    words: "words",
    unlimited: "no character limit",
    characters: "characters",
    settingsTitle: "Voice settings",
    voice: "Voice",
    voiceHint: "Each voice downloads about 60 MB once; speech then runs locally, including offline.",
    rate: "Speed",
    slow: "Slow",
    fast: "Fast",
    volume: "Volume",
    quiet: "Quiet",
    loud: "Loud",
    play: "Generate & listen",
    pause: "Pause",
    resume: "Resume",
    stop: "Stop",
    stopAria: "Stop playback",
    playing: "Playing",
    paused: "Paused",
    downloading: "Downloading voice model",
    generating: "Generating speech on this device",
    cancelling: "Stopping current task",
    ready: "Ready to play",
    downloadProgress: "Downloaded",
    estimatedDuration: "Estimated duration",
    minutes: "min",
    localAudio: "Text and audio are processed on this device; only the voice model is downloaded once.",
    localModel: "Local model",
    emptyText: "Enter some text before you press play.",
    unsupported: "This browser cannot run the local speech model.",
    audioUnsupported: "This browser cannot play local audio.",
    playbackError: "Could not play audio. Check the audio output device and try again.",
    modelError: "Could not download or run the voice model.",
  },
};

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "play") {
    return (
      <svg {...common} fill="currentColor" stroke="none">
        <path d="M8 5.7c0-.8.9-1.3 1.6-.9l9.1 5.3a2.2 2.2 0 0 1 0 3.8l-9.1 5.3c-.7.4-1.6-.1-1.6-.9V5.7Z" />
      </svg>
    );
  }
  if (name === "pause") {
    return (
      <svg {...common} fill="currentColor" stroke="none">
        <rect x="6" y="5" width="4" height="14" rx="1" />
        <rect x="14" y="5" width="4" height="14" rx="1" />
      </svg>
    );
  }
  if (name === "stop") {
    return (
      <svg {...common} fill="currentColor" stroke="none">
        <rect x="5" y="5" width="14" height="14" rx="2" />
      </svg>
    );
  }
  if (name === "spark") {
    return (
      <svg {...common}>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
        <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
      </svg>
    );
  }
  if (name === "volume") {
    return (
      <svg {...common}>
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    );
  }
  if (name === "wave") {
    return (
      <svg {...common}>
        <path d="M3 10v4m4-8v12m4-15v18m4-14v10m4-12v14m4-9v4" />
      </svg>
    );
  }
  return null;
}

function formatMegabytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function App() {
  const [language, setLanguage] = useState("vi");
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState(VOICES.vi);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(null);
  const engineRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const gainRef = useRef(null);
  const chunksRef = useRef([]);
  const jobRef = useRef(0);
  const generationInFlightRef = useRef(false);
  const rateRef = useRef(rate);
  const volumeRef = useRef(volume);
  const voiceIdRef = useRef(voiceId);
  rateRef.current = rate;
  volumeRef.current = volume;
  voiceIdRef.current = voiceId;

  const t = translations[language];
  const wordCount = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean).length,
    [text],
  );
  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 150));
  const isBusy = status !== "idle";

  useEffect(() => {
    document.documentElement.lang = language;
    document.title =
      language === "vi"
        ? "VietVoice — Văn bản thành giọng nói"
        : "VietVoice — Text to Speech";
    document.querySelector('meta[name="description"]')?.setAttribute("content", t.metaDescription);
  }, [language, t.metaDescription]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  useEffect(
    () => () => {
      stopCurrentAudio();
      engineRef.current?.destroy();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close();
      }
    },
    [],
  );

  function getAudioContext() {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return null;
    if (!audioContextRef.current) audioContextRef.current = new AudioContextConstructor();
    return audioContextRef.current;
  }

  function stopCurrentAudio() {
    if (!sourceRef.current) return;
    sourceRef.current.onended = null;
    try {
      sourceRef.current.stop();
    } catch (error) {
      if (error?.name !== "InvalidStateError") throw error;
    }
    sourceRef.current.disconnect();
    sourceRef.current = null;
    gainRef.current?.disconnect();
    gainRef.current = null;
  }

  function handleStop() {
    jobRef.current += 1;
    chunksRef.current = [];
    stopCurrentAudio();
    setDownloadProgress(null);
    setStatus(generationInFlightRef.current ? "cancelling" : "idle");
  }

  async function playChunk(index, jobId) {
    if (jobId !== jobRef.current) return;
    if (index >= chunksRef.current.length) {
      chunksRef.current = [];
      setStatus("idle");
      return;
    }

    try {
      setStatus("generating");
      await requestPersistentStorage();
      if (jobId !== jobRef.current) return;

      if (!engineRef.current) {
        engineRef.current = createLocalTtsEngine({
          getRate: () => rateRef.current,
          onProgress: (progress) => {
            if (progress.cached || jobId !== jobRef.current) return;
            setStatus("downloading");
            setDownloadProgress(progress);
          },
        });
      }

      generationInFlightRef.current = true;
      const result = await engineRef.current.generate(chunksRef.current[index], voiceIdRef.current);
      generationInFlightRef.current = false;
      if (jobId !== jobRef.current) {
        setStatus("idle");
        return;
      }

      setDownloadProgress(null);
      const audioContext = getAudioContext();
      if (!audioContext) throw new Error(t.audioUnsupported);
      const audioBuffer = await audioContext.decodeAudioData(await result.file.arrayBuffer());
      if (jobId !== jobRef.current) return;

      const source = audioContext.createBufferSource();
      const gain = audioContext.createGain();
      source.buffer = audioBuffer;
      gain.gain.value = volumeRef.current;
      source.connect(gain);
      gain.connect(audioContext.destination);
      gainRef.current = gain;
      source.onended = () => {
        if (sourceRef.current !== source) return;
        sourceRef.current = null;
        gainRef.current = null;
        void playChunk(index + 1, jobId);
      };
      sourceRef.current = source;
      setStatus("speaking");
      source.start();
    } catch (error) {
      generationInFlightRef.current = false;
      if (jobId !== jobRef.current) {
        setStatus("idle");
        return;
      }
      chunksRef.current = [];
      setDownloadProgress(null);
      setStatus("idle");
      setNotice(error instanceof Error ? error.message : t.modelError);
    }
  }

  function handleSpeak() {
    if (!text.trim()) {
      setNotice(t.emptyText);
      return;
    }
    if (isBusy || generationInFlightRef.current) return;

    const audioContext = getAudioContext();
    if (!audioContext) {
      setNotice(t.audioUnsupported);
      return;
    }
    void audioContext.resume().catch((error) => {
      console.error("Could not activate local audio playback:", error);
    });

    handleStop();
    chunksRef.current = splitSpeechText(text.trim(), 400);
    setStatus("generating");
    void playChunk(0, jobRef.current);
  }

  async function handlePause() {
    const audioContext = audioContextRef.current;
    if (!audioContext || !sourceRef.current) return;

    try {
      if (status === "paused") {
        await audioContext.resume();
        setStatus("speaking");
      } else {
        await audioContext.suspend();
        setStatus("paused");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t.playbackError);
    }
  }

  function handleVoiceChange(nextVoiceId) {
    handleStop();
    setVoiceId(nextVoiceId);
    const nextLanguage = nextVoiceId === VOICES.vi ? "vi" : "en";
    setLanguage(nextLanguage);
    setNotice("");
  }

  function handleLanguageToggle() {
    const nextLanguage = language === "vi" ? "en" : "vi";
    handleStop();
    setLanguage(nextLanguage);
    setVoiceId(VOICES[nextLanguage]);
    setNotice("");
  }

  function handleLoadSample() {
    handleStop();
    setText(sampleText[language]);
  }

  const statusText = {
    idle: t.ready,
    downloading: t.downloading,
    generating: t.generating,
    speaking: t.playing,
    paused: t.paused,
    cancelling: t.cancelling,
  }[status];
  const progressPercent = downloadProgress?.total
    ? Math.min(100, Math.round((downloadProgress.received / downloadProgress.total) * 100))
    : 0;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="VietVoice">
          <span className="brand-mark"><Icon name="wave" size={21} /></span>
          <span>viet<span className="brand-accent">voice</span></span>
        </a>
        <div className="topbar-actions">
          <span className="topbar-note"><span className="online-dot" /> {t.freeLabel}</span>
          <button className="language-toggle" type="button" onClick={handleLanguageToggle} aria-label={t.switchLanguage}>
            {language === "vi" ? "EN" : "VI"}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow"><Icon name="spark" size={16} /> {t.eyebrow}</div>
        <h1>{t.headlineStart} <span>{t.headlineEnd}</span></h1>
        <p>{t.intro}</p>
      </section>

      <section className="workspace" aria-label={t.workspaceLabel}>
        <div className="editor-card">
          <div className="card-heading">
            <div>
              <span className="step-label">{t.stepOne}</span>
              <h2>{t.textTitle}</h2>
            </div>
            <button className="text-button" type="button" onClick={handleLoadSample}>
              {t.sample} <span aria-hidden="true">↗</span>
            </button>
          </div>
          <label className="sr-only" htmlFor="speech-text">{t.inputLabel}</label>
          <textarea
            id="speech-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t.placeholder}
          />
          <div className="editor-footer">
            <span>{wordCount.toLocaleString(language === "vi" ? "vi-VN" : "en-US")} {t.words} <span className="footer-divider">·</span> {t.unlimited}</span>
            <span>{text.length.toLocaleString(language === "vi" ? "vi-VN" : "en-US")} {t.characters}</span>
          </div>
        </div>

        <div className="settings-card">
          <div className="card-heading settings-heading">
            <div>
              <span className="step-label">{t.stepTwo}</span>
              <h2>{t.settingsTitle}</h2>
            </div>
            <span className="settings-icon"><Icon name="volume" size={19} /></span>
          </div>

          <div className="voice-field">
            <label htmlFor="voice-select">{t.voice}</label>
            <div className="select-wrap">
              <select id="voice-select" value={voiceId} onChange={(event) => handleVoiceChange(event.target.value)}>
                {voiceOptions.map((voice) => (
                  <option key={voice.id} value={voice.id}>{voice.labels[language]}</option>
                ))}
              </select>
              <span className="select-chevron" aria-hidden="true">⌄</span>
            </div>
            <p className="field-hint">{t.voiceHint}</p>
          </div>

          <div className="slider-field">
            <div className="slider-label">
              <label htmlFor="rate">{t.rate}</label>
              <span>{rate.toFixed(1)}x</span>
            </div>
            <input id="rate" type="range" min="0.7" max="1.5" step="0.1" value={rate}
              style={{ "--range-progress": `${((rate - 0.7) / 0.8) * 100}%` }}
              onChange={(event) => setRate(Number(event.target.value))} />
            <div className="range-ends"><span>{t.slow}</span><span>{t.fast}</span></div>
          </div>

          <div className="slider-field volume-field">
            <div className="slider-label">
              <label htmlFor="volume">{t.volume}</label>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input id="volume" type="range" min="0" max="1" step="0.05" value={volume}
              style={{ "--range-progress": `${volume * 100}%` }}
              onChange={(event) => setVolume(Number(event.target.value))} />
            <div className="range-ends"><span>{t.quiet}</span><span>{t.loud}</span></div>
          </div>

          <div className="playback-row">
            <button className="play-button" type="button" onClick={handleSpeak} disabled={isBusy}>
              <Icon name="play" size={19} /> {t.play}
            </button>
            <button className="control-button" type="button" onClick={() => void handlePause()}
              disabled={status !== "speaking" && status !== "paused"}
              aria-label={status === "paused" ? t.resume : t.pause}>
              <Icon name={status === "paused" ? "play" : "pause"} size={17} />
            </button>
            <button className="control-button" type="button" onClick={handleStop}
              disabled={status === "idle" || status === "cancelling"} aria-label={t.stopAria} title={t.stop}>
              <Icon name="stop" size={16} />
            </button>
          </div>
          <div className="playback-meta">
            <span className={`status-label ${isBusy ? "is-active" : ""}`}>
              <span className="status-dot" />
              {statusText}
            </span>
            <span>{wordCount > 0 ? `~${estimatedMinutes} ${t.minutes}` : t.estimatedDuration}</span>
          </div>
          {status === "downloading" && downloadProgress && (
            <div className="download-details">
              <div className="download-progress" role="progressbar" aria-valuenow={progressPercent} aria-valuemin="0" aria-valuemax="100">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <span>{t.downloadProgress} {formatMegabytes(downloadProgress.received)} / {formatMegabytes(downloadProgress.total || downloadProgress.received)}</span>
            </div>
          )}
        </div>
      </section>

      <footer className="page-footer">
        <span>{t.localAudio}</span>
        <span className="footer-badge"><span aria-hidden="true">✦</span> {t.localModel}</span>
      </footer>

      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}

export default App;
