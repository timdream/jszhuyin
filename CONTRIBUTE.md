感謝您對協助開發 JS 注音輸入法的興趣！

## 開發環境需求

* [`git`](http://git-scm.com/)
* [`node`](http://nodejs.org/) (comes with [`npm`](http://npmjs.org/) built-in)
* GNU Make
* Python
* Firefox


## 本機使用

1. 執行 `npm install` 下載開發相關的相依套件，並且觸發 prepublish script，下載 McBopomofo 並產生資料檔（此步驟會執行 McBopomofo 的 Makefile 故需要 make 與 Python）。
2. 執行本機伺服器（可以使用 `npm run grunt connect:test:keepalive`）
3. 用瀏覽器連到上述指令顯示的網址。

## 測試

執行 `npm test` 會自動執行 Karma、jshint、編譯程式測試。Karma 會啟動 Firefox 進行測試。

### 瀏覽器測試

本專案使用 [QUnit](http://qunitjs.com/)。執行本機伺服器之後可以用瀏覽器連到 `http://localhost:<port>/test/` 執行測試。

### 編譯測試

編譯資料檔使用 mocha 測試。

### jshint

所有 JavaScript 檔案需要通過設定的 jshint 規則。

### 手動測試

因為網站裝了 Service Worker，需要測試網站互動輸入的功能，請打開開發工具相對應的設定，或是用 Shift + F5 （Cmd + Shift + R）強制更新。

## 貢獻規則

1. 您必須要以本專案[所使用的公眾授權](./LICENSE)授權大眾使用您的作品。
2. 除了自動測試，以外所有測試必須要手動在最新版的 Firefox 與 Chrome 通過。新增功能請撰寫相對的測試以免未來被別人搞壞。
3. Early return 比縮排好。
4. 修改 async 的流程時請小心 race condition。

所有 Pull Request 在被接受前會通過人工 review。
