import { loadCssBundle } from "../utils/css-loader.js";

export const TEMPLATE = `
  <div class="video-modal-overlay" id="video-modal">
    <div class="video-modal-container">
      <button class="video-modal-close" id="video-modal-close" aria-label="關閉視窗">&times;</button>
      <div class="video-modal-content">
        <div id="video-view-slot"></div>
        <div id="related-view-slot"></div>
      </div>
    </div>
  </div>
`;

export function initShellElements(shadowRoot) {
  return {
    modal: shadowRoot.querySelector("#video-modal"),
    closeBtn: shadowRoot.querySelector("#video-modal-close"),
    videoViewSlot: shadowRoot.querySelector("#video-view-slot"),
    relatedViewSlot: shadowRoot.querySelector("#related-view-slot"),
  };
}

export async function loadStyles() {
  const styleFiles = [new URL("./styles/modal-shell.css", import.meta.url).href];
  return loadCssBundle(styleFiles);
}
