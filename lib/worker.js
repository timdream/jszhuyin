'use strict';

/**
 * Load JSZhuyin, etc. into a Web Workers.
 *
 * Noted that for Firefox, Web Workers thread has no access
 * to async IndexedDB API so you might still want to use
 * frame.html approach for now.
 * https://bugzilla.mozilla.org/show_bug.cgi?id=701634
 *
 */

importScripts('bopomofo_encoder.js', 'jszhuyin_data_pack.js',
  'storage.js', 'jszhuyin.js', 'jszhuyin_server.js');
