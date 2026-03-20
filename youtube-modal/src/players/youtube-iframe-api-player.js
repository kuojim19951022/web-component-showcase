import { PLAYER_VARS } from "../config.js";

const API_URL = "https://www.youtube.com/iframe_api";
const THUMB_URL = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

let apiLoadPromise = null;

function loadAPI() {
  if (apiLoadPromise) return apiLoadPromise;
  if (typeof window.YT !== "undefined" && window.YT.Player) {
    apiLoadPromise = Promise.resolve();
    return apiLoadPromise;
  }
  apiLoadPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === "function") prev();
      resolve();
    };
    const script = document.createElement("script");
    script.src = API_URL;
    script.async = true;
    const first = document.querySelector("script");
    if (first?.parentNode) {
      first.parentNode.insertBefore(script, first);
    } else {
      document.head.appendChild(script);
    }
  });
  return apiLoadPromise;
}

export class YoutubeIframeApiPlayer {
  #container = null;
  #facade = null;
  #ytPlayer = null;
  #youtubeId = "";
  #videoTitle = "";

  init(container, youtubeId, videoTitle = "") {
    if (!container || !youtubeId) return;
    this.#container = container;
    this.#youtubeId = youtubeId;
    this.#videoTitle = videoTitle || "播放影片";

    this.#facade = document.createElement("div");
    this.#facade.className = "player-facade";
    this.#facade.setAttribute("role", "button");
    this.#facade.setAttribute("tabindex", "0");
    this.#facade.setAttribute("aria-label", `播放：${this.#videoTitle}`);
    this.#facade.style.backgroundImage = `url("${THUMB_URL(youtubeId)}")`;
    this.#facade.innerHTML =
      '<div class="player-facade-playbtn" aria-hidden="true"></div>';

    const onPlay = () => this.#loadPlayer();
    this.#facade.addEventListener("click", onPlay);
    this.#facade.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onPlay();
      }
    });

    container.appendChild(this.#facade);
  }

  async #loadPlayer() {
    if (!this.#container || !this.#youtubeId) return;
    this.#facade?.remove();
    this.#facade = null;

    await loadAPI();

    const div = document.createElement("div");
    div.id = "yt-api-player-" + Date.now();
    div.className = "youtube-iframe-player";
    div.setAttribute("title", this.#videoTitle);
    this.#container.appendChild(div);
    const playerVars = { ...PLAYER_VARS, enablejsapi: 1 };
    this.#ytPlayer = new window.YT.Player(div, {
      videoId: this.#youtubeId,
      playerVars,
      width: "100%",
      height: "100%",
    });
  }

  destroy() {
    try {
      this.#ytPlayer?.destroy();
    } catch {}
    this.#ytPlayer = null;
    this.#facade?.remove();
    this.#facade = null;
    if (this.#container) this.#container.innerHTML = "";
    this.#container = null;
  }
}
