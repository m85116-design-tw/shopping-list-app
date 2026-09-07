# CSS

`styles.css` 是手機優先的寫法,只有兩個斷點(`min-width: 760px`、`max-width: 370px`),使用 kebab-case 的語意化 class 命名(不是 BEM),狀態則靠 `.is-active`／`.is-done` 這類 class 或 `data-*` 屬性選擇器來表示。

**重要**:這份樣式表裡疊了三層幾乎完整的「skin」——是歷次設計調整留下的痕跡:基礎規則、接著是標記為 `/* Superdesign hi-fi skin */` 的區塊、最後是標記為 `/* Superdesign project alignment */` 的區塊(其中還包含第二個 `:root`,會覆蓋第一個)。像 `.app-shell`、`.item-card`、`:root` 這類選擇器都被定義了 2～3 次;由於 CSS 層疊順序的關係,**最後一層(`Superdesign project alignment`)的定義才是實際生效的**。改視覺樣式時,務必確認你改到的是真正生效的那一層,而不是已經被蓋掉的前面幾層。
