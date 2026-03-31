// ====================
// Config: 可操控的功能開關
// ====================
export const CONFIG = {
  // === 重試機制設定 ===
  // 重試間隔時間（毫秒）- 建議範圍：50-200ms
  retryIntervalMs: 100,
  
  // 最大重試次數 - 建議範圍：30-100（避免無限重試）
  retryMaxCount: 50,
  
  // MutationObserver 觀察超時時間（毫秒）- 建議範圍：5000-15000ms（5-15 秒）
  observerTimeoutMs: 10000,
  
  // === 顏色模式設定 ===
  // 可選：'light' | 'dark' | 'custom'
  colorMode: 'custom',
  
  // === 功能開關設定 ===
  // 黑名單設計：只需列出「要關閉」的項目，未列出的項目預設皆為開啟
  // 可用的所有項目清單請參考指南文件 pdf-viewer-guide.md
  features: {
    // === 編輯工具按鈕 ===
    editorTools: {
      highlight: false,  // 強調工具（螢光筆）
      freeText: false,   // 文字工具
      ink: false,        // 繪圖工具
      stamp: false       // 新增或編輯圖片工具
    },

    // === 搜尋列選項 ===
    findbar: {
      matchCase: false,      // 區分大小寫
      matchDiacritics: false, // 符合變音符號
      entireWord: false,     // 符合整個字
      highlightAll: false    // 強調全部
    },

    // === 二級選單（工具選單）===
    secondaryMenu: {
      viewBookmark: false  // 目前頁面
    }
  }
};

// ====================
// DOM 對照表（PDF.js 內部元素 ID）
// ====================
export const ELEMENT_IDS = {
  // === 主工具列按鈕 ===
  toolbarButtons: {
    previous: 'previous',
    next: 'next',
    zoomOut: 'zoomOutButton',
    zoomIn: 'zoomInButton',
    scaleSelect: 'scaleSelect',
    print: 'printButton',
    save: 'downloadButton',
    findButton: 'viewFindButton'
  },

  // === 編輯工具按鈕 ===
  toolbarEditors: {
    highlight: 'editorHighlight',
    freeText: 'editorFreeText',
    ink: 'editorInk',
    stamp: 'editorStamp'
  },

  // === 側邊欄選單與面板 ===
  sidebarMenus: {
    pages: 'thumbnailsViewMenu',
    outlines: 'outlinesViewMenu',
    attachments: 'attachmentsViewMenu',
    layers: 'layersViewMenu'
  },
  sidebarPanels: {
    pages: 'thumbnailsView',
    outlines: 'outlinesView',
    attachments: 'attachmentsView',
    layers: 'layersView'
  },

  // === 搜尋列元素 ===
  findbar: {
    container: 'findbar',
    inputField: 'findInput',
    highlightAll: 'findHighlightAll',
    matchCase: 'findMatchCase',
    matchDiacritics: 'findMatchDiacritics',
    entireWord: 'findEntireWord',
    findMsg: 'findMsg',
    optionsOneContainer: 'findbarOptionsOneContainer',
    optionsTwoContainer: 'findbarOptionsTwoContainer'
  },

  // === 二級選單（工具選單） ===
  secondaryToolbar: {
    container: 'secondaryToolbar',
    presentationMode: 'secondaryPresentationMode',
    openFile: 'secondaryOpenFile',
    viewBookmark: 'viewBookmark',
    firstPage: 'firstPage',
    lastPage: 'lastPage',
    pageRotateCw: 'pageRotateCw',
    pageRotateCcw: 'pageRotateCcw',
    cursorSelectTool: 'cursorSelectTool',
    cursorHandTool: 'cursorHandTool',
    scrollPage: 'scrollPage',
    scrollVertical: 'scrollVertical',
    scrollHorizontal: 'scrollHorizontal',
    scrollWrapped: 'scrollWrapped',
    spreadNone: 'spreadNone',
    spreadOdd: 'spreadOdd',
    spreadEven: 'spreadEven',
    documentProperties: 'documentProperties'
  }
};