// 影片列表
const VIDEO_LIST_URL = "../data/video-list.json";

// 靜態 列表資料
// ../data/video-list.json
// API 列表資料
// https://mock.apidog.com/m1/1222159-1218189-default/api/libraryVideo/getVideoList

const VIDEO_DETAIL_API_ENDPOINT =
  "https://mock.apidog.com/m1/1222159-1218189-default/api/libraryVideo/getVideoDetail";

async function loadVideoList() {
  const container = document.getElementById("video-list-container");
  const templateEl = document.getElementById("video-item-template");

  if (!container || !templateEl) {
    console.error("找不到影片列表容器或模板");
    return;
  }

  try {
    const response = await fetch(VIDEO_LIST_URL);
    if (!response.ok) throw new Error("無法載入影片列表");

    const data = await response.json();
    // API 格式：{ status, list }；靜態 JSON 可能直接是陣列
    const list = Array.isArray(data) ? data : (data?.list ?? []);
    if (!list.length) {
      container.innerHTML = '<p class="no-data">暫無影音資料</p>';
      return;
    }

    const ytThumb = (v) =>
      v.youtubeId
        ? `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`
        : "";
    const videos = list.map((v) => ({
      ...v,
      coverImage: v.coverImage || ytThumb(v),
    }));

    const template = Handlebars.compile(templateEl.innerHTML);
    container.innerHTML = template({ videos });

    bindVideoItemClicks(container);
  } catch (error) {
    console.error("載入影片列表時發生錯誤:", error);
    container.innerHTML =
      '<p class="no-data">無法載入影音資料，請稍後再試。</p>';
  }
}

function bindVideoItemClicks(container) {
  if (!container) return;
  container.addEventListener("click", (e) => {
    const item = e.target.closest(".video-item");
    if (!item) return;
    const id = item.dataset.id;
    if (!id) return;
    const modal = document.querySelector("youtube-modal");
    if (modal && typeof modal.open === "function") {
      modal.open(id);
    }
  });
}

document.addEventListener("DOMContentLoaded", loadVideoList);
