# youtube-modal 元件技術說明

本文說明 youtube-modal Web Component 的專案架構、生命週期、引用流程，以及各函式之間的牽套關係。

**靜態資料**：改用 JSON 不透過 API 時，請見 [guide.md 靜態資料引用方式](guide.md#靜態資料引用方式)。

---

## 項目 1：專案架構與職責說明

### 目錄結構

```
youtube-modal/
├── src/
│   ├── index.js              # 元件主體（唯一對外入口）
│   ├── config.js             # 設定與常數（CONFIG、PLAYER_VARS、VALID_PLAYER_TYPES）
│   ├── controller/           # 控制層：資料、狀態、顯示、流程協調
│   │   ├── index.js          # Controller：協調 DataManager / StateMachine / Visibility
│   │   ├── data-manager.js   # 資料來源（API 或靜態 JSON）與 resolve(videoId)
│   │   ├── state-machine.js  # 狀態機：idle / loading / loaded / error，事件訂閱
│   │   └── visibility.js    # 彈窗開關（modal class、body overflow）
│   ├── ui/                   # 視圖層：殼、影片區、相關區、UIRenderer
│   │   ├── index.js          # UIRenderer：依狀態呼叫 showLoading / showVideo / showError / clear
│   │   ├── modal-shell.js    # 殼 TEMPLATE、initShellElements、loadStyles
│   │   ├── video-view.js     # 影片區 TEMPLATE、initVideoViewElements、renderContent、renderBodyVisibility、loadStyles
│   │   ├── related-view.js   # 相關區 TEMPLATE、initRelatedViewElements、renderRelatedVideos、loadStyles
│   │   └── styles/
│   │       ├── modal-shell.css
│   │       ├── video-view.css
│   │       └── related-view.css
│   ├── players/              # 三種播放器實作（由 players/index 依 playerType 建立）
│   │   ├── index.js          # createPlayer、loadPlayerAssets（lite-youtube 腳本/CSS）
│   │   ├── iframe-player.js
│   │   ├── lite-youtube-player.js
│   │   └── youtube-iframe-api-player.js
│   ├── utils/
│   │   ├── helpers.js        # escapeHtml、getBooleanAttribute、clearModalContent、validateVideoData
│   │   ├── css-loader.js     # loadCss、loadCssBundle（供各 view loadStyles 使用）
│   │   └── path-resolver.js  # （若專案有使用路徑解析可在此）
│   ├── data/
│   │   └── video-details.json
│   └── assets/
│       └── images/
│           └── default-cover.jpg
├── documents/
│   ├── details.md
│   └── guide.md
└── css/
    └── custom.css
```

### 各層職責與連結關係

| 層級         | 檔案／資料夾                           | 職責                                                                                            | 被誰引用                                                  |
| ------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **元件入口** | `src/index.js`                         | 自訂元素與生命週期、對外 API（開啟／關閉／是否開啟）；協調資源載入並建立 Controller、UIRenderer | 頁面透過 `<script type="module" src=".../index.js">` 載入 |
| **設定**     | `config.js`                            | 集中設定：播放器類型、顯示開關、播放參數等常數                                                  | index.js、各 player                                       |
| **控制層**   | `controller/index.js`                  | 協調資料／狀態／顯示；提供開啟、關閉、是否開啟；所有開啟皆經 DataManager 取資料                 | 僅 index.js                                               |
| **控制層**   | `controller/data-manager.js`           | 設定資料來源（API 或靜態）、載入靜態 JSON、依影片 ID 解析並回傳影片與相關列表                   | Controller                                                |
| **控制層**   | `controller/state-machine.js`          | 管理狀態流轉（閒置→載入中→已載入／錯誤）與事件通知，供 UIRenderer 訂閱                          | Controller                                                |
| **控制層**   | `controller/visibility.js`             | 控制彈窗顯示與 body 捲動鎖定（開／關／是否開啟）                                                | Controller                                                |
| **視圖層**   | `ui/index.js` (UIRenderer)             | 掛載 UI、依狀態顯示載入／影片／錯誤、綁定關閉與相關影片點擊、提供 modal 節點                    | index.js                                                  |
| **視圖層**   | `ui/modal-shell.js`                    | 殼層 HTML、取得殼節點、載入殼層樣式                                                             | ui/index.js                                               |
| **視圖層**   | `ui/video-view.js`                     | 影片區 HTML、取得影片區節點、渲染標題與描述、控制 body 顯示                                     | ui/index.js                                               |
| **視圖層**   | `ui/related-view.js`                   | 相關區 HTML、取得相關區節點、渲染相關影片列表                                                   | ui/index.js                                               |
| **工具**     | `utils/helpers.js`                     | HTML 跳脫、布林屬性解析、清空彈窗內容、影片資料驗證                                             | index.js、DataManager、UIRenderer、related-view           |
| **工具**     | `utils/css-loader.js`                  | 載入單一或整包 CSS、快取與避免快取                                                              | ui/modal-shell、ui/video-view、ui/related-view            |
| **播放器**   | `players/index.js`                     | 依類型建立播放器實例                                                                            | ui/index.js                                               |
| **播放器**   | `players/iframe-player.js`             | 建立一般 YouTube 內嵌 iframe                                                                    | players/index.js                                          |
| **播放器**   | `players/lite-youtube-player.js`       | 載入 lite-youtube、建立 lite-youtube 元素                                                       | players/index.js                                          |
| **播放器**   | `players/youtube-iframe-api-player.js` | 載入 YouTube IFrame API、建立 YT.Player                                                         | players/index.js                                          |

### 引用鏈簡圖

```
頁面 (例如 video.html)
  └── <script type="module" src=".../youtube-modal/src/index.js">

index.js
  ├── config.js                 → CONFIG, VALID_PLAYER_TYPES
  ├── controller/index.js       → Controller
  ├── controller/data-manager.js → DataManager
  ├── controller/state-machine.js → StateMachine
  ├── controller/visibility.js  → Visibility
  ├── ui/modal-shell.js         → TEMPLATE, initShellElements, loadStyles
  ├── ui/index.js              → UIRenderer
  ├── ui/video-view.js         → TEMPLATE, initVideoViewElements, loadStyles
  ├── ui/related-view.js       → TEMPLATE, initRelatedViewElements, loadStyles
  ├── players/index.js         → loadPlayerAssets, createPlayer（間接，由 UIRenderer 呼叫）
  └── utils/helpers.js         → getBooleanAttribute

Controller
  ├── data-manager.js   → resolve(videoId)
  ├── state-machine.js  → transitionTo, reset
  └── visibility.js     → open, close, isOpen

UIRenderer (ui/index.js)
  ├── video-view.js     → renderContent, renderBodyVisibility
  ├── related-view.js   → renderRelatedVideos
  ├── utils/helpers.js  → clearModalContent
  └── players/index.js  → createPlayer
```

### 為何如此拆分？

- **index.js**：只負責「何時載入資源、何時組 DOM/elements、何時建立 Controller / UIRenderer、何時訂閱狀態與綁事件」，不處理「資料怎麼取、狀態怎麼轉、畫面怎麼畫」。
- **controller/**：**資料（DataManager）、狀態（StateMachine）、顯示開關（Visibility）** 與 **流程協調（Controller）** 分離；Controller 只做「開關彈窗 → 要資料 → 轉狀態」，不碰 DOM。
- **ui/**：**殼（modal-shell）** 與 **影片區（video-view）、相關區（related-view）** 分開，各負責自己的 TEMPLATE、init\*Elements、loadStyles；**UIRenderer** 依狀態機事件決定呼叫 showLoading / showVideo / showError / clear，再委派給 video-view、related-view 與 players。
- **config.js**：可調參數集中一處，改行為（如 PLAYER_TYPE、SHOW_TITLE）不必翻邏輯檔。
- **utils/helpers.js**：屬性解析、清空內容、資料驗證、escape 可被多處共用，且不依賴元件內部狀態。
- **players/**：三種播放方式各自獨立，由 `players/index.js` 的 `createPlayer(playerType)` 選擇；**載入時機**：lite-youtube 在 index.js 的 connectedCallback 透過 `loadPlayerAssets` 預先載入腳本與 CSS，其餘在 UIRenderer 建立播放器時才用到。

### 補充：公開 API 命名與用途

- **open(videoId)**：依影片 ID 開啟彈窗，資料一律由 DataManager 依 source（api / static）從 API 或靜態 JSON 取得並驗證。
- **close()**：執行關閉；**isOpen()**：查詢彈窗是否開啟。

### 補充：API／靜態資料格式中的 related?

- **?** 表示選用欄位：回傳物件可能有 `related`，也可能沒有；後端未回傳相關影片時，程式依「有無 list／length」處理，不假定 related 一定存在。

---

## 項目 2：生命週期與引用流程

### 生命週期概觀

1. **元素被建立** → `constructor` 執行 → `super()`、`attachShadow({ mode: 'open' })`；私有欄位 `#controller`、`#uiRenderer`、`#initialized` 設定。
2. **元素被加入 DOM** → `connectedCallback` 執行（async）：
   - 讀取 attribute（endpoint、source、player-type、showRelated、showTitle、showDescription、data-url）
   - UIRenderer.mount：並行載入 loadPlayerAssets、殼／影片區／相關區 loadStyles（透過 css-loader），寫入 Shadow DOM，注入 VideoView / RelatedView TEMPLATE，組裝 elements
   - new Controller({ source, endpoint, dataUrl, uiRenderer })；await controller.init()：DataManager.configure、若 source 為 static 則 loadStaticData(dataUrl)、Visibility.init、訂閱 stateMachine → UIRenderer、bindInteractions、document keydown（ESC）
   - #initialized = true
3. **元素自 DOM 移除** → `disconnectedCallback` 執行，呼叫 `#controller?.destroy()`（移除 keydown 監聽）。

之後的使用都是「呼叫公開 API」：`open(videoId)`、`close()`、`isOpen()`。

### 帶 ID 打開彈窗的完整流程（概述）

1. 頁面或列表點擊某影片 → 呼叫 `modal.open(videoId)`。
2. **Controller.open(videoId)**：
   - Visibility.open()（modal 加 active、鎖 body）
   - StateMachine.transitionTo('loading')
   - 訂閱端收到 loading → **UIRenderer.showLoading()**（清空、標題「載入中...」）
   - DataManager.resolve(videoId) → 依 source 打 API 或從靜態資料取 `{ video, related? }`
3. 成功 → Controller 呼叫 StateMachine.transitionTo('loaded', data) → 訂閱端 **UIRenderer.showVideo(data)**：
  - renderContent（標題、描述）、createPlayer 並 init、renderRelatedVideos、renderBodyVisibility
4. 失敗 → Controller 呼叫 StateMachine.transitionTo('error', error) → **UIRenderer.showError(error)**（清空、標題「載入失敗...」）
5. 使用者關閉彈窗（按鈕、背景、ESC）→ **Controller.close()** → Visibility.close()、StateMachine.reset() → 訂閱端 **UIRenderer.destroyCurrentPlayer()**（銷毀播放器，但不清 DOM；畫面內容會在下次 `loading` 的 `showLoading()` 時再更新/清理）。

### 初始化時觸發的函式（connectedCallback 內）

| 順序 | 觸發項目                              | 說明                                                                                                                                                                 |
| ---- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | 讀取 attribute                        | endpoint、source、player-type、showRelated、showTitle、showDescription、data-url（static 時）                                                                        |
| 2    | UIRenderer.mount(shadowRoot, options) | loadPlayerAssets、ModalShell/VideoView/RelatedView.loadStyles（css-loader）、寫入 Shadow DOM、組裝 elements                                                          |
| 3    | new Controller、controller.init()     | DataManager.configure；source===static 時 loadStaticData(dataUrl)；Visibility.init(modalEl)；stateMachine 訂閱 → UIRenderer；bindInteractions；document keydown(ESC) |
| 4    | #initialized = true                   | 之後 open/close/isOpen 才不會提早 return                                                                                                                             |

---

## 項目 3：流程之函式細節與牽套

### 3.1 建構與狀態（index.js）

- **constructor**：super()、attachShadow({ mode: 'open' })；建立 Shadow DOM，後續 HTML/CSS 都在此樹內。
- **#controller、#uiRenderer**：在 connectedCallback 建立，供公開 API（open、close、isOpen）使用。ESC 關閉由 Controller 內 #keydownHandler 處理，disconnectedCallback 呼叫 controller.destroy() 卸除。

### 3.2 生命週期

- **connectedCallback**
  - 讀取 attribute：endpoint、source（有 endpoint 預設 api）、player-type（與 VALID_PLAYER_TYPES、CONFIG.PLAYER_TYPE 比對，內聯於 index.js）、getBooleanAttribute 得 showRelated、showTitle、showDescription；source===static 時讀 data-url（無 fallback）。
  - UIRenderer.mount：Promise.all 載入 loadPlayerAssets、ModalShell/VideoView/RelatedView.loadStyles（透過 utils/css-loader），寫入 Shadow DOM，initShellElements → 注入兩區 TEMPLATE → initVideoViewElements/initRelatedViewElements → 合併為 elements。
  - new Controller({ source, endpoint, dataUrl, uiRenderer })；await controller.init()：DataManager.configure、static 時 loadStaticData(dataUrl)、Visibility.init、stateMachine 訂閱 UIRenderer、bindInteractions、document keydown；#initialized = true。

- **disconnectedCallback**
  - 呼叫 #controller?.destroy()，卸除 document keydown 監聽。

### 3.3 Controller 與 DataManager / StateMachine / Visibility 的牽套

- **Controller.open(videoId)**
  - 依賴 Visibility（open）、StateMachine（transitionTo('loading') → 訂閱端 showLoading；resolve 成功 transitionTo('loaded', data)，失敗 transitionTo('error', error)）、DataManager（resolve(videoId)）。
  - 不直接碰 DOM，只協調「開關 + 狀態 + 資料」。

- **Controller.close()**
  - Visibility.close()、StateMachine.reset()；訂閱端收到 idle → UIRenderer.destroyCurrentPlayer()（不清 DOM，由下一次 showLoading 處理）。

- **Controller.isOpen()**
  - 委派給 Visibility.isOpen()。

- **DataManager**
  - configure({ source, endpoint })；loadStaticData(url) 僅在 source === 'static' 時由 Controller.init 呼叫（dataUrl 來自元件 data-url 屬性，無預設路徑）；resolve(videoId) 依 source 呼叫 #fromAPI 或 #fromStatic，回傳 { video, related? }；#fromAPI / #fromStatic 會用 validateVideoData 驗證格式。

- **StateMachine**
  - 合法轉換：idle → loading；loading → loaded | error；loaded | error → loading | idle。transitionTo(state, payload) 會 #emit(state, payload)；reset() 回到 idle 並 emit('idle')。index.js 訂閱 loading / loaded / error / idle，驅動 UIRenderer。

- **Visibility**
  - init(modalEl)；open() 加 class、鎖 body；close() 移除 class、還原 body；isOpen() 查 modal 是否有 active class。

### 3.4 UIRenderer 與 video-view、related-view、players、helpers 的牽套

- **UIRenderer.showLoading()**
  - #destroyCurrentPlayer()；clearModalContent(elements)；title 設為「載入中...」。依賴 utils/helpers 的 clearModalContent。

- **UIRenderer.showVideo(data)**
  - #destroyCurrentPlayer()；renderContent(elements, video, { showTitle, showDescription })（video-view）；createPlayer(playerType).init(iframeContainer, youtubeId, title)；renderRelatedVideos({ ...elements, list, defaultCover, showRelated })（related-view）；renderBodyVisibility(elements)（video-view）。依賴 video-view、related-view、players/index（createPlayer）、options（playerType、showTitle、showDescription、showRelated、defaultCover）。

- **UIRenderer.showError(error)**
  - #destroyCurrentPlayer()；clearModalContent；title 設為「載入失敗，請稍後再試」。

- **UIRenderer.clear()**
  - #destroyCurrentPlayer()；clearModalContent。

- **video-view.js**
  - renderContent：只改 elements 的 title、description 的 textContent 與 display。
  - renderBodyVisibility：依 relatedSection 的顯示與否設定 relatedViewSlot 的 display。

- **related-view.js**
  - renderRelatedVideos：使用 relatedSection、relatedContainer、relatedItemTemplate；list 無或 showRelated 為 false 時隱藏 relatedSection；有資料時 clone template、填封面與標題（escapeHtml 防 XSS）、append 到 relatedContainer。

- **players**
  - createPlayer(playerType) 回傳 IframePlayer / LiteYoutubePlayer / YoutubeIframeApiPlayer 實例；UIRenderer 呼叫 player.init(container, youtubeId, title)，關閉或切換時 UIRenderer.#destroyCurrentPlayer() 呼叫 player.destroy()。

### 3.5 資料流與影響關係整理

- **初始化一次**：connectedCallback → 載入資源 → 寫入 Shadow DOM → 組裝 elements → DataManager / StateMachine / Visibility / Controller / UIRenderer 建立 → 訂閱狀態機 → #initEventListeners → #initialized = true。之後「開彈窗」只會透過 open(videoId) 進入 Controller，再經 DataManager.resolve 與狀態機驅動 UIRenderer。

- **每次開啟彈窗（open(videoId)）**：
  - Controller.open → Visibility.open、StateMachine → loading → UIRenderer.showLoading（清空、載入中）→ DataManager.resolve(videoId) → 成功：StateMachine → loaded → UIRenderer.showVideo(data)；失敗：StateMachine → error → UIRenderer.showError。
  - showVideo 依同一份 data 與 options 更新標題／描述、建立播放器、填相關影片、決定 body 顯示；modules 不直接改 component 狀態，只改傳入的 elements（DOM）。

 - **關閉彈窗**：Controller.close → Visibility.close、StateMachine.reset → idle → UIRenderer.destroyCurrentPlayer（銷毀播放器、不清 DOM）；下次開啟會重新執行 showLoading（清空 DOM）/ showVideo（渲染新內容），不會殘留上一支播放器。

以上即為 youtube-modal 新版的架構、生命週期、引用流程，以及各函式之間的牽套與影響說明。
