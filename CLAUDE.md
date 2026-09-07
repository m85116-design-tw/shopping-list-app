# CLAUDE.md

本檔案為 Claude Code(claude.ai/code)在此 repo 中工作時的指引,只放**每輪任務都該知道**的重點;細節依主題分類在 `docs/` 底下,需要時再讀對應檔案,不要一次全讀。

## 這是什麼

「採買口袋清單」— 一個手機優先的海外購物原型工具。兩種模式:**匯入整理**(出發前:貼上商品連結／截圖,記下店家、分類、目標價)與**採買中**(現場採買:依店家／分類篩選、勾選已購項目、比對現場價與目標價、透過連結分享清單)。前端仍是 `index.html` + `script.js` + `styles.css`,沒有建置工具、沒有 package.json、沒有框架、沒有測試——但 `script.js` 現在是 `type="module"`,直接用 CDN 匯入 Firebase JS SDK,清單資料存在 Firebase Firestore([docs/firestore.md](docs/firestore.md)),不再只存 localStorage。

## 使用規則

- **語言**:此專案的回覆一律使用繁體中文(zh-TW),禁止使用中國用語。
- **規格書與回覆格式**:比照 `i-have-adhd` skill——結論先行、多步驟拆成編號清單、結尾給一個具體下一步、不寒暄不繞彎。寫 `00_需求.md`、`流程.md` 等規格文件時也套用同樣格式。
- **寫 code 時**:套用 `ponytail` skill 的極簡化原則——先問「這真的需要嗎」(YAGNI),接著依序找「repo 裡已有可用的」→「標準庫/瀏覽器原生 API」→「一行打發」,最後才寫新代碼。避免為了這個純靜態小專案加不必要的抽象層。
  安裝(尚未裝的話):`/plugin marketplace add DietrichGebert/ponytail` → `/plugin install ponytail@ponytail`。

## 指令

沒有 build/lint/test 工具鏈。本機預覽方式:

```bash
python3 -m http.server
```

接著開啟 `http://localhost:8000/`。編輯 `index.html`／`script.js`／`styles.css` 後重新整理瀏覽器,就是完整的開發迴圈。

部署方式:commit 並 push 到 `main` —— GitHub Pages 已設定直接從 repo 根目錄提供服務(見 README.md)。

**GitHub Pages 對 `script.js`／`styles.css` 下了 `cache-control: max-age=600`**(10 分鐘),且 GitHub Pages 不能自訂 HTTP headers。每次改了 `script.js` 或 `styles.css` 要部署時,記得同步把 `index.html` 裡對應的 `?v=N` 數字加一(兩個檔案共用同一個版號就好),不然使用者裝置在 10 分鐘內重新整理會吃到快取的舊檔案,看起來像「改了但沒生效」。

## 架構總覽

`script.js` 由上到下執行:頂部 import Firebase SDK＋清單身分判斷(`isOwner`／`listId`) → 常數／範例資料 → DOM 參照快取 → 純渲染／輔助函式 → 事件綁定 → 檔案最底部的啟動流程(判斷 `state.readonly` → 自己的清單才 `loadState()` → `render()` → 訂閱 `onSnapshot`)。

動到以下主題前,先讀對應檔案:

| 主題 | 讀這個檔案 |
|---|---|
| 全域 `state`、`STORAGE_KEY`、唯讀模式怎麼防護 | [docs/state.md](docs/state.md) |
| Firestore 雲端同步、清單 id、安全規則 | [docs/firestore.md](docs/firestore.md) |
| `innerHTML` 渲染、`data-action` 事件委派的坑、XSS 防護、新增表單欄位要動哪五個地方 | [docs/rendering.md](docs/rendering.md) |
| CSS 三層 skin、哪一層才是實際生效的 | [docs/css.md](docs/css.md) |
| 剪貼簿／分享／圖片壓縮等瀏覽器 API 用法 | [docs/browser-apis.md](docs/browser-apis.md) |
