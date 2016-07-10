感謝您對協助開發 JS 注音輸入法的興趣！

## 開發環境需求

* [`git`](http://git-scm.com/)
* [Closure Linter (`gjslint`)](https://developers.google.com/closure/utilities/)
* [`node`](http://nodejs.org/) (comes with [`npm`](http://npmjs.org/) built-in)
* GNU Make
* Python


## 本機使用

1. 執行 `npm install` 下載開發相關的相依套件。
2. 執行 `npm run grunt data`，下載 McBopomofo 並產生資料檔（此步驟會執行 McBopomofo 的 Makefile 故需要 make 與 Python）。
3. 執行本機伺服器（可以使用 `npm run grunt connect:test:keepalive`）
4. 用瀏覽器連到 `http://localhost:<port>/`，其中 `<port>` 為您指定的 port。

## 測試

### 瀏覽器測試

本專案使用 [QUnit](http://qunitjs.com/)。執行本機伺服器之後可以用瀏覽器連到 `http://localhost:<port>/test/` 執行測試。

有設定 `npm run grunt test` 這個 target，並且使用 SlimerJS 測試。

### 編譯測試

編譯資料檔使用 mocha 測試。

### jshint

所有 JavaScript 檔案需要通過設定的 jshint 規則。

## 貢獻規則

1. 您必須要以本專案[所使用的公眾授權](./LICENSE)授權大眾使用您的作品。
2. 所有測試必須要在最新版的 Firefox 與 Chrome 通過。新增功能請撰寫相對的測試以免未來被別人搞壞。
3. Early return 比縮排好。
4. 修改 async 的流程時請小心 race condition。

所有 Pull Request 在被接受前會通過人工 review。
