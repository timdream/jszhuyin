# APIs

This documents defines public APIs in [WebIDL](https://www.w3.org/TR/WebIDL/).
All methods and properties not listed here are private methods, which is subject to breaking changes between minor version changes.

The [WebIDL Checker](https://www.w3.org/2009/07/webidl-check) can make sure the syntax is valid (Comment lines w/ Bopomofo symbols needs to be removed, though).

```webidl
/**
 * JSZhuyin loads and run on the same thread it is being started.
 * All callbacks will be called synchronously, but the matching and
 * database will unfortunately blocks other things going on in the main
 * thread.
 */
[Constructor]
interface JSZhuyin {
  /**
   * For JSZhiyin, these options can be set as attributes of the interface,
   * Please refer to comments in ConfigDict for detail.
   *
   * JSZhuyinClient must be set through setConfig() or load().
   */
  attribute ArrayBuffer?                 DATA_ARRAY_BUFFER;
  attribute DOMString                    dataURL;
  attribute DOMString                    INTERCHANGABLE_PAIRS;
  attribute long                         LONGEST_PHRASE_LENGTH;
  attribute long                         MAX_SOUNDS_LENGTH;
  attribute boolean                      MUST_HANDLE_ALL_KEYS;
  attribute boolean                      REORDER_SYMBOLS;
  attribute boolean                      SUGGEST_PHRASES;

  /**
   * Load JSZhuyin; loading the database and register callbacks, etc.
   */
  void      load(ArrayBuffer? data);
};
JSZhuyin implements JSZhuyinCommon;

/**
 * JSZhuyinClient is a wrapper of the Web Worker/Iframe that would run
 * JSZhuyin in it's own worker/iframe.
 */
[Constructor]
interface JSZhuyinClient {
  /**
   * Load JSZhuyinClient; load the loader and the database,
   * register callbacks, etc.
   * @param loader      A JSZhuyinServerLoader instance, should be
   *                    either a JSZhuyinServerIframeLoader instance or
   *                    a JSZhuyinServerWorkerLoader instance.
   * @param config      Configuration to set on JSZhuyin *before* loading.
   * @param data        ArrayBuffer representing JSZhuyin data. Optional.
   */
  void      load(JSZhuyinServerLoader? loader, ConfigDict config, ArrayBuffer? data);
};
JSZhuyinClient implements JSZhuyinCommon;

interface JSZhuyinCommon {
  /**
   * Run when an action is handled; receives reqId passed to the functions.
   */
  attribute ActionHandledCallback        onactionhandled;
  /**
   * Callback to call when candidate menu updates.
   * Each candidates are in an array of two elements, with first element
   * the string of the candidate and the second one the serial identifier.
   */
  attribute CandidatesChangeCallback     oncandidateschange;
  /**
   * Callback to call when the composition updates.
   */
  attribute CompositionUpdateCallback    oncompositionupdate;
  /**
   * Callback to call when the composition ends.
   */
  attribute CompositionEndCallback       oncompositionend;
  /**
   * Run when database download progresses.
   */
  attribute DownloadProgressCallback     ondownloadprogress;
  /**
   * Run when error occours.
   */
  attribute ErrorCallback                onerror;
  /**
   * Run when loading is successful.
   */
  attribute LoadCallback                 onload;
  /**
   * Run when the loading is complete.
   */
  attribute LoadEndCallback              onloadend;
  /**
   * Run when unload.
   */
  attribute UnloadCallback               onunload;

  /**
   * Set configurations.
   */
  void      setConfig(ConfigDict config);
  /**
   * (Not implemented) Commit the current composition synchronizely.
   */
  void      commitComposition();
  /**
   * (Not implemented) Cancel the current composition synchronizely.
   */
  void      cancelComposition();
  /**
   * Handle a key with it's DOM UI Event Level 3 key value.
   * For Bopomofo keys, the value is simply the Bopomofo symbol(s).
   *
   * The method returns false if a key is not handled, usually because
   * there is currently no composition and the method is called with
   * a non-Bopomofo key.
   *
   * All the keys will be handled if there is currently a composition.
   * However, the only non-printable keys that will be handled correctly
   * are "Escape", "Enter", and "Backspace".
   *
   * reqId will be passed back to the callbacks as the key is being handled.
   * For JSZhuyin it is passed as-is. For JSZhuyinClient it must be
   * an object that can be structure-cloned and passes worker boundary.
   */
  boolean   handleKey(DOMString key, any reqId);
  /**
   * Select a candidate.
   * The first argument should be one of the two-element array in the
   * candidates list that identified the candidate selected. It can be
   * a copy of the original array, instead of the original reference.
   *
   * reqId will be passed back to the callbacks as the key is being handled.
   * For JSZhuyin it is passed as-is. For JSZhuyinClient it must be
   * an object that can be structure-cloned and passes worker boundary.
   */
  void      selectCandidate(sequence<(DOMString or long)> candidate, any reqId);
  /**
   * Unload the instance. Can be safely called within the callbacks.
   */
  void      unload();
};

/**
 * JSZhuyinServerIframeLoader loads JSZhuyin into an iframe.
 * You will mostly likely don't need to use this except for debugging
 * JSZhuyinClient/JSZhuyin without actually starting an worker.
 */
[Constructor,
 Constructor(DOMString url)]
interface JSZhuyinServerIframeLoader {
  attribute DOMString                    IFRAME_URL;
  attribute DOMString                    IFRAME_CLASSNAME;
  void      load(object iframe);
  void      unload();
};
JSZhuyinServerIframeLoader implements JSZhuyinServerLoader;

/**
 * JSZhuyinServerWorkerLoader loads JSZhuyin into an Web Worker instance.
 */
[Constructor,
 Constructor(DOMString url)]
interface JSZhuyinServerWorkerLoader {
  attribute DOMString                    WORKER_URL;
  void      load(object worker);
  void      unload();
};
JSZhuyinServerWorkerLoader implements JSZhuyinServerLoader;

interface JSZhuyinServerLoader {
};

dictionary ConfigDict {
  /**
   * ArrayBuffer instance holding the database.
   * You may set this constant to skip async load() phase.
   */
  ArrayBuffer?                 DATA_ARRAY_BUFFER;
  /**
   * Path to the database file to load.
   * The default path points to the database file in the released package.
   */
  DOMString                    dataURL = "";
  /**
   * When searching for matching words/phrases, consider these pairs of symbols
   * are interchangables.
   * Must be a string representing 2n sounds in Bopomofo symbols.
   *
   * Example string: 'ㄣㄥㄌㄖㄨㄛㄡ', making ㄣ interchangable with ㄥ and
   * ㄌ interchangable with ㄖ, and ㄨㄛ with ㄡ.
   */
  DOMString                    INTERCHANGABLE_PAIRS = "";
  /**
   * Longest possible phrase in the database, any longer than this will not be
   * matched
   */
  long                         LONGEST_PHRASE_LENGTH = 6;
  /**
   * Limit the length of the symbols in the compositions.
   */
  long                         MAX_SOUNDS_LENGTH = 48;
  /**
   * handleKey will handle every key if this is set to true.
   * Not applicable keys (e.g. a Backspace key when there isn't any symbol
   * to remove) will be discarded.
   */
  boolean                      MUST_HANDLE_ALL_KEYS = false;
  /**
   * Allow re-order of symbol input.
   * Better error-handling for typing with hardware keyboard.
   */
  boolean                      REORDER_SYMBOLS = false;
  /**
   * Suggest phrases after confirming characters.
   */
  boolean                      SUGGEST_PHRASES = true;
};

callback ActionHandledCallback =
  void (any reqId);
callback CandidatesChangeCallback =
  void (sequence<sequence<(DOMString or long)>> candidates, any reqId);
callback CompositionUpdateCallback =
  void (DOMString composition, any reqId);
callback CompositionEndCallback =
  void (DOMString composition, any reqId);
callback DownloadProgressCallback =
  void (DownloadProgressDict progress);
callback ErrorCallback =
  void (Error error);
callback LoadEndCallback =
  void ();
callback LoadCallback =
  void ();
callback UnloadCallback =
  void ();

dictionary DownloadProgressDict {
  boolean                     lengthComputable;
  long                        loaded;
  long?                       total;
};
```
