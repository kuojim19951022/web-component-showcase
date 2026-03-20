import { loadCss } from "../utils/css-loader.js";

export function renderContent(elements, video, options = {}) {
  const { title, description } = elements;
  const { showTitle = true, showDescription = true } = options;

  if (title) {
    if (showTitle) {
      title.textContent = video.title || "";
      title.style.display = "";
    } else {
      title.textContent = "";
      title.style.display = "none";
    }
  }

  if (description) {
    const hasDescription =
      typeof video.description === "string" && video.description.trim() !== "";
    const shouldShow = showDescription !== false && hasDescription;
    description.textContent = shouldShow ? video.description : "";
    description.style.display = shouldShow ? "" : "none";
  }
}

export function renderBodyVisibility(elements) {
  const { relatedViewSlot, relatedSection } = elements;
  if (!relatedViewSlot) return;
  const relatedVisible =
    relatedSection && relatedSection.style.display !== "none";
  relatedViewSlot.style.display = relatedVisible ? "" : "none";
}

export const TEMPLATE = `
  <div class="video-view-section">
    <div class="video-modal-header">
      <h3 class="video-modal-title" id="video-modal-title"></h3>
    </div>
    <div class="video-iframe-container" id="video-iframe-container"></div>
    <div class="video-modal-description" id="video-modal-description"></div>
  </div>
`;

export function initVideoViewElements(root) {
  return {
    title: root.querySelector("#video-modal-title"),
    iframeContainer: root.querySelector("#video-iframe-container"),
    description: root.querySelector("#video-modal-description"),
  };
}

export async function loadStyles() {
  const url = new URL("./styles/video-view.css", import.meta.url).href;
  return loadCss(url);
}
