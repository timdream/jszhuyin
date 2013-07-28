'use strict';

/**
 * Load JSZhuyinIME, etc. into a Web Workers.
 *
 * Noted that as of now Web Workers thread has no access to async IndexedDB API.
 * So you might still want to use frame.html* approach for now.
 * https://bugzilla.mozilla.org/show_bug.cgi?id=701634
 *
 * * frame approach also give you off-origin loading too.
 *
 */

importScripts('bopomofo_encoder.js', 'storage.js',
  'ime.js', 'ime_post_messenger.js');
