# 跑馬燈資料傳遞機制深度解析 (Data-Source Note)

這份筆記旨在解釋為什麼 `MarqueeTicker` 組件需要透過 `data-source='{#$marqueeData#}'` 這種方式來接收資料，以及為什麼不直接在 JavaScript 檔案中使用 PHP 提供的變數。

---

## 📋 設計原因總覽

為什麼要透過 `data-source` 屬性注入資料，而不是直接在 JavaScript 檔案中使用 PHP 變數？以下是核心原因：

1. **執行環境隔離**：PHP 在伺服器端執行，JavaScript 在瀏覽器端執行，兩者無法直接共享記憶體或變數
2. **序列化傳遞需求**：必須將 PHP 資料結構轉換為可傳輸的文字格式（JSON），才能在 HTTP 回應中傳遞
3. **組件封裝性**：Web Component 應該保持獨立，不依賴特定的後端環境或全域變數
4. **支援多實例**：同一頁面可以有多個跑馬燈實例，每個實例需要獨立的資料來源
5. **快取與重用性**：JavaScript 檔案可以獨立快取，組件可以在不同頁面、不同後端環境中重用
6. **符合 Web 標準**：透過 HTML 屬性傳遞資料是 Web Components 的標準做法

---

## 📖 詳細解釋

### 1. 跨語言的「序列化」必要性 (PHP vs. JavaScript)

這是最核心的原因。**PHP 陣列與 JavaScript 陣列是兩種完全不同的記憶體結構，它們存在於不同的執行環境中。**

#### 執行環境的差異

```
┌─────────────────────────────────────┐
│ 伺服器端 (Server-side)              │
│                                     │
│ PHP 執行時：                        │
│ - 從資料庫讀取資料                  │
│ - 處理並轉換成 $cleanData 陣列      │
│ - 將資料嵌入到 HTML 模板中          │
│ - 輸出完整的 HTML 文字檔給瀏覽器    │
│                                     │
│ ↓ HTTP 回應（純文字）               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 瀏覽器端 (Client-side)              │
│                                     │
│ JavaScript 執行時：                 │
│ - 接收 HTML 文字檔                  │
│ - 解析 HTML DOM                     │
│ - 載入並執行 JavaScript 檔案        │
│ - 無法直接存取伺服器端的 PHP 變數   │
└─────────────────────────────────────┘
```

**關鍵點**：當 PHP 執行完畢後，伺服器只會吐出「純文字（HTML/CSS/JS）」給瀏覽器。JavaScript 並沒有辦法「直接看到」PHP 記憶體中的 `$marquee` 陣列，因為它們根本不在同一個執行環境中。

#### 為什麼要 `json_encode`？

`json_encode` 的作用是將 PHP 的資料結構轉換為「可傳輸的文字格式（JSON 字串）」，這樣才能透過 HTTP 回應傳遞給瀏覽器。

**資料流程**：

1. **PHP 端**：將 `$cleanData` 陣列轉換為 JSON 字串
   ```php
   $marqueeData = json_encode($cleanData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
   // 結果：'[{"marqueeText":"公告1","marqueeLink":"..."}]'
   ```

2. **模板端**：將 JSON 字串嵌入到 HTML 屬性中
   ```html
   <marquee-ticker data-source='[{"marqueeText":"公告1",...}]'></marquee-ticker>
   ```

3. **瀏覽器端**：JavaScript 透過 `getAttribute()` 取得字串
   ```javascript
   const rawData = this.getAttribute('data-source');
   // rawData = '[{"marqueeText":"公告1",...}]'
   ```

4. **JavaScript 端**：透過 `JSON.parse()` 將字串還原成 JavaScript 物件
   ```javascript
   const items = JSON.parse(rawData);
   // items = [{marqueeText: '公告1', marqueeLink: '...'}]
   ```

**為什麼不能直接在 JS 檔案中寫 PHP？**

假設您想在 `marquee-ticker-component.js` 中這樣寫：
```javascript
// ❌ 這是不可能的！
const data = <?php echo json_encode($cleanData); ?>;
```

**問題**：
- `marquee-ticker-component.js` 是靜態檔案，瀏覽器直接請求時不會經過 PHP 處理
- 即使透過 PHP 動態輸出，也會讓組件與特定後端環境強耦合，失去重用性

### 2. Web Component 的「封裝性」與「重用性」

如果您直接在 `marquee-ticker-component.js` 裡面寫 PHP 變數，組件就會失去重用性，變成只能在這一個特定環境中使用的「一次性組件」。

#### A. 職責分離 (Decoupling)

Web Component 應該像一個獨立的「小電器」，遵循「單一職責原則」：

*   **HTML 屬性**：就像是組件的「插頭」，是組件接收資料的標準介面
*   **後端資料**：則是牆上的「插座」，提供資料來源
*   **組件本身**：只負責「顯示資料」，不需要知道資料從哪裡來

**好處**：
- 組件可以在任何頁面使用（PHP 頁面、Node.js 頁面、靜態 HTML 頁面）
- 不需要依賴特定的後端環境或框架
- 組件的邏輯與資料來源完全解耦，易於測試和維護

**實際範例**：
```html
<!-- 在 PHP 頁面中使用 -->
<marquee-ticker data-source='[{"marqueeText":"PHP 資料"}]'></marquee-ticker>

<!-- 在 Node.js 頁面中使用 -->
<marquee-ticker data-source='[{"marqueeText":"Node.js 資料"}]'></marquee-ticker>

<!-- 在靜態 HTML 中使用 -->
<marquee-ticker data-source='[{"marqueeText":"靜態資料"}]'></marquee-ticker>
```

所有情況都使用相同的組件，只是資料來源不同。

#### B. Shadow DOM 的隔離環境

`MarqueeTicker` 使用了 Shadow DOM，這是一個與外部完全隔離的空間：

*   **樣式隔離**：組件內部的 CSS 不會影響外部，外部的 CSS 也不會影響組件
*   **變數隔離**：組件內部的 JavaScript 變數不會與外部衝突
*   **標準溝通方式**：透過 HTML 屬性傳遞資料（Property Passing）是 Web Components 的標準做法

**為什麼不用全域變數？**

如果使用全域變數：
```javascript
// ❌ 不好的做法
window.marqueeData = <?php echo json_encode($cleanData); ?>;
```

**問題**：
- 破壞了 Shadow DOM 的隔離性
- 多個實例會互相干擾
- 無法在組件外部控制資料的存取
- 違反了 Web Components 的設計原則

**正確做法**：
```html
<!-- ✅ 標準做法 -->
<marquee-ticker data-source='[{"marqueeText":"..."}]'></marquee-ticker>
```

組件透過 `getAttribute('data-source')` 取得資料，這是標準且安全的方式。

### 3. 解決「多個實例」的衝突

想像一下，如果您在一個頁面放了**兩個跑馬燈**，它們需要顯示不同的內容：
1. **上方跑馬燈**：顯示公告訊息
2. **下方跑馬燈**：顯示活動訊息

#### 如果使用全域變數會發生什麼？

```javascript
// ❌ 問題做法
window.marqueeData = <?php echo json_encode($cleanData); ?>;
```

```html
<!-- 兩個跑馬燈都讀取同一個全域變數 -->
<marquee-ticker></marquee-ticker>  <!-- 上方：公告 -->
<marquee-ticker></marquee-ticker>  <!-- 下方：活動 -->
```

**結果**：兩個跑馬燈都會顯示相同的資料（公告），因為它們都讀取同一個 `window.marqueeData`。

#### 使用 `data-source` 的解決方案

```html
<!-- ✅ 正確做法：每個實例有獨立的資料來源 -->
<marquee-ticker 
  data-source='[{"marqueeText":"公告1"},{"marqueeText":"公告2"}]'
></marquee-ticker>

<marquee-ticker 
  data-source='[{"marqueeText":"活動1"},{"marqueeText":"活動2"}]'
></marquee-ticker>
```

**結果**：
- 上方跑馬燈顯示：公告1、公告2
- 下方跑馬燈顯示：活動1、活動2
- 兩個實例完全獨立，互不干擾

**技術原理**：
每個 `<marquee-ticker>` 元素都是獨立的實例，它們各自透過 `this.getAttribute('data-source')` 取得自己的資料，不會互相影響。

### 4. 為什麼在 PHP map 之後，JS 也要處理？

您之前的疑惑是：**「PHP 已經處理好了，JS 為什麼還要跑 map？」**

#### 職責分工

我們現在的解決方案採用了「前後端職責分離」的設計：

1. **PHP 負責「結構轉換」**：
   - 從資料庫讀取原始資料（如 `subject.marqueeText`）
   - 轉換成組件指定的統一格式（`marqueeText`、`marqueeLink`）
   - 過濾空資料
   - 序列化為 JSON 字串

2. **JavaScript 負責「純渲染」**：
   - 解析 JSON 字串
   - 驗證資料格式
   - 渲染到 DOM
   - 處理動畫效果

#### 為什麼 JS 還需要驗證和處理？

雖然 PHP 已經處理過資料，但 JavaScript 端仍然需要一些防護措施：

**原因 A：防止後端出錯**
```javascript
// 防護措施
try {
  const items = JSON.parse(rawData);
  if (Array.isArray(items)) {
    this.setData(items);  // 只有確認是陣列才使用
  }
} catch (e) {
  console.error('MarqueeTicker: Data parse error', e);
  // 即使後端傳了錯誤格式，組件也不會崩潰
}
```

**原因 B：處理邊界情況**
- 後端可能傳 `null` 或 `undefined`
- JSON 解析可能失敗
- 資料格式可能不完全符合預期

**原因 C：前端最後的資料清理**
- 雖然 PHP 已經 `trim()` 過，但前端可以再次確保資料乾淨
- 處理特殊字元轉義（XSS 防護）
- 處理空值或異常值

#### 這是一種「穩健（Robust）」的設計

這種設計確保了：
- **容錯性**：即使後端環境有些微差異，組件依然能正常運作
- **可維護性**：前後端職責清晰，易於除錯和修改
- **可擴展性**：未來如果需要支援其他資料來源（如 API），只需要修改 PHP 端，JavaScript 端不需要改動

---

## 📝 總結

透過 `data-source` 屬性注入資料，而不是直接在 JavaScript 檔案中使用 PHP 變數，是基於以下核心考量：

1. **技術限制**：PHP 和 JavaScript 執行環境不同，必須透過序列化傳遞
2. **設計原則**：符合 Web Components 的封裝性和重用性原則
3. **實務需求**：支援多實例、獨立快取、跨平台使用
4. **穩健性**：前後端職責分離，提高容錯性和可維護性

這不是過度設計，而是必要的架構選擇，確保組件可以在各種環境中穩定運作。

