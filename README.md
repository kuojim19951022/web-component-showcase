# YDM 經書展示專案

一個使用 CSS + JS 的響應式書架展示頁面。

## 📋 專案簡介

本專案展示了一個書架介面，包含：
- 響應式網格佈局（RWD）
- CSS Grid 排版
- 生成排列 書架底部
- 書架視覺效果（頂部、中間、底部）

## 🔧 開發說明

### 修改書本資料

編輯 `src/data/book-list.json`：

```json
[
  {
    "id": 1,
    "coverImage": "./src/images/book-item-cover-01.jpg",
    "title": "書本1"
  }
]
```

### 編輯 SCSS 樣式

如需修改樣式，請在編輯 SCSS 檔案前先啟動監聽模式：

**在 Git Bash 或 WSL 終端機中執行：**

```bash
./watch-scss.sh
```

此指令會自動監聽 `src/scss/` 目錄下的所有 SCSS 檔案變化，並即時編譯為 `dist/css/main.css`。

**注意事項：**
- 修改 SCSS 檔案後，腳本會自動重新編譯
- 編譯完成後，請重新整理瀏覽器查看效果
- 按 `Ctrl+C` 可停止監聽模式

### RWD 斷點

專案使用以下響應式斷點：

- `≤ 480px`：2 欄
- `≤ 576px`：3 欄
- `≤ 768px`：4 欄
- `≤ 992px`：5 欄
- `> 992px`：6 欄


## 📄 授權

本專案的所有圖片資源（包含書本封面圖片、木頭材質圖片等）均受版權保護，**嚴禁任何形式的下載、複製、轉載或商業使用**。

未經授權，不得：
- 下載或儲存任何圖片檔案
- 複製圖片內容
- 將圖片用於其他專案或商業用途
- 分享或轉發圖片資源

如有使用需求，請聯繫專案維護者取得授權。

---

## 💡 常見問題

### Q: 為什麼我的樣式沒有更新？

**A**: 請確認瀏覽器已重新整理，並確認有正確載入 `dist/css/main.css`。

### Q: 書本沒有顯示？

**A**: 請確認：
1. `src/data/book-list.json` 檔案存在且格式正確
2. 瀏覽器控制台沒有 JavaScript 錯誤
3. 使用本地伺服器開啟（不能直接用 `file://` 協議）

### Q: Windows 無法執行 `.sh` 腳本？

**A**: 在 Windows 系統上，請使用以下方式執行：

1. **使用 Git Bash**（推薦）：
   - 安裝 Git for Windows（已包含 Git Bash）
   - 在專案目錄開啟 Git Bash
   - 執行 `./watch-scss.sh`

2. **使用 WSL（Windows Subsystem for Linux）**：
   - 安裝 WSL 後，在 WSL 終端機中執行 `./watch-scss.sh`

3. **使用 PowerShell 執行對應指令**：
   ```powershell
   npx -y sass --watch src/scss/main.scss:dist/css/main.css --style compressed
   ```
