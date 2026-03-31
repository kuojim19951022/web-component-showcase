// ── 書架 Grid 管理 ─────────────────────────────────────

// 讀取目前--col-count
function getColCount(container) {
  return (
    parseInt(getComputedStyle(container).getPropertyValue("--col-count")) || 6
  );
}

// 更新書架底板的 grid-row 定位
function updateShelfGrid(container) {
  const shelfItems = container.querySelectorAll(".bookshelf-bottom-item");
  shelfItems.forEach((item, i) => {
    const shelfIndex = i + 1;
    const shelfRow = shelfIndex * 2;
    item.style.gridRow = shelfRow;
  });
}

// 生成或更新 bookshelf-bottom-item
function syncShelfItems(container) {
  const colCount = getColCount(container);
  const bookItems = container.querySelectorAll(".book-item");
  const rowCount = Math.ceil(bookItems.length / colCount);
  const existing = container.querySelectorAll(".bookshelf-bottom-item");
  const difference = rowCount - existing.length;
  if (difference > 0) {
    // 不夠，補增
    for (let i = 0; i < difference; i++) {
      const el = document.createElement("div");
      el.className = "bookshelf-bottom-item";
      container.appendChild(el);
    }
  } else if (difference < 0) {
    // 太多，刪除多餘的（從最後開始刪）
    for (let i = 0; i < Math.abs(difference); i++) {
      const last = container.querySelector(".bookshelf-bottom-item:last-child");
      if (last) last.remove();
    }
  }
}

// 重新計算整個 shelf grid
function recalculateShelfGrid(container) {
  syncShelfItems(container);
  updateShelfGrid(container);
}

// ── 路徑設定 ───────────────────────────────────────────

const BOOK_COVER_DIR = "../images/book/";
const BOOK_PDF_DIR = "../data/book/pdf/";

// 將 API 回傳的相對/裸檔名路徑，統一解析為本地靜態資源路徑
function resolveLocalFile(raw, baseDir) {
  if (!raw) return "";
  const str = String(raw).trim();
  if (!str) return "";
  if (/^https?:\/\//i.test(str)) return str;
  const filename = str.split(/[\\/]/).pop().split("?")[0].split("#")[0];
  return filename ? `${baseDir}${filename}` : "";
}

// ── API 設定 ───────────────────────────────────────────

// 測試用 API
const API_URL =
  "https://mock.apidog.com/m1/1242188-1239035-default/api/getBookList";

// ── 元素引用 ───────────────────────────────────────────

const $loadMoreBtn = document.getElementById("load-more-book");
const $loadMoreContainer = document.querySelector(".load-more-container");
const $bookContainer = document.querySelector(".book-grid-container");
const $shelfTop = document.querySelector(".bookshelf-top-item");
const $toTopBtn = document.getElementById("totop-btn");
let shelfTopRevealed = false;

// ── 抓取經書資料 ───────────────────────────────────────

async function fetchBooks(offset) {
  setLoadingState(true);

  const params = new URLSearchParams({ offset });

  try {
    const res = await fetch(`${API_URL}?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const response = await res.json();
    handleSuccess(response);
  } catch (error) {
    handleError(error);
  } finally {
    setLoadingState(false);
  }
}

// 成功處理
function handleSuccess(response) {
  if (response.status && response.list && response.list.length > 0) {
    renderBooks(response.list);
    updateLoadMoreButton(
      response.offset + response.list.length,
      response.hasMore,
    );
    revealShelfTop();
  } else {
    // 無資料時仍需移除 loading，避免狀態永久保持
    revealShelfTop();
  }
}

// 失敗處理
function handleError(error) {
  console.error("載入書本失敗:", error);
  revealShelfTop();
}

function revealShelfTop() {
  if (shelfTopRevealed) return;
  shelfTopRevealed = true;
  if (!$shelfTop) return;
  $shelfTop.classList.remove("is-loading");
}

// Loading 狀態
function setLoadingState(loading) {
  if (!$loadMoreBtn) return;
  $loadMoreBtn.disabled = loading;
  const icon = $loadMoreBtn.querySelector("i");
  if (icon) icon.classList.toggle("fa-spin", loading);
}

// 更新載入更多按鈕
function updateLoadMoreButton(nextOffset, hasMore) {
  if (!$loadMoreBtn || !$loadMoreContainer) return;
  $loadMoreBtn.dataset.offset = nextOffset;
  const display = hasMore ? "" : "none";
  $loadMoreContainer.style.display = $loadMoreBtn.style.display = display;
}

function toggleToTopBtn() {
  if (!$toTopBtn) return;
  const shouldShow = window.scrollY > 240;
  $toTopBtn.classList.toggle("is-hidden", !shouldShow);
}

// 渲染書本列表(Handlebars 模板引擎編譯)
function renderBooks(list) {
  if (!$bookContainer) return;
  const templateSrc = document.getElementById("book-item-template").innerHTML;
  const templateFn = Handlebars.compile(templateSrc);
  const books = list.map((b) => ({
    ...b,
    coverImage: resolveLocalFile(b.coverImage, BOOK_COVER_DIR),
    pdfUrl: resolveLocalFile(b.pdfUrl, BOOK_PDF_DIR),
  }));
  const html = templateFn({ books });
  $bookContainer.insertAdjacentHTML("beforeend", html);
  recalculateShelfGrid($bookContainer);
}

// RWD：視窗大小改變時重新計算
let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if ($bookContainer) recalculateShelfGrid($bookContainer);
  }, 150);
});

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  // 初始載入
  fetchBooks(0);
  toggleToTopBtn();

  // 載入更多
  if ($loadMoreBtn) {
    $loadMoreBtn.addEventListener("click", function () {
      const offset = parseInt(this.dataset.offset, 10) || 0;
      fetchBooks(offset);
    });
  }

  if ($toTopBtn) {
    $toTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});

window.addEventListener("scroll", toggleToTopBtn, { passive: true });
