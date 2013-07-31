'use strict';

if (typeof window === 'object') {
  window.onmessage = function onmessage(evt) {
    (window.opener || window.parent).postMessage(evt.data, '*');
  };
} else {
  self.onmessage = function onmessage(evt) {
    self.postMessage(evt.data);
  };
}
