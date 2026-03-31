# PDF Viewer Web Component 使用手冊

## 目錄

- [基本用法](#基本用法)
- [資料提供方式](#資料提供方式)
- [調整內部樣式](#調整內部樣式)
- [顏色模式設定](#顏色模式設定)
- [手動操控開關](#手動操控開關)
- [注意事項](#注意事項)

---

## 基本用法

### 1. 在 HTML 中放入元件

```html
<pdf-viewer pdf-url="/path/to/your/file.pdf"></pdf-viewer>
```

或使用 `src` 屬性：

```html
<pdf-viewer src="/path/to/your/file.pdf"></pdf-viewer>
```

### 2. 載入元件腳本

```html
<script type="module" src="[你的專案路徑]/pdf-viewer/js/pdf-viewer-component.js"></script>
```

**注意**：請將 `[你的專案路徑]` 替換為實際的元件安裝路徑。

---

## 資料提供方式

本元件支援兩種 PDF 資料提供方式：**靜態引用**與**動態引用**。開發時需根據需求選擇合適的方式。

### 靜態引用（Static Reference）

直接在模板中寫死 PDF 檔案路徑，適合固定不變的 PDF 檔案（說明文件、使用手冊等）。

```html
<!-- 方式 1：使用完整 URL -->
<pdf-viewer pdf-url="https://example.com/document.pdf"></pdf-viewer>

<!-- 方式 2：使用絕對路徑（從網站根目錄開始） -->
<pdf-viewer pdf-url="/path/to/your/document.pdf"></pdf-viewer>

<!-- 方式 3：使用相對路徑（相對於當前頁面） -->
<pdf-viewer pdf-url="../documents/manual.pdf"></pdf-viewer>
```

---

### 動態引用（Dynamic Reference）

從後端傳入的變數取得 PDF 路徑，適合需要動態載入的 PDF 檔案。

```html
<!-- 使用 Smarty 變數 -->
<pdf-viewer pdf-url="{#$pdfUrl#}"></pdf-viewer>
```

**注意事項：**
- 模板變數名稱統一使用 `$pdfUrl`（camelCase）
- 確保後端傳入的值為完整的 PDF URL 路徑
- 若 PDF 無法載入，檢查變數名稱是否正確且值是否為有效路徑

---

## 調整內部樣式

### 常見樣式調整

編輯 `pdf-viewer/css/pdf-viewer-inner.css`：

- **工具列高度**：調整 `:root` 中的 `--toolbar-height` CSS 變數
- **背景圖片（Pattern）**：修改 `.patternContainer` 的 `background-image`
- **顏色模式 UI**：調整 `html[data-color-mode="light"]` / `html[data-color-mode="dark"]` 下的樣式

### 自訂 CSS 檔案名稱

預設使用 `pdf-viewer-inner.css`，若需要改用其他名稱，修改 `pdf-viewer-component.js` 中 `_injectInnerCss()` 的 `link.href`：

```javascript
_injectInnerCss() {
  const iframeDoc = this._getIframeDoc();
  if (!iframeDoc) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${this._getBasePath()}/css/your-custom-name.css`; // ← 修改這裡
  iframeDoc.head.appendChild(link);
}
```

同時將 `pdf-viewer/css/` 目錄下的 CSS 檔案名稱一併改為相同名稱即可。

### Pattern 背景圖片

Pattern 背景預設為**啟用**狀態。

#### 停用 Pattern 背景

開啟 `pdf-viewer-component.js`，找到 `loadPdf()` 中的 iframe `load` 事件，將 `_injectPatternClass()` 那行**註解掉或移除**：

```javascript
this.$iframe.addEventListener('load', () => {
  this._injectInnerCss();
  // this._injectPatternClass(); // ← 註解此行即可停用 pattern 背景
  this._applyColorMode();
  this._applyAllToggles();
}, { once: true });
```

#### 自訂 Pattern 圖片

1. 將圖片放入元件的 `images` 目錄：
   ```
   pdf-viewer/images/your-pattern.jpg
   ```

2. 修改 `pdf-viewer/css/pdf-viewer-inner.css` 中的路徑：
   ```css
   .patternContainer {
     background-image: url(../images/your-pattern.jpg);
   }
   ```

---

## 顏色模式設定

PDF Viewer 支援三種顏色模式，可強制控制 UI 的視覺主題，不受瀏覽器預設主題影響。

### 模式選項

- **`light`**：強制使用亮色主題
- **`dark`**：強制使用暗色主題
- **`custom`**：使用瀏覽器/系統的原生顏色（不強制覆蓋）

### 設定方式

#### 方式 1：在 JavaScript 設定檔中設定預設值

編輯 `pdf-viewer/js/pdf-viewer-config.js` 中的 `CONFIG.colorMode`：

```javascript
export const CONFIG = {
  colorMode: 'custom', // 可選：'light' | 'dark' | 'custom'
  // ... 其他設定
};
```

此設定會作為**預設值**，當元件標籤沒有指定 `color-mode` 屬性時使用。

#### 方式 2：在元件標籤中直接指定

在 HTML 模板中使用 `color-mode` 屬性：

```html
<!-- 強制使用亮色主題 -->
<pdf-viewer pdf-url="{#$pdfUrl#}" color-mode="light"></pdf-viewer>

<!-- 強制使用暗色主題 -->
<pdf-viewer pdf-url="{#$pdfUrl#}" color-mode="dark"></pdf-viewer>

<!-- 使用瀏覽器原生顏色（不強制） -->
<pdf-viewer pdf-url="{#$pdfUrl#}" color-mode="custom"></pdf-viewer>
```

### 優先順序

1. **元件標籤的 `color-mode` 屬性**（最高優先）
2. **`CONFIG.colorMode` 設定值**
3. **預設值 `custom`**

### 自訂顏色樣式

如需調整各模式的 UI 顏色，請編輯：

```
pdf-viewer/css/pdf-viewer-inner.css
```

針對 `html[data-color-mode="light"]` 和 `html[data-color-mode="dark"]` 分別設定不同的背景色、工具列顏色等。

---

## 手動操控開關

所有 UI 功能開關都集中在 `pdf-viewer/js/pdf-viewer-config.js` 的 `CONFIG.features` 物件中。

### 設計原則：黑名單模式（只列出要關閉的項目）

`CONFIG.features` 採用**黑名單設計**：

- **未列出的項目，預設為開啟（顯示）**
- **只需列出要關閉的項目並設為 `false`**

---

### 可用項目總覽

以下列出所有可控制的 UI 項目。開發者依需求加入 `CONFIG.features` 並設為 `false` 即可隱藏該項目。

#### 主工具列（`toolbar`）

| 項目 key | 說明 |
|---|---|
| `previous` | 上一頁按鈕 |
| `next` | 下一頁按鈕 |
| `zoomOut` | 縮小按鈕 |
| `zoomIn` | 放大按鈕 |
| `scaleSelect` | 縮放比例選單 |
| `print` | 列印按鈕 |
| `save` | 儲存按鈕（下載 PDF） |
| `findButton` | 搜尋按鈕（放大鏡圖示） |

#### 編輯工具列（`editorTools`）

| 項目 key | 說明 |
|---|---|
| `highlight` | 強調工具（螢光筆） |
| `freeText` | 文字工具 |
| `ink` | 繪圖工具 |
| `stamp` | 新增或編輯圖片工具 |

#### 側邊欄（`sidebar`）

| 項目 key | 說明 |
|---|---|
| `pages` | 頁面縮圖選單 |
| `outlines` | 文件大綱選單（書籤目錄） |
| `attachments` | 附件選單 |
| `layers` | 圖層選單 |

#### 搜尋列（`findbar`）

| 項目 key | 說明 |
|---|---|
| `matchCase` | 區分大小寫 |
| `matchDiacritics` | 符合變音符號 |
| `entireWord` | 符合整個字 |
| `highlightAll` | 強調全部 |

#### 二級選單 / 工具選單（`secondaryMenu`）

| 項目 key | 說明 |
|---|---|
| `openFile` | 開啟檔案 |
| `presentationMode` | 簡報模式 |
| `viewBookmark` | 目前頁面 |
| `firstPage` | 跳到第一頁 |
| `lastPage` | 跳到最後一頁 |
| `pageRotateCw` | 順時針旋轉 |
| `pageRotateCcw` | 逆時針旋轉 |
| `cursorSelectTool` | 文字選擇工具 |
| `cursorHandTool` | 頁面移動工具 |
| `scrollPage` | 單頁捲動 |
| `scrollVertical` | 垂直捲動 |
| `scrollHorizontal` | 水平捲動 |
| `scrollWrapped` | 多頁捲動 |
| `spreadNone` | 不跨頁 |
| `spreadOdd` | 奇數跨頁 |
| `spreadEven` | 偶數跨頁 |
| `documentProperties` | 文件屬性 |

---

### 使用範例: `pdf-viewer/js/pdf-viewer-config.js` 的 `CONFIG.features` 物件

```javascript
export const CONFIG = {
  features: {
    editorTools: {
      highlight: false,        // 強調工具（螢光筆）
      freeText: false,         // 文字工具
      ink: false,              // 繪圖工具
      stamp: false             // 新增或編輯圖片工具
    },
    findbar: {
      matchCase: false,        // 區分大小寫
      matchDiacritics: false,  // 符合變音符號
      entireWord: false,       // 符合整個字
      highlightAll: false      // 強調全部
    }
  }
}

```

---

## 注意事項

- **不要直接修改 vendor 目錄下的原始檔案**（`viewer.css`、`viewer.html` 等）
- **不要直接修改 `pdf-viewer-config.js` 中的 `ELEMENT_IDS`**，除非 PDF.js 版本升級導致 ID 變更
- **不要移除重試機制或 Observer**，因為 PDF.js 的 DOM 是動態載入的

### 🔧 除錯技巧

- 若 UI 開關沒有生效，檢查：
  1. iframe 是否已完全載入
  2. `pdf-viewer-config.js` 中 `CONFIG.features` 的設定是否正確
  3. PDF.js 版本是否與 `pdf-viewer-config.js` 中 `ELEMENT_IDS` 對應的 ID 一致
  4. 瀏覽器 Console 是否有錯誤訊息

---