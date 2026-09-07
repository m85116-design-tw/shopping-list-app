# 渲染(Rendering)

沒有使用 `<template>` 標籤——`render()` 及其子函式(`renderCards`、`renderDraftList`、`updateStoreCounts`、`updateSharePanel` 等)都是用 `innerHTML` 模板字串來組出卡片。卡片帶有 `data-action` 屬性;列表容器上有一個委派(delegated)監聽器,透過 `.closest(".item-card")` 統一處理點擊(`help`／`preview-image`)。

**選擇器不要只寫屬性、要限定範圍**(2026-09-08 踩過的坑,debug 了三輪):`viewButtons` 原本寫 `querySelectorAll("[data-view]")`,結果連清單容器 `#shopping-list` 都抓進去了——因為 `renderCards` 會寫 `list.dataset.view = state.view` 給 CSS 用。容器因此被綁上「切換檢視」的 click 監聽器,點清單裡**任何東西**都會冒泡到容器、觸發整份重繪,checkbox 在瀏覽器送出 `change` 事件前就被換掉,打勾完全失效。現在寫成 `.view-toggle button[data-view]`。**要用 `data-*` 屬性當選擇器前,先確認同一個屬性沒有被其他元素(尤其是容器)拿去當狀態旗標用。**

**`done`(打勾)跟 `spot-price`(現場價輸入框)故意不在這個委派 click 監聽器裡處理**,而是各自用專屬的 `change`／`input` 監聽器——這兩個是瀏覽器原生會自己觸發後續事件的表單控制項,如果 click 監聽器也跟著搶著 `render()` 整個重建 DOM,會在瀏覽器完成打勾/輸入框 focus 的原生行為前就把元素換掉,導致打勾失效、輸入框點了沒反應(這是真實踩過的坑,見 git log 的 fix commit)。新增互動元素時,單純的按鈕(不會觸發自己的 change/input)用 `data-action` + click 委派沒問題;會有原生後續事件的表單控制項(checkbox、input)要比照 `done`/`spot-price` 的作法,在 click 監聽器裡提早 `return`。

所有寫入 `innerHTML` 的使用者提供文字都手動包了 `escapeHtml()`——這是整個 app 唯一的 XSS 防護(沒有框架自動跳脫)。任何要渲染出來的新欄位都要記得包這層。

## 幫 item 新增表單欄位

要動到五個地方:`index.html`(輸入欄位／select)→ `makeNewItem`(從 FormData 讀取)→ `sampleItems`(確保每筆範例資料都同步更新)→ 渲染的模板字串(顯示出來)→ `getFilteredItems` 的搜尋文字陣列(如果這個欄位需要可被搜尋)。
