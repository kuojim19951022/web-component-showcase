import { CONFIG, VALID_PLAYER_TYPES } from "./config.js";
import { Controller } from "./controller/index.js";
import { UIRenderer } from "./ui/index.js";
import { getBooleanAttribute } from "./utils/helpers.js";

class YoutubeModal extends HTMLElement {
  #controller = null;
  #uiRenderer = null;
  #initialized = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    const endpoint =
      this.getAttribute("endpoint") || window.YOUTUBE_MODAL_ENDPOINT || "";
    const hasEndpoint = !!endpoint;
    const source =
      this.getAttribute("source") || (hasEndpoint ? "api" : "static");
    const attrPlayerType = this.getAttribute("player-type");
    const playerType =
      attrPlayerType && VALID_PLAYER_TYPES.includes(attrPlayerType)
        ? attrPlayerType
        : CONFIG.PLAYER_TYPE;
    const showRelated = getBooleanAttribute(
      this,
      "show-related",
      CONFIG.SHOW_RELATED_DEFAULT,
    );
    const showTitle = getBooleanAttribute(
      this,
      "show-title",
      CONFIG.SHOW_TITLE,
    );
    const showDescription = getBooleanAttribute(
      this,
      "show-description",
      CONFIG.SHOW_DESCRIPTION,
    );

    const defaultCover = new URL(
      "./assets/images/default-cover.jpg",
      import.meta.url,
    ).href;

    // 靜態資料
    const dataUrl =
      source === "static" ? this.getAttribute("data-url") || null : null;

    // UI 初始化
    this.#uiRenderer = new UIRenderer();
    await this.#uiRenderer.mount(this.shadowRoot, {
      playerType,
      showTitle,
      showDescription,
      showRelated,
      defaultCover,
    });

    // Controller 初始化
    this.#controller = new Controller({
      source,
      endpoint,
      dataUrl,
      uiRenderer: this.#uiRenderer,
    });
    await this.#controller.init();

    // 標記初始化完成
    this.#initialized = true;
  }

  disconnectedCallback() {
    this.#controller?.destroy();
  }

  open(videoId) {
    if (!this.#initialized) return;
    return this.#controller?.open(videoId);
  }

  close() {
    if (!this.#initialized) return;
    this.#controller?.close();
  }

  isOpen() {
    if (!this.#initialized) return false;
    return this.#controller?.isOpen() ?? false;
  }
}

if (!customElements.get("youtube-modal")) {
  customElements.define("youtube-modal", YoutubeModal);
}
