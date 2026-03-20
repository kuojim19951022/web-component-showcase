import { escapeHtml } from "../utils/helpers.js";
import { loadCss } from "../utils/css-loader.js";

export const TEMPLATE = `
  <div class="related-view-section" id="related-view-section" style="display:none;">
    <h4 class="related-title">相關影片</h4>
    <div class="video-modal-related-videos" id="video-modal-related-videos"></div>
  </div>

  <template id="related-video-item-template">
    <div class="related-video-item" data-id="">
      <div class="related-video-cover">
        <img src="" alt="">
        <div class="related-video-play-icon">
          <div class="play-icon-triangle"></div>
        </div>
      </div>
      <p class="related-video-title"></p>
    </div>
  </template>
`;

export function initRelatedViewElements(root) {
  return {
    relatedSection: root.querySelector("#related-view-section"),
    relatedContainer: root.querySelector("#video-modal-related-videos"),
    relatedItemTemplate: root.querySelector("#related-video-item-template"),
  };
}

export async function loadStyles() {
  const url = new URL("./styles/related-view.css", import.meta.url).href;
  return loadCss(url);
}

export function renderRelatedVideos({
  relatedSection,
  relatedContainer,
  relatedItemTemplate,
  list,
  defaultCover,
  showRelated,
}) {
  if (!showRelated || !list || list.length === 0) {
    if (relatedSection) relatedSection.style.display = "none";
    return;
  }

  if (!relatedContainer || !relatedItemTemplate?.content) {
    if (relatedSection) relatedSection.style.display = "none";
    return;
  }

  const templateRoot = relatedItemTemplate.content.firstElementChild;
  if (!templateRoot) {
    if (relatedSection) relatedSection.style.display = "none";
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const video of list) {
    const item = templateRoot.cloneNode(true);
    item.dataset.id = video.id || "";
    const img = item.querySelector("img");
    if (img) {
      const coverSrc =
        video.coverImage ||
        (video.youtubeId
          ? `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`
          : defaultCover);
      img.src = coverSrc;
      img.alt = escapeHtml(video.title);
    }
    const titleEl = item.querySelector(".related-video-title");
    if (titleEl) titleEl.textContent = video.title || "";
    fragment.appendChild(item);
  }

  relatedContainer.innerHTML = "";
  relatedContainer.appendChild(fragment);
  if (relatedSection) relatedSection.style.display = "flex";
}
