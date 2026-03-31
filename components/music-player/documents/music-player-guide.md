# 音樂播放器 Web Component 使用指南

## 📋 目錄

- [概述](#概述)
- [快速開始](#快速開始)
- [HTML 結構](#html-結構)
- [資料傳遞方式](#資料傳遞方式)
- [音樂資料格式](#音樂資料格式)
- [自定義圖示](#自定義圖示)
- [完整範例](#完整範例)
- [常見問題](#常見問題)

---

## 📖 概述

音樂播放器 Web Component 是一個可重用的自訂元素，可以在任何專案中使用。它提供了完整的音樂播放功能，包括播放控制、音量控制、播放模式切換等功能。

### 主要特點

- ✅ **封裝性**：使用 Shadow DOM 隔離樣式和 DOM
- ✅ **可重用性**：可在多個頁面或專案中使用
- ✅ **易於整合**：只需引入檔案並設定資料即可使用
- ✅ **自動初始化**：支援自動初始化或手動初始化
- ✅ **統一音量控制**：使用 Web Audio API 統一控制音量（支援行動裝置）
- ✅ **Portal 彈窗設計**：彈窗與提示層自動掛載於 `body`，確保永遠顯示在最上層且不影響頁面互動
- ✅ **強健觸控操作**：基於 Pointer Events 的拖曳邏輯，完美支援手機端滑動調整進度與音量
- ✅ **鍵盤導覽支持**：支援 `Tab` 切換與 `Enter/Space` 鍵操作，滿足無障礙網頁需求
- ✅ **播放歷史記錄**：自動記錄播放歷史，支援回溯上一首功能

---

## 🚀 快速開始

播放器支援兩種資料載入方式：**動態資料**（PHP 後端處理）和**靜態資料**（JSON 檔案）。請根據專案需求選擇適合的方式。

---

### 方式一：動態資料（API Endpoint）

**適用場景**：音樂資料需要從資料庫動態讀取，或使用 PHP/Smarty 等後端模板引擎。

#### 步驟 1：引入必要檔案

```html
<script src="/web/res/zh_TW/components/music-player/js/music-player-component.js"></script>
```

#### 步驟 2：在 HTML 中加入 Web Component

```html
<music-player 
  data-endpoint="{#$__C#}/process/ps/exeGetMusicData"
  default-volume="0.7"
  default-repeat="true"
  default-shuffle="false"
></music-player>
```

#### 步驟 3：準備 API Endpoint（PHP 後端）

建立一個 API endpoint 返回 JSON 格式的音樂資料。API 回應格式如下：

```json
{
  "state": true,
  "msg": "OK",
  "data": [
    {
      "id": "music1",
      "src": "/path/to/music1.mp3",
      "title": "歌曲名稱 1",
      "image": "/path/to/cover1.jpg",
      "lengthSeconds": 180,
      "isDefault": true
    }
  ]
}
```

PHP 後端範例：

```php
function exeGetMusicData($_this) {
  header('Content-Type: application/json; charset=utf-8');
  
  $return = array(
    'state' => false,
    'msg' => 'Empty',
    'data' => array()
  );
  
  try {
    // 查詢音樂資料
    $DBO = new kDBObj('chantingWorship');
    $musicData = $DBO
      ->select('subject,content')
      ->where("tablename='chantingWorship'")
      ->where("viewA='on'")
      ->order('sortA DESC')
      ->limit('all')
      ->getData('id,prev,subject:title+fileA+fileAtitle+fileB+fileBtitle+note,content:lengthSeconds,viewB,viewC');
    
    foreach ($musicData as $item) {
      if (empty($item['subject']['fileA'])) continue;
      
      $return['data'][] = array(
        'id' => $item['id'],
        'src' => __WEB_UPLOAD . '/' . $item['subject']['fileA'],
        'title' => !empty($item['subject']['fileAtitle']) ? $item['subject']['fileAtitle'] : $item['subject']['title'],
        'image' => !empty($item['subject']['fileB']) ? __WEB_UPLOAD . '/' . $item['subject']['fileB'] : '',
        'lengthSeconds' => $item['content']['lengthSeconds'] ?? 0,
        'isDefault' => (!empty($item['viewC']) && $item['viewC'] === 'on')
      );
    }
    
    $return['state'] = !empty($return['data']);
    $return['msg'] = $return['state'] ? 'OK' : '目前沒有可播放的音樂';
  } catch (Exception $e) {
    $return['msg'] = 'Error: ' . $e->getMessage();
  }
  
  echo json_encode($return, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
```

#### 步驟 4：說明
完成！組件會自動透過 `data-endpoint` 指定的 API 載入音樂資料並初始化播放器。

---

### 方式二：靜態資料（JSON 檔案）

**適用場景**：音樂清單固定，不需要動態更新，純前端專案。

#### 步驟 1：引入必要檔案

```html
<!-- 只需引入核心檔案（必須） -->
<script src="/path/to/music-player-component.js"></script>
```

#### 步驟 2：在 HTML 中加入 Web Component

```html
<music-player></music-player>
```

#### 步驟 3：準備音樂資料（JSON 檔案）

建立 `music-data.json` 檔案並放置於組件 JS 資料夾中（例如：`/web/res/zh_TW/components/music-player/js/music-data.json`）：

```json
[
  {
    "id": "song1",
    "src": "/music/song1.mp3",
    "title": "歌曲名稱 1",
    "image": "/images/cover1.jpg",
    "lengthSeconds": 180,
    "isDefault": true
  }
]
```

#### 步驟 4：載入靜態資料

```html
<script>
  // 等待 Web Component 註冊完成
  customElements.whenDefined('music-player').then(() => {
    // 讀取 JSON 檔案（已調整至組件目錄下）
    fetch('/web/res/zh_TW/components/music-player/js/music-data.json')
      .then(response => response.json())
      .then(data => {
        const player = document.querySelector('music-player');
        player.setMusicData(data);
      })
      .catch(error => {
        console.error('載入音樂資料失敗:', error);
      });
  });
</script>
```

完成！播放器會載入並顯示音樂清單。

---

**重要提醒**：
- `music-player-template.js` 和 `music-player.css` 是獨立檔案，由 component 自動載入
- 這些檔案中的 `className` 請勿隨意修改，否則會影響播放器功能
- 如需調整樣式，請修改 `music-player.css` 檔案，但請保持 `className` 不變

---

## 🏗️ HTML 結構

### 基本結構

```html
<music-player
  data-endpoint="{#$__C#}/process/ps/exeGetMusicData"
  default-volume="0.4"
  default-repeat="true"
  default-shuffle="false"
  custom-icons='{"icon-play": "custom-play.svg"}'
></music-player>
```

### 屬性說明

所有屬性都是可選的，可根據需求選擇設定：

- **`data-endpoint`**：API endpoint 網址，組件會自動透過此 endpoint 載入音樂資料。API 需返回 `{state: true, data: [...]}` 格式的 JSON。
  
  **Endpoint 優先順序**：
  1. HTML 屬性 `data-endpoint`（最高優先）
  2. 全域變數 `window.MUSIC_PLAYER_ENDPOINT`
  
  如果都不設定，組件不會自動載入資料，需手動呼叫 `setMusicData()`。
  
- **`resource-path`**：設定資源路徑前綴（預設自動套用 `/web/res/zh_TW/components/music-player`，通常不需填寫）。
- **`default-volume`**：設定初始音量，數值範圍 0-1（0 為靜音，1 為最大音量），預設值為 0.7
- **`default-repeat`**：設定初始單曲循環模式，布林值（`true` 為開啟，`false` 為關閉），預設值為 `false`
- **`default-shuffle`**：設定初始隨機播放模式，布林值（`true` 為開啟，`false` 為關閉），預設值為 `false`
- **`custom-icons`**：設定自定義圖示，JSON 格式。如果只提供檔名，會自動加上 `resource-path/images/` 前綴。

---

## 📊 資料傳遞方式

播放器支援兩種資料傳遞方式：**動態資料**和**靜態資料**。請根據專案需求選擇適合的方式。

---

### 方式一：動態資料（API Endpoint）

**適用場景**：
- 音樂資料需要從資料庫動態讀取
- 資料需要根據使用者權限或條件過濾
- 使用 PHP/Smarty 等後端模板引擎

**工作原理**：
1. PHP 後端建立 API endpoint，從資料庫取得音樂資料
2. 將資料整理成標準 JSON 格式（包含 `state`, `msg`, `data`）
3. 在 HTML 中設定 `data-endpoint` 屬性指向該 API
4. 組件在掛載時自動透過 Fetch API 載入資料並初始化

**API 回應格式**：
```json
{
  "state": true,
  "msg": "OK",
  "data": [音樂陣列]
}
```

**關於資料載入**：
- 組件會自動透過 endpoint 載入資料（優先順序：HTML 屬性 > 全域變數）
- API 需返回 `state: true` 且 `data` 為音樂陣列才會初始化播放器
- 如果都不設定 endpoint，需手動呼叫 `setMusicData()` 載入資料

**Endpoint 設定方式**：

1. **HTML 屬性（推薦，最明確）**：
   ```html
   <music-player data-endpoint="{#$__C#}/process/ps/exeGetMusicData"></music-player>
   ```

2. **全域變數（跨頁共用）**：
   ```html
   <script>
     window.MUSIC_PLAYER_ENDPOINT = '/api/music/list';
   </script>
   <music-player></music-player>
   ```

---

### 方式二：靜態資料（JSON 檔案）

**適用場景**：
- 音樂清單固定，不需要動態更新
- 不需要後端處理
- 純前端專案

**工作原理**：
1. 將音樂資料寫在 `music-data.json` 檔案中
2. 使用 JavaScript 直接讀取 JSON 檔案
3. 手動呼叫 `setMusicData()` 設定資料

---

## 🎵 音樂資料格式

### 資料結構

每個音樂項目是一個物件，包含以下屬性：

| 屬性 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `id` | string/number | ✅ | 唯一識別碼，用於播放歷史記錄與播放定位 |
| `src` | string | ✅ | 音樂檔案路徑（絕對路徑或相對路徑） |
| `title` | string | ✅ | 音樂標題 |
| `image` | string | ❌ | 封面圖片路徑（可選） |
| `lengthSeconds` | number | ✅ | 音樂時長（秒數），用於顯示音樂清單中的時長 |
| `isDefault` | boolean | ❌ | 是否為預設播放（可選，預設為 `false`） |

### 路徑處理

- **絕對路徑**：以 `/`、`http://`、`https://` 或 `//` 開頭的路徑會直接使用，不會加上任何前綴
- **相對路徑**：其他路徑會自動加上 `resource-path` 屬性設定的前綴（預設為 `/web/res/zh_TW/components/music-player`）

**路徑判斷規則**：
- 以 `/` 開頭 → 絕對路徑（相對於網站根目錄），例如：`/web/upload/music.mp3`
- 以 `http://` 或 `https://` 開頭 → 絕對路徑（完整 URL），例如：`https://example.com/music.mp3`
- 以 `//` 開頭 → 絕對路徑（協議相對 URL），例如：`//cdn.example.com/music.mp3`
- 其他格式 → 相對路徑，會加上 `resource-path`，例如：`audio/song.mp3` → `/web/res/zh_TW/components/music-player/audio/song.mp3`

### 範例

**範例 1：使用絕對路徑（推薦，實際 API 通常返回此格式）**

```json
{
  "id": "buddha-chant",                       // 唯一識別碼
  "src": "/web/upload/music/buddha-chant.mp3", // 絕對路徑（以 / 開頭）
  "title": "誦經音樂",
  "image": "/web/upload/images/buddha-cover.jpg", // 絕對路徑（以 / 開頭）
  "lengthSeconds": 300,                        // 音樂時長（秒）
  "isDefault": true                            // 預設播放
}
```

**範例 2：使用相對路徑**

```json
{
  "id": "song1",                              // 唯一識別碼
  "src": "audio/song.mp3",                    // 相對路徑（會自動加上 resource-path）
  "title": "歌曲名稱",
  "lengthSeconds": 180,                        // 音樂時長（秒）
  "isDefault": false
}
```

**範例 3：使用完整 URL**

```json
{
  "id": "song2",                              // 唯一識別碼
  "src": "https://cdn.example.com/music/song.mp3", // 絕對路徑（完整 URL）
  "title": "外部音樂",
  "image": "https://cdn.example.com/images/cover.jpg",
  "lengthSeconds": 240,
  "isDefault": false
}
```

---

## 🎨 自定義圖示

播放器支援自定義所有圖示，有兩種設定方式。

### 可自定義的圖示列表

以下圖示都可以替換：

- `icon-music` - 音樂圖示（預設封面、清單標題）
- `icon-repeat` - 單曲循環按鈕
- `icon-prev` - 上一首按鈕
- `icon-play` - 播放按鈕
- `icon-pause` - 暫停按鈕
- `icon-next` - 下一首按鈕
- `icon-shuffle` - 隨機播放按鈕
- `icon-volume` - 音量圖示
- `icon-volume-mute` - 靜音圖示

### 方式一：HTML Attribute（推薦）

直接在 `<music-player>` 標籤中設定 `custom-icons` 屬性。

**優點**：
- 簡潔，不需要額外 script
- Component 會自動處理路徑解析
- 如果只提供檔名，會自動加上 `resource-path/images/` 前綴

**範例**：

```html
<music-player
  custom-icons='{"icon-play": "custom-play.svg"}'
></music-player>
```

**多個圖示**：

```html
<music-player
  custom-icons='{
    "icon-play": "custom-play.svg",
    "icon-pause": "custom-pause.svg",
    "icon-music": "custom-music.svg"
  }'
></music-player>
```

**路徑說明**：
- 如果只提供檔名（如 `custom-play.svg`），會自動解析為 `{resource-path}/images/custom-play.svg`
- 如果提供完整路徑（如 `"/images/custom.svg"` 或 `"https://example.com/icon.svg"`），會直接使用
- 支援多種圖片格式：`svg`, `png`, `jpg`, `jpeg`, `gif`, `webp`。若檔名已包含副檔名則直接使用，否則預設補上 `.svg`

### 方式二：JavaScript 設定

使用 `setCustomIcons()` 方法動態設定。

**優點**：
- 可以根據條件動態設定
- 適合需要程式邏輯判斷的場景

**範例**：

```html
<music-player></music-player>

<script>
  const player = document.querySelector('music-player');
  if (player?.setCustomIcons) {
    player.setCustomIcons({
      'icon-play': 'custom-play.svg'
    });
  }
</script>
```

**多個圖示**：

```javascript
player.setCustomIcons({
  'icon-play': 'custom-play.svg',
  'icon-pause': 'custom-pause.svg',
  'icon-music': 'custom-music.svg'
});
```

**注意事項**：
- 使用 JavaScript 設定時，建議加入 `if (player?.setCustomIcons)` 檢查，避免 component 還沒初始化時報錯
- 如果 component 還沒初始化，會靜默跳過，使用預設圖示

---

## 📝 完整範例

### 範例 1：動態資料（API Endpoint）

```html
<!DOCTYPE html>
<html>
<head>
  <title>音樂播放器範例</title>
</head>
<body>
  <!-- Web Component（透過 data-endpoint 載入音樂資料） -->
  <music-player
    data-endpoint="{#$__C#}/process/ps/exeGetMusicData"
    default-volume="0.4"
    default-repeat="true"
    default-shuffle="false"
    custom-icons='{"icon-play": "custom-play.svg"}'
  ></music-player>

  <script src="/web/res/zh_TW/components/music-player/js/music-player-component.js"></script>
</body>
</html>
```

### 範例 2：靜態資料（JSON 檔案）

**適用場景**：音樂清單不需要從資料庫讀取，使用固定的靜態 JSON 檔案即可。

#### 步驟 1：建立 JSON 檔案

建立 `music-data.json`（建議放在 `/web/res/zh_TW/MSITE_3/data/` 目錄下）：
```json
[
  {
    "id": "music1",
    "src": "/path/to/music1.mp3",
    "title": "歌曲名稱 1",
    "image": "/path/to/cover1.jpg",
    "lengthSeconds": 240,
    "isDefault": true
  },
  {
    "id": "music2",
    "src": "/path/to/music2.mp3",
    "title": "歌曲名稱 2",
    "image": "/path/to/cover2.jpg",
    "lengthSeconds": 180,
    "isDefault": false
  }
]
```

#### 步驟 2：選擇載入方式

有兩種方式可以載入 JSON 檔案：

##### 方式 A：透過 JavaScript Fetch（純前端）

```html
<!DOCTYPE html>
<html>
<head>
  <title>音樂播放器範例</title>
</head>
<body>
  <!-- Web Component -->
  <music-player
    default-volume="0.7"
    default-repeat="false"
  ></music-player>

  <!-- 引入檔案 -->
  <script src="/web/res/zh_TW/components/music-player/js/music-player-component.js"></script>

  <script>
    // 等待 Web Component 註冊完成
    customElements.whenDefined('music-player').then(() => {
      // 讀取 JSON 檔案
      fetch('/web/res/zh_TW/MSITE_3/data/music-data.json')
        .then(response => response.json())
        .then(data => {
          const player = document.querySelector('music-player');
          player.setMusicData(data);
        })
        .catch(error => {
          console.error('載入音樂資料失敗:', error);
        });
    });
  </script>
</body>
</html>
```

##### 方式 B：透過 API Endpoint（推薦，可快取）

建立一個 PHP API endpoint 來讀取並返回 JSON 檔案內容：

```php
// 在 process.php 中建立 endpoint
function exeGetMusicData($_this) {
  header('Content-Type: application/json; charset=utf-8');
  
  $jsonPath = __WEB_ROOT . '/web/res/zh_TW/MSITE_3/data/music-data.json';
  $return = array('state' => false, 'msg' => 'Empty', 'data' => array());
  
  if (file_exists($jsonPath)) {
    $jsonContent = file_get_contents($jsonPath);
    $data = json_decode($jsonContent, true);
    if (is_array($data)) {
      $return['state'] = true;
      $return['msg'] = 'OK';
      $return['data'] = $data;
    }
  }
  
  echo json_encode($return, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
```

```html
<!-- 在模板中使用 -->
<music-player
  data-endpoint="{#$__C#}/process/ps/exeGetMusicData"
  default-volume="0.7"
  default-repeat="false"
></music-player>

<script src="/web/res/zh_TW/components/music-player/js/music-player-component.js"></script>
```

**兩種方式比較**：

| 方式 | 優點 | 缺點 | 適用場景 |
|------|------|------|----------|
| **方式 A (Fetch)** | 純前端，不依賴後端 | 需要額外的 HTTP 請求，可能有 CORS 問題 | 靜態網站、SPA |
| **方式 B (API Endpoint)** | 可快取、無 CORS 問題、與現有架構一致 | 需要後端支援 | PHP 專案（推薦） |

### 範例 3：使用 JavaScript 設定自定義圖示

```html
<!DOCTYPE html>
<html>
<head>
  <title>音樂播放器範例</title>
</head>
<body>
  <!-- Web Component -->
  <music-player></music-player>

  <!-- 引入核心檔案 -->
  <script src="/web/res/zh_TW/components/music-player/js/music-player-component.js"></script>

  <!-- 設定自定義圖示 -->
  <script>
    const player = document.querySelector('music-player');
    if (player?.setCustomIcons) {
      player.setCustomIcons({
        'icon-play': 'custom-play.svg',
        'icon-pause': 'custom-pause.svg',
        'icon-music': 'custom-music.svg'
      });
    }
  </script>
</body>
</html>
```

### 範例 4：動態控制播放器

此範例展示如何使用 JavaScript 動態控制播放器。**動態控制的用途**包括：

- **自訂控制介面**：在播放器外部建立自訂的控制按鈕或介面
- **整合其他功能**：將播放器控制整合到現有的頁面功能中（如導覽列、側邊欄等）
- **響應式控制**：根據頁面狀態或使用者行為動態調整播放器
- **狀態監控**：即時取得播放狀態並顯示在頁面其他地方
- **進階操作**：實作播放器本身沒提供的特殊功能

**可用的操作方法**：

| 方法 | 說明 | 參數 |
|------|------|------|
| `play(index)` | 播放音樂 | `index` (可選)：音樂索引，不提供則播放當前或第一首 |
| `pause()` | 暫停播放 | 無 |
| `resume()` | 繼續播放 | 無 |
| `next()` | 播放下一首 | 無 |
| `previous()` | 播放上一首 | 無 |
| `setVolume(volume)` | 設定音量 | `volume`：0-1 之間的數值 |
| `getCurrentMusic()` | 取得當前播放的音樂 | 無，返回音樂物件或 `null` |
| `getState()` | 取得播放狀態 | 無，返回包含播放狀態的物件 |
| `setMusicData(dataArray)` | 更新音樂清單 | `dataArray`：音樂資料陣列 |
| `setCustomIcons(iconsObject)` | 動態更新圖示 | `iconsObject`：圖示物件 |

**使用方式**：

如需在外部控制播放器，可透過 JavaScript 取得組件實例並呼叫上述方法：

```javascript
// 取得播放器實例
const player = document.querySelector('music-player');

// 等待組件初始化完成
customElements.whenDefined('music-player').then(() => {
  // 播放控制
  player.play();           // 播放
  player.pause();          // 暫停
  player.next();           // 下一首
  
  // 取得狀態
  const state = player.getState();
  console.log('播放狀態:', state.isPlaying);
  
  // 取得當前音樂
  const currentMusic = player.getCurrentMusic();
  console.log('當前播放:', currentMusic?.title);
});
```

---

## ❓ 常見問題

### Q1：播放器沒有顯示？

**A**：請確認：
1. 已正確引入 `music-player-component.js`
2. HTML 中有 `<music-player>` 元素
3. 瀏覽器支援 Web Components（現代瀏覽器都支援）

---

### Q2：音樂清單沒有載入？

**A**：請確認：
1. 如果使用 `data-endpoint`，確認 API endpoint 網址正確且可正常存取
2. API 回應格式正確（需包含 `state: true` 和 `data` 陣列）
3. 如果使用靜態資料，已正確載入 JSON 檔案並呼叫 `setMusicData()`
4. JSON 資料格式正確（包含必填欄位：`id`, `src`, `title`）
5. 音樂資料陣列不為空
6. 檢查瀏覽器控制台是否有錯誤訊息

---

### Q3：音樂無法播放？

**A**：請確認：
1. 音樂檔案路徑正確
2. 音樂檔案格式支援（MP3、WAV、OGG 等）
3. 瀏覽器支援該音訊格式
4. 伺服器允許跨域存取（如果音樂檔案在不同網域）

---

### Q4：行動裝置無法調整音量？

**A**：播放器已統一使用 Web Audio API 控制音量，所有裝置（包括行動裝置）都可以使用音量進度條調整音量。如果無法調整，請確認：
1. 瀏覽器支援 Web Audio API
2. 已進行用戶互動（點擊過頁面）
3. 檢查瀏覽器控制台是否有錯誤訊息

---

### Q4-1：彈窗為什麼不會被頁面其他元件擋住？

**A**：組件採用 Portal 模式。雖然播放器邏輯封裝在 Shadow DOM 中，但彈窗會動態掛載到 `document.body` 最底層，並透過全局樣式注入極高的 `z-index`，確保永遠顯示在最上層。

---

### Q4-2：手機上拖曳進度條不順暢？

**A**：組件採用了 Pointer Capture 技術，並禁用了瀏覽器預設手勢（`touch-action: none`）。若仍不順暢，請檢查是否有其他全螢幕覆蓋層攔截了事件。

---

### Q4-3：如何使用鍵盤操作播放器？

**A**：播放器支援完整的鍵盤導覽：
1. 使用 `Tab` 鍵在按鈕間切換焦點
2. 當焦點停在按鈕上時，按 `Enter` 或 `空白鍵` 即可觸發該按鈕功能
3. 彈窗出現時會自動聚焦到「是」按鈕，方便鍵盤操作

---

### Q5：如何自訂樣式？

**A**：播放器的樣式已拆分成獨立檔案 `music-player.css`，可以直接修改該檔案來調整樣式。

**重要提醒**：
- 可以修改 CSS 樣式（顏色、大小、間距等）
- **請勿修改 `className`**，這些 class 名稱用於 JavaScript 功能綁定，修改後會導致功能異常
- 如需調整樣式，請直接編輯 `music-player.css` 檔案

---

### Q6：可以在同一個頁面使用多個播放器嗎？

**A**：可以，但需要注意：
1. 每個播放器需要獨立的 `<music-player>` 元素
2. 每個播放器需要獨立的音樂資料
3. 建議使用不同的選擇器來區分不同的播放器實例

**範例**：
```html
<music-player id="player1"></music-player>
<music-player id="player2"></music-player>

<script>
  const player1 = document.getElementById('player1');
  const player2 = document.getElementById('player2');

  player1.setMusicData([...]);
  player2.setMusicData([...]);
</script>
```

---

### Q7：如何處理動態載入的音樂資料？

**A**：可以在任何時候呼叫 `setMusicData()` 方法來更新音樂清單：

```javascript
// 從 API 取得音樂資料
fetch('/api/music-list')
  .then(response => response.json())
  .then(data => {
    const player = document.querySelector('music-player');
    player.setMusicData(data);
  });
```

---

### Q8：播放歷史功能如何運作？

**A**：播放器會自動記錄播放過的音樂 ID 序列，並儲存在 `sessionStorage` 中。當您點擊「上一首」時，系統會從歷史紀錄中回溯，而非單純循環播放。歷史紀錄在同一個瀏覽器分頁會話中有效，關閉分頁後會清除。

---

## 📚 相關檔案

- `music-player-component.js` - Web Component 核心檔案
- `music-player-template.js` - HTML 模板檔案（自動載入）
- `music-player.css` - 樣式檔案（自動載入）
- `音樂播放器流程邏輯說明.md` - 詳細的技術說明文件

---
