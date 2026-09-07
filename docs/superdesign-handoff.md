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

## 還沒做(使用者已知道、選擇先跳過)

比對 8 份草稿時發現的差距,依複雜度排序:

1. **店家選擇/清單雙層畫面**:Superdesign 是「先選店家的獨立畫面(store-select 稿)→ 進到單一店家清單頁(header 是返回箭頭+店名+分享/更多 icon)」,現在是「店家格子＋搜尋＋分享面板＋清單」全部疊在 `#shop-screen` 同一頁捲動。**這是畫面結構改動,不只是換色**,要動 `showMode`/`screens` 邏輯與 `updateSelectedStore` 這類 hidden 切換,風險比卡片改版高。
2. **分享面板收合成 icon 觸發**:現在 `.share-panel` 整塊常駐顯示(標題/模式按鈕/說明/連結),Superdesign 是 header 上一顆分享 icon,點了才彈出。
3. **匯入整理表單視覺**:add-product 草稿的 2 欄 select 版面、圖示風格,目前完全沒套用,表單還是原本樣子。

這三項待辦是 2026-09-08 跟使用者確認過、明確說「先跳過」的,不是漏掉。使用者若要繼續,直接說「繼續做選店家雙層畫面」之類的就好,不用重新做一次比對。

## 動手前提醒

- 改 `script.js`/`styles.css` 記得同步 `index.html` 的 `?v=N` 版號(目前 v7),不然 GitHub Pages 的 10 分鐘快取會讓人以為沒生效。
- `styles.css` 有三層疊加的 skin(見 [css.md](css.md)),只有最後一層「Superdesign project alignment」生效,改視覺只改那層。
- 改完務必用 Playwright(`playwright-core` + `channel: "chrome"`,這台機器沒裝 Chromium,只能借用系統 Chrome)實際點過打勾/現場價/協尋/唯讀模式,不要只看 diff 就當作完成。
