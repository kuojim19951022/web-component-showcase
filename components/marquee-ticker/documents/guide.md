# Marquee Ticker 使用指南

---

## 1) 基本引用方式

在頁面中放入元件與 JS：

```html
<marquee-ticker
  data-source='[{"marqueeText":"最新公告","marqueeLink":"#"}]'
></marquee-ticker>

<script
  type="module"
  src="你的路徑/marquee-ticker/js/marquee-ticker-component.js"
></script>
```

### `data-source` vs `data-url`（何時用哪個？）

- **`data-source`（JSON 字串）**：適合「後端/外部已經算好資料」，直接注入即可（**優先級最高**）。
  - 例如 PHP 模板把資料 `json_encode` 後塞進 HTML
  - 或前端框架（React/Vue）已經拿到資料、整理好格式後再丟給元件
- **`data-url`（JSON 路徑 / API URL）**：適合「純前端靜態頁 / 想讓元件自行抓資料」。
  - 元件會 `fetch(data-url)` 並把回傳 JSON 當作資料陣列渲染

> **優先順序（規則 A）**：同時存在時 **`data-source` 優先**，會忽略 `data-url`，避免重複請求與覆蓋資料。

`data-source` 的值需為 JSON 字串，且每一筆資料建議包含：

- `marqueeText`：跑馬燈文字
- `marqueeLink`：點擊連結

---

## 2) 建議資料格式

```json
[
  {
    "marqueeText": "系統公告：本週五 22:00 進行維護",
    "marqueeLink": "https://example.com/notice/maintain"
  },
  {
    "marqueeText": "活動消息：新手教學課程已開放報名",
    "marqueeLink": "https://example.com/events/course"
  }
]
```

---

## 3) PHP 專案使用（後端已算好資料）

若後端已先把資料組成 JSON（例如 `{$marqueeData}`），可直接塞到 `data-source`：

```html
<marquee-ticker data-source="{$marqueeData}"></marquee-ticker>
<script
  type="module"
  src="你的路徑/marquee-ticker/js/marquee-ticker-component.js"
></script>
```

---

## 4) 靜態 JSON 使用（無後端計算）

當專案是純前端靜態頁，**推薦直接使用 `data-url`**：

```html
<marquee-ticker
  data-url="你的路徑/marquee-ticker-items.json"
></marquee-ticker>

<script
  type="module"
  src="你的路徑/marquee-ticker/js/marquee-ticker-component.js"
></script>
```

---

## 5) 可用屬性

- `default-speed`：移動速度（數字越大越快）
- `item-gap`：每個項目的水平間距
- `vertical-padding`：上下內距
- `direction`：`slide-left`（預設）或 `slide-right`

範例：

```html
<marquee-ticker
  default-speed="60"
  item-gap="32"
  vertical-padding="12"
  direction="slide-left"
  data-source='[{"marqueeText":"歡迎使用跑馬燈","marqueeLink":"#"}]'
></marquee-ticker>
```
