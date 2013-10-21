# JSZhuyin - JS 注音 [![Build Status](https://travis-ci.org/timdream/jszhuyin.png)](https://travis-ci.org/timdream/jszhuyin)

"Smart" Chinese Zhuyin Input Method in Javascript. Javascript 自動選字注音輸入法。[示範網頁](http://timdream.org/jszhuyin/)。

已知的線上自動選字注音輸入法都是將輸入送至伺服器，這是已知的第一個完全使用前端技術完成的實作，故可支援離線使用。

This library was intially developed as part of [Mozilla Firefox OS - Gaia](https://github.com/mozilla-b2g/gaia). Desktop front-end demo was initially developed in [Gaia keyboard demo](https://github.com/timdream/gaia-keyboard-demo).

## 軟體授權

MIT License

## 安裝至網站

您可以直接連結 Github 上的檔案：

    <script type="text/javascript" src="http://timdream.org/jszhuyin/lib/client.js"></script>
    <script type="text/javascript" src="http://timdream.org/jszhuyin/lib/web.js"></script>

準備基本的 HTML 元素（分別為待選字的注音，以及候選字詞），請自行加上適合的 CSS 樣式或是浮動視窗等等：

    <p id="composition"></p>
    <ol id="candidates"></ol>

使用以下程式碼啟動輸入法：

    JSZhuyinServerIframeLoader.prototype.IFRAME_URL =
      'http://timdream.org/jszhuyin/lib/frame.html';
    var webIME = new JSZhuyinWebIME({
      composition: document.getElementById('composition'),
      candidatesList: document.getElementById('candidates')
    });

啟動完成之後，JS 注音即會開始處理鍵盤輸入。

### 虛擬鍵盤

虛擬鍵盤可以將使用者點選的注音轉成 charCode 之後傳至 `webIME.handleKeyEvent(code)`。請確保虛擬鍵盤不會搶走 focus。

## 詞庫

使用 MIT License 授權的[小麥注音](http://mcbopomofo.openvanilla.org)詞庫，由 [mjhsieh](https://github.com/mjhsieh) 維護，基於 [libtabe](http://sourceforge.net/projects/libtabe/)。

使用前請先執行 `grunt data` 從 McBopomofo 產生適用於 JSZhuyin 的詞庫檔案。

## 斷詞演算法

窮舉法與積分比較（笑）。窮舉是用很簡單的 <a href="http://stackoverflow.com/questions/8375439">Composition of a natural number</a>，積分是小麥注音詞庫提供的。不過因為是窮舉，如果有正確的詞庫應該可以做其他的 phonetic IME。

## 為何範例頁互動不像正常的桌機智慧注音？

因為 JS 注音是手機輸入法 :-/
