# CLAUDE.md

本檔案為 Claude Code(claude.ai/code)在此 repo 中工作時的指引。

## 這是什麼

「採買口袋清單」— 一個手機優先的海外購物原型工具。兩種模式:**匯入整理**(出發前:貼上商品連結／截圖,記下店家、分類、目標價)與**採買中**(現場採買:依店家／分類篩選、勾選已購項目、比對現場價與目標價、透過連結分享清單)。前端仍是 `index.html` + `script.js` + `styles.css`,沒有建置工具、沒有 package.json、沒有框架、沒有測試——但 `script.js` 現在是 `type="module"`,直接用 CDN 匯入 Firebase JS SDK,清單資料存在 Firebase Firestore(見下方「雲端同步」),不再只存 localStorage。

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

## 架構

所有內容都放在三個檔案裡,沒有模組化。`script.js` 由上到下執行:頂部 import Firebase SDK＋清單身分判斷(`isOwner`／`listId`) → 常數／範例資料 → DOM 參照快取 → 純渲染／輔助函式 → 事件綁定 → 檔案最底部的啟動流程(判斷 `state.readonly` → 自己的清單才 `loadState()` → `render()` → 訂閱 `onSnapshot`)。

### 狀態(State)

- 單一全域 `state` 物件(`items`、`activeStore`、`activeCategory`、`activeShareMode`、`view`、`readonly`)。`saveState` 會同時寫兩份:自己的 `localStorage`(鍵值 `STORAGE_KEY = "pocket-shopping-list-v4"`,離線/第一次進站用)跟 Firebase Firestore 的雲端文件(跨裝置同步用,見下方「雲端同步」)。
- **`STORAGE_KEY` 這個版本化鍵值沒有任何遷移(migration)邏輯**——把 `v4` 升到 `v5` 會直接讓所有使用者的本機資料回退到範例資料集。若真的需要改動 item 的資料結構,務必謹慎決定(這點 Firestore 那份文件也一樣沒有遷移邏輯)。
- `state.activeStore` 刻意**不**持久化,也**不**同步到 Firestore(重新整理或透過分享連結進入都要自己選店家)——這是唯一保留在純前端、跟雲端無關的一塊 UI 狀態。
- 搜尋文字與「必買」開關是即時從 DOM 讀取的(`searchInput.value`、`mustToggle.checked`),在 `getFilteredItems` 內部使用,並未存在 `state` 裡,也不會同步到雲端。如果需要讓它們持久化,要同時改 `state`、`saveState`／`loadState`、`docPayload` 這幾個地方。
- 唯讀模式是靠散落在各個寫入點(表單送出、切換開關、切換店家等)的 `if (state.readonly) return;` 這種防護來實現,而不是集中在單一檢查點——新增任何寫入路徑時要自己補上這個防護。`renderReadonlyState` 是唯一一處會把唯讀狀態反映回 UI(停用輸入欄位／按鈕)的地方。

### 雲端同步(Firestore)

- Firebase 專案 `shopping-list-75450`,Firestore collection `lists`,一份清單 = 一份文件(doc id 是隨機字串)。**沒有帳號登入**——誰有這個 id(藏在分享連結的 `?list=` 裡),誰就能讀寫這份清單,安全模型跟舊版「有連結才能看」完全一樣,只是現在連結指向的是活的雲端文件而不是凍結的快照。
- 自己的清單 id 產生一次就存在 `localStorage`(`LIST_ID_KEY`),之後每次造訪都用同一個 id。打開別人分享的 `?list=xxx` 連結時,`isOwner` 為 `false`,不會去讀寫自己的 `LIST_ID_KEY`／`STORAGE_KEY`,避免把別人的清單寫進自己的本機清單裡。
- `?mode=readonly` 才是唯讀權限的唯一依據,跟清單本身要不要同步已經分開——「只讀清單」現在看到的也是即時更新的進度,只是不能編輯,不再是分享當下的凍結快照。
- 用 `onSnapshot` 監聽文件變化,收到別的裝置寫入時整頁重新 `render()`。但收到**自己剛寫入、伺服器還沒確認**的那次回呼(`snapshot.metadata.hasPendingWrites === true`)會直接跳過——不然使用者在「現場價」欄位打字打到一半,畫面會被自己送出去的舊值蓋掉、輸入框失焦。改這段邏輯時務必保留這個判斷。
- Firestore 單一文件上限 1MiB,圖片(`imageDataUrl`)是直接塞進文件的 base64,寫入失敗會自動重試一次(去掉圖片)並跳 toast,做法跟 localStorage 那份原本的「容量不夠就丟圖片」機制一樣,是兩套各自獨立的「圖片可能無聲消失」路徑。
- 安全規則在 Firebase Console 的 Firestore Rules 設定(不在這個 repo 裡),內容見 `README.md`:`allow get, write: if true`(用 id 存取)+`allow list: if false`(擋掉列出整個 collection,不然只要知道規則語法,任何人都能讀到所有人的清單)。

### 渲染(Rendering)

沒有使用 `<template>` 標籤——`render()` 及其子函式(`renderCards`、`renderDraftList`、`updateStoreCounts`、`updateSharePanel` 等)都是用 `innerHTML` 模板字串來組出卡片。卡片帶有 `data-action` 屬性;列表容器上有一個委派(delegated)監聽器,透過 `.closest(".item-card")` 統一處理點擊(`help`／`preview-image`)。

**選擇器不要只寫屬性、要限定範圍**(2026-09-08 踩過的坑,debug 了三輪):`viewButtons` 原本寫 `querySelectorAll("[data-view]")`,結果連清單容器 `#shopping-list` 都抓進去了——因為 `renderCards` 會寫 `list.dataset.view = state.view` 給 CSS 用。容器因此被綁上「切換檢視」的 click 監聽器,點清單裡**任何東西**都會冒泡到容器、觸發整份重繪,checkbox 在瀏覽器送出 `change` 事件前就被換掉,打勾完全失效。現在寫成 `.view-toggle button[data-view]`。**要用 `data-*` 屬性當選擇器前,先確認同一個屬性沒有被其他元素(尤其是容器)拿去當狀態旗標用。**

**`done`(打勾)跟 `spot-price`(現場價輸入框)故意不在這個委派 click 監聽器裡處理**,而是各自用專屬的 `change`／`input` 監聽器——這兩個是瀏覽器原生會自己觸發後續事件的表單控制項,如果 click 監聽器也跟著搶著 `render()` 整個重建 DOM,會在瀏覽器完成打勾/輸入框 focus 的原生行為前就把元素換掉,導致打勾失效、輸入框點了沒反應(這是真實踩過的坑,見 git log 的 fix commit)。新增互動元素時,單純的按鈕(不會觸發自己的 change/input)用 `data-action` + click 委派沒問題;會有原生後續事件的表單控制項(checkbox、input)要比照 `done`/`spot-price` 的作法,在 click 監聽器裡提早 `return`。

所有寫入 `innerHTML` 的使用者提供文字都手動包了 `escapeHtml()`——這是整個 app 唯一的 XSS 防護(沒有框架自動跳脫)。任何要渲染出來的新欄位都要記得包這層。

### 幫 item 新增表單欄位

要動到五個地方:`index.html`(輸入欄位／select)→ `makeNewItem`(從 FormData 讀取)→ `sampleItems`(確保每筆範例資料都同步更新)→ 渲染的模板字串(顯示出來)→ `getFilteredItems` 的搜尋文字陣列(如果這個欄位需要可被搜尋)。

### CSS

`styles.css` 是手機優先的寫法,只有兩個斷點(`min-width: 760px`、`max-width: 370px`),使用 kebab-case 的語意化 class 命名(不是 BEM),狀態則靠 `.is-active`／`.is-done` 這類 class 或 `data-*` 屬性選擇器來表示。

**重要**:這份樣式表裡疊了三層幾乎完整的「skin」——是歷次設計調整留下的痕跡:基礎規則、接著是標記為 `/* Superdesign hi-fi skin */` 的區塊、最後是標記為 `/* Superdesign project alignment */` 的區塊(其中還包含第二個 `:root`,會覆蓋第一個)。像 `.app-shell`、`.item-card`、`:root` 這類選擇器都被定義了 2～3 次;由於 CSS 層疊順序的關係,**最後一層(`Superdesign project alignment`)的定義才是實際生效的**。改視覺樣式時,務必確認你改到的是真正生效的那一層,而不是已經被蓋掉的前面幾層。

### 瀏覽器 API 使用範圍

`navigator.clipboard.read()`、`navigator.share()`、`FileReader`+`<canvas>`(圖片壓縮到 900px／JPEG 品質 0.78 後才存成 dataURL)、`URLSearchParams` 用於解析 `?list=`／`?mode=`(分享連結不再用 base64 快照,細節見上方「雲端同步」)。有兩條並行的剪貼簿圖片處理路徑(`readClipboardImage` 給按鈕觸發的讀取用、`usePastedImageFromTarget` 給 `contenteditable` 長按貼上的備用方案用)——這是為了繞過 iOS Safari 不允許從一般按鈕點擊呼叫 `navigator.clipboard.read()` 的限制;如果你動到圖片匯入功能,兩條路徑都要測。

`saveState` 在 `localStorage.setItem` 寫入失敗時(通常是因為內嵌圖片讓資料超過容量上限),會靜默地丟棄每個 item 的 `imageDataUrl` 並重試,只會跳一個 toast 提示——圖片可能無聲無息地消失,不會報錯。分享連結則完全不含圖片(`encodeSnapshot` 一律會去掉 `imageDataUrl`)——這是兩套各自獨立的「圖片會不見」機制,不是同一個。
