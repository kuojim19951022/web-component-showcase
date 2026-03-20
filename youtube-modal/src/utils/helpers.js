export function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

export function getBooleanAttribute(element, name, fallback) {
  if (!element.hasAttribute(name)) return fallback;
  const value = element.getAttribute(name);
  if (value === null || value === "") return true;
  return !/^(false|0|no|off)$/i.test(value.trim());
}

export function clearModalContent(elements) {
  const {
    title,
    description,
    iframeContainer,
    relatedContainer,
    relatedSection,
    relatedViewSlot,
  } = elements;
  if (title) {
    title.textContent = "";
    title.style.display = "";
  }
  if (description) {
    description.textContent = "";
    description.style.display = "none";
  }
  if (iframeContainer) iframeContainer.innerHTML = "";
  if (relatedContainer) relatedContainer.innerHTML = "";
  if (relatedSection) relatedSection.style.display = "none";
  if (relatedViewSlot) relatedViewSlot.style.display = "none";
}

export function validateVideoData(data) {
  if (!data || typeof data !== "object") {
    throw new Error("資料格式無效：必須為物件");
  }
  if (!data.video || typeof data.video !== "object") {
    throw new Error("資料格式無效：缺少 video 欄位");
  }
  if (!data.video.youtubeId) {
    throw new Error("此影片沒有 YouTube 連結");
  }
}
