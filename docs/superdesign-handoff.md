# Superdesign 對齊進度(交接筆記)

給下一個接手 session 讀的現況,不是需求規格——需求規格是 [流程.md](../流程.md)。

## 專案資訊

- Superdesign 專案 id:`3b9f2bab-7036-4dbd-8b04-72f73d342479`(專案名稱「採買口袋清單設計」)
- 這是**先前 session** 建立的設計稿,不是這個 repo 裡的檔案。要重新看稿,用 CLI:
  ```bash
  npx --yes @superdesign/cli@latest fetch-design-nodes --project-id 3b9f2bab-7036-4dbd-8b04-72f73d342479
  npx --yes @superdesign/cli@latest get-design --draft-id <id> --output <檔名>.html
  ```
  用前提:Claude Code 要先裝 superdesign plugin(`/plugin marketplace add superdesigndev/superdesign-skill` → `/plugin install superdesign@superdesign`,裝完要重開 session 才會生效)。
- 目前抓過的 8 份草稿(draft id 會變動,以 `fetch-design-nodes` 現查為準,這裡只記標題方便對照):
  首頁、店家選擇(自定義模式)、新增商品(支持自定義店家)、最近加入預覽、圖卡檢視、清單檢視、商品詳情、分享頁面。

## 已完成

1. **自定義店家功能**(2026-09-07):`state.customStores`,店家篩選列/新增商品表單動態渲染,雲端同步。細節見 [state.md](state.md)。
2. **卡片視覺對齊 Superdesign**(2026-09-08,commit `00ab1de`):圓形勾選鈕、協尋改愛心 icon、meta 資訊拿掉「店家：」等標籤、搜尋框加放大鏡 icon、清單/圖卡切換與只看必買改 icon/開關樣式、圖卡模式簡化成圖片+標籤+標題+價格+勾選。
3. **雙層畫面／分享 icon／表單版面**(2026-09-08):
   - **選店家↔清單雙層**:`state.activeStore` 預設 `null`(第一層只顯示店家格子),選了店家才顯示搜尋/篩選/卡片。切換全在 `updateSelectedStore()` 裡用 `hidden` 做,沒有新增 screen。header 改成「返回箭頭＋標題＋分享 icon＋首頁」,標題由 `updateHeader()` 依 `body.dataset.mode` 與 `state.activeStore` 決定。返回鍵在清單層退回選店家層,其他情況回首頁。
   - **分享面板**:移到 `#shop-screen` 最上方、預設 `hidden`,由 header 的 `#share-toggle` 開關(`setSharePanel()`);離開清單層會自動收起。
   - **匯入表單**:商品名稱/來源改滿版並移到最前、店家｜類別與蒐集價｜優先度各成一列、蒐集價加 `¥` 前綴(`.yen-field`)、店家下方加 `#form-add-store-button` 小連結(開既有的新增店家對話框,且在匯入頁開時只選進表單、不會換掉採買中的店家)。
   - 順手修掉既有的白字白底 bug:`.import-actions button` 的白底原本蓋掉 `.solid-button` 的橘底,「讀取剪貼簿圖片」按鈕看不見。
   - 驗證:Playwright(真實滑鼠事件)36 項檢查通過 35 項,唯一未過是 `favicon.ico` 404(本來就沒放 favicon,與改動無關)。

## 還沒做

Superdesign 有但這邊刻意沒做的:分享稿的 QR code／PDF·Excel 匯出／協尋成員清單(這些功能本來就不存在,不只是視覺);清單稿的底部 tab bar(現在用 header 的首頁鍵導覽)。

## 動手前提醒

- 改 `script.js`/`styles.css` 記得同步 `index.html` 的 `?v=N` 版號(目前 v8),不然 GitHub Pages 的 10 分鐘快取會讓人以為沒生效。
- `styles.css` 有三層疊加的 skin(見 [css.md](css.md)),只有最後一層「Superdesign project alignment」生效,改視覺只改那層。
- 改完務必用 Playwright(`playwright-core` + `channel: "chrome"`,這台機器沒裝 Chromium,只能借用系統 Chrome)實際點過打勾/現場價/協尋/唯讀模式,不要只看 diff 就當作完成。
