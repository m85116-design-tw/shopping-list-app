# CLAUDE.md

本檔案為 Claude Code(claude.ai/code)在此 repo 中工作時的指引。

## 這是什麼

「採買口袋清單」— 一個手機優先的海外購物原型工具。兩種模式:**匯入整理**(出發前:貼上商品連結／截圖,記下店家、分類、目標價)與**採買中**(現場採買:依店家／分類篩選、勾選已購項目、比對現場價與目標價、透過連結分享清單)。純靜態網站 —— `index.html` + `script.js` + `styles.css`,沒有建置工具、沒有 package.json、沒有框架、沒有測試。

## 使用規則

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

## 架構

所有內容都放在三個檔案裡,沒有模組化。`script.js` 由上到下執行:常數／範例資料 → DOM 參照快取 → 純渲染／輔助函式 → 事件綁定 → 檔案最底部的三個啟動呼叫(`loadState(); loadShareStateFromUrl(); render();`)。

### 狀態(State)

- 單一全域 `state` 物件(`items`、`activeStore`、`activeCategory`、`activeShareMode`、`view`、`readonly`),透過 `saveState`／`loadState` 持久化到 `localStorage`,鍵值為 `STORAGE_KEY = "pocket-shopping-list-v4"`。
- **這個版本化鍵值沒有任何遷移(migration)邏輯**——把 `v4` 升到 `v5` 會直接讓所有使用者的本機資料回退到範例資料集。若真的需要改動 item 的資料結構,務必謹慎決定。
- `state.activeStore` 刻意**不**在重新整理頁面時持久化(使用者每次造訪都要重新選店家),但透過分享連結載入時**會**被設定——重新整理與透過分享連結進入的行為是刻意不同的。
- 搜尋文字與「必買」開關是即時從 DOM 讀取的(`searchInput.value`、`mustToggle.checked`),在 `getFilteredItems` 內部使用,並未存在 `state` 裡——這兩者不會在重新整理後保留,也不屬於分享快照的一部分。如果需要讓它們持久化,要同時改三個地方(`state`、`saveState`／`loadState`、`encodeSnapshot`)。
- 分享功能的做法是把精簡過的 state 快照(items 去掉 `imageDataUrl`,加上 store/category/shareMode/view)進行 base64 編碼,塞進 `?snapshot=`(`encodeSnapshot`／`decodeSnapshot`／`loadShareStateFromUrl`)。`shareMode === "readonly"` 是唯一會把 `state.readonly` 設為 `true` 的地方。
- 唯讀模式是靠散落在各個寫入點(表單送出、切換開關、切換店家等)的 `if (state.readonly) return;` 這種防護來實現,而不是集中在單一檢查點——新增任何寫入路徑時要自己補上這個防護。`renderReadonlyState` 是唯一一處會把唯讀狀態反映回 UI(停用輸入欄位／按鈕)的地方。

### 渲染(Rendering)

沒有使用 `<template>` 標籤——`render()` 及其子函式(`renderCards`、`renderDraftList`、`updateStoreCounts`、`updateSharePanel` 等)都是用 `innerHTML` 模板字串來組出卡片。卡片帶有 `data-action` 屬性;列表容器上有一個委派(delegated)監聽器,透過 `.closest(".item-card")` 統一處理所有點擊／輸入事件(`spot-price`／`done`／`help`／`preview-image`)。新增互動元素時請遵循這個 `data-action` + 事件委派的模式,不要為每張卡片個別加監聽器。

所有寫入 `innerHTML` 的使用者提供文字都手動包了 `escapeHtml()`——這是整個 app 唯一的 XSS 防護(沒有框架自動跳脫)。任何要渲染出來的新欄位都要記得包這層。

### 幫 item 新增表單欄位

要動到五個地方:`index.html`(輸入欄位／select)→ `makeNewItem`(從 FormData 讀取)→ `sampleItems`(確保每筆範例資料都同步更新)→ 渲染的模板字串(顯示出來)→ `getFilteredItems` 的搜尋文字陣列(如果這個欄位需要可被搜尋)。

### CSS

`styles.css` 是手機優先的寫法,只有兩個斷點(`min-width: 760px`、`max-width: 370px`),使用 kebab-case 的語意化 class 命名(不是 BEM),狀態則靠 `.is-active`／`.is-done` 這類 class 或 `data-*` 屬性選擇器來表示。

**重要**:這份樣式表裡疊了三層幾乎完整的「skin」——是歷次設計調整留下的痕跡:基礎規則、接著是標記為 `/* Superdesign hi-fi skin */` 的區塊、最後是標記為 `/* Superdesign project alignment */` 的區塊(其中還包含第二個 `:root`,會覆蓋第一個)。像 `.app-shell`、`.item-card`、`:root` 這類選擇器都被定義了 2～3 次;由於 CSS 層疊順序的關係,**最後一層(`Superdesign project alignment`)的定義才是實際生效的**。改視覺樣式時,務必確認你改到的是真正生效的那一層,而不是已經被蓋掉的前面幾層。

### 瀏覽器 API 使用範圍

`navigator.clipboard.read()`、`navigator.share()`、`FileReader`+`<canvas>`(圖片壓縮到 900px／JPEG 品質 0.78 後才存成 dataURL)、`URLSearchParams`／`btoa`／`atob` 用於分享快照。有兩條並行的剪貼簿圖片處理路徑(`readClipboardImage` 給按鈕觸發的讀取用、`usePastedImageFromTarget` 給 `contenteditable` 長按貼上的備用方案用)——這是為了繞過 iOS Safari 不允許從一般按鈕點擊呼叫 `navigator.clipboard.read()` 的限制;如果你動到圖片匯入功能,兩條路徑都要測。

`saveState` 在 `localStorage.setItem` 寫入失敗時(通常是因為內嵌圖片讓資料超過容量上限),會靜默地丟棄每個 item 的 `imageDataUrl` 並重試,只會跳一個 toast 提示——圖片可能無聲無息地消失,不會報錯。分享連結則完全不含圖片(`encodeSnapshot` 一律會去掉 `imageDataUrl`)——這是兩套各自獨立的「圖片會不見」機制,不是同一個。
