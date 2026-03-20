import { PLAYER_VARS } from "../config.js";

// 是否顯示 overlay（稍後觀看、分享）；false 則僅顯示複製連結
const LITE_YOUTUBE_JS_API = true;

const SCRIPT_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/lite-youtube-embed/0.3.3/lite-yt-embed.js";
const SCRIPT_INTEGRITY =
  "sha512-WKiiKu2dHNBXgIad9LDYeXL80USp6v+PmhRT5Y5lIcWonM2Avbn0jiWuXuh7mL2d5RsU3ZmIxg5MiWMEMykghA==";
const CSS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/lite-youtube-embed/0.3.3/lite-yt-embed.css";

const CACHED_PLAYER_PARAMS = new URLSearchParams(PLAYER_VARS).toString();

let scriptLoadPromise = null;
let cachedCSS = null;

function waitForCustomElement(name, resolve, reject, timeout = 5000) {
  const checkInterval = setInterval(() => {
    if (customElements.get(name)) {
      clearInterval(checkInterval);
      resolve();
    }
  }, 50);
  setTimeout(() => {
    clearInterval(checkInterval);
    if (!customElements.get(name)) {
      reject(new Error(`${name} 載入超時`));
    }
  }, timeout);
}

function loadScript() {
  if (scriptLoadPromise) return scriptLoadPromise;
  if (customElements.get("lite-youtube")) {
    scriptLoadPromise = Promise.resolve();
    return scriptLoadPromise;
  }
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.integrity = SCRIPT_INTEGRITY;
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "no-referrer";
    const existing = document.querySelector(`script[src="${script.src}"]`);
    if (existing) {
      if (customElements.get("lite-youtube")) {
        resolve();
      } else {
        waitForCustomElement("lite-youtube", resolve, reject);
      }
    } else {
      script.onload = () =>
        waitForCustomElement("lite-youtube", resolve, reject);
      script.onerror = () =>
        reject(new Error("lite-youtube-embed 腳本載入失敗"));
      document.head.appendChild(script);
    }
  });
  return scriptLoadPromise;
}

async function loadCSS() {
  if (cachedCSS !== null) return cachedCSS;
  try {
    const res = await fetch(CSS_URL);
    cachedCSS = res.ok ? await res.text() : "";
  } catch {
    cachedCSS = "";
  }
  return cachedCSS;
}

export async function loadLiteYoutubeAssets() {
  const [, css] = await Promise.all([loadScript(), loadCSS()]);
  return { css };
}

export class LiteYoutubePlayer {
  #container = null;
  #element = null;

  init(container, youtubeId, videoTitle = "") {
    if (!container || !youtubeId) return;
    this.#container = container;
    const el = document.createElement("lite-youtube");
    el.setAttribute("videoid", youtubeId);
    el.setAttribute("params", CACHED_PLAYER_PARAMS);
    if (LITE_YOUTUBE_JS_API) el.setAttribute("js-api", "");
    const playlabel = videoTitle?.trim()
      ? `播放：${videoTitle.trim()}`
      : "播放影片";
    el.setAttribute("playlabel", playlabel);
    container.appendChild(el);
    this.#element = el;
  }

  destroy() {
    this.#element?.remove();
    this.#element = null;
    this.#container = null;
  }
}
