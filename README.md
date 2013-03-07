# JSZhuyin - JS 注音

"Smart" Chinese Zhuyin Input Method in Javascript. Javascript 自動選字注音輸入法。[示範網頁](http://timdream.org/jszhuyin/)。

已知的線上自動選字注音輸入法都是將輸入送至伺服器，這是已知的第一個完全使用前端技術完成的實作，故可支援離線使用。

This library was intially developed as part of [Mozilla Firefox OS - Gaia](https://github.com/mozilla-b2g/gaia). Desktop front-end demo was initially developed in [Gaia keyboard demo](https://github.com/timdream/gaia-keyboard-demo).

## 軟體授權

MIT License

## 詞庫

使用 MIT License 授權的[小麥注音](http://mcbopomofo.openvanilla.org)詞庫，由 [mjhsieh](https://github.com/mjhsieh) 維護，基於 [libtabe](http://sourceforge.net/projects/libtabe/)。

使用前請先執行 `make` 從 McBopomofo 產生適用於 JSZhuyin 的詞庫檔案。

## 斷詞演算法

窮舉法與積分比較（笑）。窮舉是用很簡單的 <a href="http://stackoverflow.com/questions/8375439">Composition of a natural number</a>，積分是小麥注音詞庫提供的。不過因為是窮舉，如果有正確的詞庫應該可以做其他的 phonetic IME。

## 離線儲存

在提供新實作的 IndexedDB 的瀏覽器會將詞庫存進 IndexedDB，加快載入速度。

## 為何範例頁互動不像正常的桌機智慧注音？

因為 JS 注音是手機輸入法 :-/
