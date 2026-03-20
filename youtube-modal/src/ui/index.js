import { renderContent, renderBodyVisibility } from "./video-view.js";
import { renderRelatedVideos } from "./related-view.js";
import { clearModalContent } from "../utils/helpers.js";
import { createPlayer, loadPlayerAssets } from "../players/index.js";
import {
  TEMPLATE as SHELL_TEMPLATE,
  initShellElements,
  loadStyles,
} from "./modal-shell.js";
import * as VideoView from "./video-view.js";
import * as RelatedView from "./related-view.js";

export class UIRenderer {
  #elements = null;
  #options = {};
  #currentPlayer = null;

  // Mount Shadow DOM UI
  async mount(shadowRoot, options = {}) {
    this.#options = options;
    const { playerType } = options;
    const [playerAssets, shellCSS, videoViewCSS, relatedViewCSS] =
      await Promise.all([
        loadPlayerAssets(playerType),
        loadStyles(),
        VideoView.loadStyles(),
        RelatedView.loadStyles(),
      ]);

    shadowRoot.innerHTML = `
      <style>${shellCSS}</style>
      <style>${videoViewCSS}</style>
      <style>${relatedViewCSS}</style>
      <style>${playerAssets.css || ""}</style>
      ${SHELL_TEMPLATE}
    `;

    const shellEls = initShellElements(shadowRoot);
    shellEls.videoViewSlot.innerHTML = VideoView.TEMPLATE;
    shellEls.relatedViewSlot.innerHTML = RelatedView.TEMPLATE;

    const videoViewEls = VideoView.initVideoViewElements(
      shellEls.videoViewSlot,
    );
    const relatedViewEls = RelatedView.initRelatedViewElements(
      shellEls.relatedViewSlot,
    );
    this.#elements = { ...shellEls, ...videoViewEls, ...relatedViewEls };

    return this.#elements;
  }

  getElements() {
    return this.#elements;
  }

  getModalElement() {
    return this.#elements?.modal ?? null;
  }

  // 綁定 UI 事件並委派給 controller
  bindInteractions({ onClose, onRelatedSelect } = {}) {
    const elements = this.#elements;
    if (!elements) throw new Error("[UIRenderer] elements 尚未 mount");

    const { closeBtn, modal, relatedContainer } = elements;

    closeBtn?.addEventListener("click", () => onClose?.());

    modal?.addEventListener("click", (e) => {
      if (e.target === modal) onClose?.();
    });

    relatedContainer?.addEventListener("click", (e) => {
      const item = e.target.closest(".related-video-item");
      if (item?.dataset?.id) onRelatedSelect?.(item.dataset.id);
    });
  }

  showLoading() {
    this.destroyCurrentPlayer();
    clearModalContent(this.#elements);
    const { title } = this.#elements;
    if (title) {
      title.textContent = "載入中...";
      title.style.display = "";
    }
  }

  showVideo(data) {
    this.destroyCurrentPlayer();
    const { video } = data;
    const {
      playerType,
      showTitle,
      showDescription,
      showRelated,
      defaultCover,
    } = this.#options;

    renderContent(this.#elements, video, { showTitle, showDescription });

    const player = createPlayer(playerType);
    player.init(this.#elements.iframeContainer, video.youtubeId, video.title);
    this.#currentPlayer = player;

    renderRelatedVideos({
      ...this.#elements,
      list: data.related,
      defaultCover,
      showRelated,
    });

    renderBodyVisibility(this.#elements);
  }

  showError(error) {
    this.destroyCurrentPlayer();
    clearModalContent(this.#elements);
    console.error("[YoutubeModal]", error);
    const { title } = this.#elements;
    if (title) {
      title.textContent = "載入失敗，請稍後再試";
      title.style.display = "";
    }
  }

  clear() {
    this.destroyCurrentPlayer();
    clearModalContent(this.#elements);
  }

  // 釋放目前播放器
  destroyCurrentPlayer() {
    if (this.#currentPlayer) {
      this.#currentPlayer.destroy();
    }
    this.#currentPlayer = null;
  }
}
