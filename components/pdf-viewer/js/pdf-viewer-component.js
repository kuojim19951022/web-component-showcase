import { template } from "./pdf-viewer-template.js";
import { CONFIG, ELEMENT_IDS } from "./pdf-viewer-config.js";

// ====================
// 功能開關輔助函式
// ====================

// 判斷某項功能是否啟用（預設啟用，只有明確設為 false 才停用）
function isFeatureEnabled(group, key) {
  const groupConfig = CONFIG.features[group];
  if (!groupConfig) return true;
  return groupConfig[key] !== false;
}

class PdfViewer extends HTMLElement {
  // 建構函式：初始化 Web Component
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.$iframe = this.shadowRoot.querySelector("#pdf-viewer-iframe");
    this.$cssLink = this.shadowRoot.querySelector("link[data-pdf-viewer-css]");
    this._cssReady = false;
    this._pendingPdfUrl = null;
  }

  // 定義需要監聽的屬性
  static get observedAttributes() {
    return ["pdf-url", "src", "base-path", "color-mode"];
  }

  // 屬性變更回呼：當 pdf-url 或 src 屬性改變時觸發
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "base-path" && newValue) {
      this._applyCssPath();
    }
    if (name === "color-mode") {
      this._applyColorMode();
    }
    if ((name === "pdf-url" || name === "src") && newValue) {
      this._queueLoadPdf(newValue);
    }
  }

  // 元件掛載回呼：當元件被插入 DOM 時觸發
  connectedCallback() {
    this._applyCssPath();
    this._applyColorMode();
    const pdfUrl = this.getAttribute("src") || this.getAttribute("pdf-url");
    if (pdfUrl) {
      this._queueLoadPdf(pdfUrl);
    }
  }

  // 載入 PDF 檔案
  loadPdf(url) {
    const encodedUrl = encodeURIComponent(url);
    const viewerPath = `${this._getBasePath()}/vendor/pdfjs-5.4.530-dist/web/viewer.html`;
    this.$iframe.src = `${viewerPath}?file=${encodedUrl}`;
    this.$iframe.addEventListener(
      "load",
      () => {
        this._injectInnerCss();
        this._injectPatternClass();
        this._applyColorMode();
        this._applyAllToggles();
      },
      { once: true },
    );
  }

  // ====================
  // Utilities: 共用的工具函式
  // ====================

  _getBasePath() {
    const attrPath = this.getAttribute("base-path");
    const globalPath = window.PDF_VIEWER_BASE_PATH;
    const basePath = attrPath || globalPath || this._getAutoBasePath();
    return this._normalizePath(basePath);
  }

  // 自動推導元件路徑
  _getAutoBasePath() {
    try {
      return new URL("..", import.meta.url).href;
    } catch (_) {
      return "";
    }
  }

  // 正規化路徑
  _normalizePath(path) {
    if (!path) return "";
    const isAbsolute = /^(https?:)?\/\//.test(path) || path.startsWith("/");
    const resolved = isAbsolute
      ? path
      : new URL(path, window.location.href).href;
    return resolved.replace(/\/+$/, "");
  }

  // 動態注入 css 至 iframe 內的 viewer.html <head>
  // 可覆蓋 PDF.js 官方樣式
  _injectInnerCss() {
    const iframeDoc = this._getIframeDoc();
    if (!iframeDoc) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${this._getBasePath()}/css/pdf-viewer-inner.css`;
    iframeDoc.head.appendChild(link);
  }

  // 動態將 patternContainer class 注入至 iframe 內的 #mainContainer
  _injectPatternClass() {
    const iframeDoc = this._getIframeDoc();
    if (!iframeDoc) return;
    const mainContainer = iframeDoc.getElementById("mainContainer");
    if (mainContainer) {
      mainContainer.classList.add("patternContainer");
    }
  }

  // 套用 pdf-viewer.css 的路徑
  _applyCssPath() {
    if (!this.$cssLink) return;
    this.$cssLink.href = `${this._getBasePath()}/css/pdf-viewer.css`;
  }

  // 確保 CSS 已載入，避免 iframe 在錯誤尺寸下初始化
  _ensureCssLoaded() {
    if (this._cssReady || !this.$cssLink) {
      return Promise.resolve();
    }

    // 若 CSS 已經載入完成，直接放行
    if (this.$cssLink.sheet) {
      this._cssReady = true;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const finalize = () => {
        this._cssReady = true;
        resolve();
      };
      this.$cssLink.addEventListener("load", finalize, { once: true });
      this.$cssLink.addEventListener("error", finalize, { once: true });

      // 保護：避免極端情況下永遠等不到事件
      setTimeout(finalize, 2000);
    });
  }

  _queueLoadPdf(url) {
    this._pendingPdfUrl = url;
    this._ensureCssLoaded().then(() => {
      if (!this._pendingPdfUrl) return;
      const pendingUrl = this._pendingPdfUrl;
      this._pendingPdfUrl = null;
      this.loadPdf(pendingUrl);
    });
  }

  // 套用 color mode
  _applyColorMode() {
    const mode = this._getColorMode();
    const iframeDoc = this._getIframeDoc();
    if (!iframeDoc) return;
    const root = iframeDoc.documentElement;
    if (mode === "custom") {
      root.removeAttribute("data-color-mode");
      root.style.removeProperty("color-scheme");
      return;
    }
    root.setAttribute("data-color-mode", mode);
    root.style.colorScheme = mode;
  }

  // 取得 color mode（light / dark / custom，預設 custom）
  _getColorMode() {
    const attrRaw = (this.getAttribute("color-mode") || "").toLowerCase();
    const configRaw = (CONFIG.colorMode || "").toLowerCase();
    const resolved = attrRaw || configRaw || "custom";
    if (resolved === "custom") return "custom";
    return resolved === "dark" ? "dark" : "light";
  }

  // 取得 iframe 內部的 document 物件
  _getIframeDoc() {
    return (
      this.$iframe.contentDocument ||
      this.$iframe.contentWindow?.document ||
      null
    );
  }

  // 重試機制：持續執行函式直到成功或達到最大重試次數
  _retryUntil(applyFn) {
    let retries = 0;
    const retry = () => {
      if (applyFn()) return;
      if (retries++ < CONFIG.retryMaxCount) {
        setTimeout(retry, CONFIG.retryIntervalMs);
      }
    };
    retry();
  }

  // 觀察機制：監聽 DOM 變化，當函式執行成功後自動停止觀察
  _observeUntil(root, applyFn) {
    const observer = new MutationObserver(() => {
      if (applyFn()) observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), CONFIG.observerTimeoutMs);
  }

  // 統一入口：套用所有 UI 功能開關
  _applyAllToggles() {
    this._applySidebarToggles();
    this._applyFindbarToggles();
    this._applyMainToolbarToggles();
    this._applyEditorToolsToggles();
    this._applySecondaryMenuToggles();
  }

  // ====================
  // Features: 功能開關實作（主工具列、編輯工具、側邊欄、搜尋列、二級選單）
  // ====================

  // 套用主工具列按鈕開關
  _applyMainToolbarToggles() {
    const iframeDoc = this._getIframeDoc();
    if (!iframeDoc) return;

    const pending = new Set(Object.keys(ELEMENT_IDS.toolbarButtons));
    const apply = () => {
      // 先處理 zoomOut/zoomIn 的父容器（避免重複操作）
      const zoomOutEl = iframeDoc.getElementById(
        ELEMENT_IDS.toolbarButtons.zoomOut,
      );
      const zoomInEl = iframeDoc.getElementById(
        ELEMENT_IDS.toolbarButtons.zoomIn,
      );
      if (
        zoomOutEl?.parentElement &&
        zoomInEl?.parentElement &&
        zoomOutEl.parentElement === zoomInEl.parentElement
      ) {
        const bothHidden =
          !isFeatureEnabled("toolbar", "zoomOut") &&
          !isFeatureEnabled("toolbar", "zoomIn");
        zoomOutEl.parentElement.style.display = bothHidden ? "none" : "";
      }

      pending.forEach((key) => {
        const el = iframeDoc.getElementById(ELEMENT_IDS.toolbarButtons[key]);
        if (!el) return;
        const show = isFeatureEnabled("toolbar", key);
        el.style.display = show ? "" : "none";

        // 針對 scaleSelect 需要同時隱藏父容器
        if (key === "scaleSelect" && el.parentElement) {
          el.parentElement.style.display = show ? "" : "none";
        }

        pending.delete(key);
      });
      return pending.size === 0;
    };

    if (apply()) return;

    const toolbar = iframeDoc.getElementById("toolbarViewer");
    if (!toolbar) {
      this._retryUntil(apply);
      return;
    }

    this._observeUntil(toolbar, apply);
  }

  // 套用編輯工具按鈕開關
  _applyEditorToolsToggles() {
    const iframeDoc = this._getIframeDoc();
    if (!iframeDoc) return;

    const pending = new Set(Object.keys(ELEMENT_IDS.toolbarEditors));
    const apply = () => {
      pending.forEach((key) => {
        const el = iframeDoc.getElementById(ELEMENT_IDS.toolbarEditors[key]);
        if (!el) return;
        el.style.display = isFeatureEnabled("editorTools", key) ? "" : "none";
        pending.delete(key);
      });
      return pending.size === 0;
    };

    if (apply()) return;

    const toolbar = iframeDoc.getElementById("toolbarViewer");
    if (!toolbar) {
      this._retryUntil(apply);
      return;
    }

    this._observeUntil(toolbar, apply);
  }

  // 修改側邊欄切換按鈕的 tooltip（獨立方法，不屬於開關功能）
  _applySidebarTooltip() {
    const iframeDoc = this._getIframeDoc();
    if (!iframeDoc) return;

    const sidebarToggle = iframeDoc.getElementById("sidebarToggle");
    if (sidebarToggle) {
      sidebarToggle.setAttribute("title", "切換側邊欄");
      sidebarToggle.setAttribute("data-l10n-id", "");
    }
  }

  // 套用側邊欄功能開關
  _applySidebarToggles() {
    const iframeDoc = this._getIframeDoc();
    if (!iframeDoc) return;

    // 修改側邊欄切換按鈕的 tooltip
    this._applySidebarTooltip();

    const pending = new Set(Object.keys(ELEMENT_IDS.sidebarMenus));
    const apply = () => {
      pending.forEach((key) => {
        const menuEl = iframeDoc.getElementById(ELEMENT_IDS.sidebarMenus[key]);
        const panelEl = iframeDoc.getElementById(
          ELEMENT_IDS.sidebarPanels[key],
        );
        if (menuEl) {
          menuEl.style.display = isFeatureEnabled("sidebar", key) ? "" : "none";
        }
        if (panelEl) {
          panelEl.style.display = isFeatureEnabled("sidebar", key)
            ? ""
            : "none";
        }
        if (menuEl || panelEl) {
          pending.delete(key);
        }
      });
      return pending.size === 0;
    };

    if (apply()) return;

    const selectorMenu = iframeDoc.getElementById(
      "viewsManagerSelectorOptions",
    );
    if (!selectorMenu) {
      this._retryUntil(apply);
      return;
    }

    this._observeUntil(selectorMenu, apply);
  }

  // 套用搜尋列選項開關
  _applyFindbarToggles() {
    const iframeDoc = this._getIframeDoc();
    if (!iframeDoc) return;
    const FINDBAR_FEATURE_KEYS = [
      "matchCase",
      "matchDiacritics",
      "entireWord",
      "highlightAll",
    ];
    const pending = new Set(FINDBAR_FEATURE_KEYS);
    const apply = () => {
      pending.forEach((key) => {
        const id = ELEMENT_IDS.findbar[key];
        if (!id) return;
        const el = iframeDoc.getElementById(id);
        if (!el) return;

        const show = isFeatureEnabled("findbar", key);
        el.style.display = show ? "" : "none";

        pending.delete(key);
      });

      // 處理選項容器的顯示
      const hasVisibleOptions =
        isFeatureEnabled("findbar", "matchCase") ||
        isFeatureEnabled("findbar", "matchDiacritics") ||
        isFeatureEnabled("findbar", "entireWord") ||
        isFeatureEnabled("findbar", "highlightAll");

      const optionsOneContainer = iframeDoc.getElementById(
        ELEMENT_IDS.findbar.optionsOneContainer,
      );
      const optionsTwoContainer = iframeDoc.getElementById(
        ELEMENT_IDS.findbar.optionsTwoContainer,
      );

      if (optionsOneContainer) {
        optionsOneContainer.style.display = hasVisibleOptions ? "" : "none";
      }
      if (optionsTwoContainer) {
        optionsTwoContainer.style.display = hasVisibleOptions ? "" : "none";
      }

      return pending.size === 0;
    };

    if (apply()) return;

    const findbar = iframeDoc.getElementById("findbar");
    if (!findbar) {
      this._retryUntil(apply);
      return;
    }

    this._observeUntil(findbar, apply);
  }

  // 套用二級選單（工具選單）開關
  _applySecondaryMenuToggles() {
    const iframeDoc = this._getIframeDoc();
    if (!iframeDoc) return;

    const pending = new Set(Object.keys(ELEMENT_IDS.secondaryToolbar));
    const apply = () => {
      pending.forEach((key) => {
        // 跳過容器本身
        if (key === "container") {
          pending.delete(key);
          return;
        }

        const id = ELEMENT_IDS.secondaryToolbar[key];
        if (!id) return;
        const el = iframeDoc.getElementById(id);
        if (!el) return;

        const show = isFeatureEnabled("secondaryMenu", key);
        el.style.display = show ? "" : "none";

        if (
          el.parentElement &&
          el.parentElement.classList.contains("splitToolbarButton")
        ) {
          el.parentElement.style.display = show ? "" : "none";
        }

        pending.delete(key);
      });
      return pending.size === 0;
    };

    if (apply()) return;

    const secondaryToolbar = iframeDoc.getElementById("secondaryToolbar");
    if (!secondaryToolbar) {
      this._retryUntil(apply);
      return;
    }

    this._observeUntil(secondaryToolbar, apply);
  }
}

customElements.define("pdf-viewer", PdfViewer);
