"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/events/events.js
  var require_events = __commonJS({
    "node_modules/events/events.js"(exports, module) {
      "use strict";
      var R = typeof Reflect === "object" ? Reflect : null;
      var ReflectApply = R && typeof R.apply === "function" ? R.apply : function ReflectApply2(target, receiver, args) {
        return Function.prototype.apply.call(target, receiver, args);
      };
      var ReflectOwnKeys;
      if (R && typeof R.ownKeys === "function") {
        ReflectOwnKeys = R.ownKeys;
      } else if (Object.getOwnPropertySymbols) {
        ReflectOwnKeys = function ReflectOwnKeys2(target) {
          return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
        };
      } else {
        ReflectOwnKeys = function ReflectOwnKeys2(target) {
          return Object.getOwnPropertyNames(target);
        };
      }
      function ProcessEmitWarning(warning) {
        if (console && console.warn) console.warn(warning);
      }
      var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value) {
        return value !== value;
      };
      function EventEmitter2() {
        EventEmitter2.init.call(this);
      }
      module.exports = EventEmitter2;
      module.exports.once = once;
      EventEmitter2.EventEmitter = EventEmitter2;
      EventEmitter2.prototype._events = void 0;
      EventEmitter2.prototype._eventsCount = 0;
      EventEmitter2.prototype._maxListeners = void 0;
      var defaultMaxListeners = 10;
      function checkListener(listener) {
        if (typeof listener !== "function") {
          throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
        }
      }
      Object.defineProperty(EventEmitter2, "defaultMaxListeners", {
        enumerable: true,
        get: function() {
          return defaultMaxListeners;
        },
        set: function(arg) {
          if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) {
            throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + ".");
          }
          defaultMaxListeners = arg;
        }
      });
      EventEmitter2.init = function() {
        if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
        }
        this._maxListeners = this._maxListeners || void 0;
      };
      EventEmitter2.prototype.setMaxListeners = function setMaxListeners(n) {
        if (typeof n !== "number" || n < 0 || NumberIsNaN(n)) {
          throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + ".");
        }
        this._maxListeners = n;
        return this;
      };
      function _getMaxListeners(that) {
        if (that._maxListeners === void 0)
          return EventEmitter2.defaultMaxListeners;
        return that._maxListeners;
      }
      EventEmitter2.prototype.getMaxListeners = function getMaxListeners() {
        return _getMaxListeners(this);
      };
      EventEmitter2.prototype.emit = function emit(type) {
        var args = [];
        for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
        var doError = type === "error";
        var events = this._events;
        if (events !== void 0)
          doError = doError && events.error === void 0;
        else if (!doError)
          return false;
        if (doError) {
          var er;
          if (args.length > 0)
            er = args[0];
          if (er instanceof Error) {
            throw er;
          }
          var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
          err.context = er;
          throw err;
        }
        var handler = events[type];
        if (handler === void 0)
          return false;
        if (typeof handler === "function") {
          ReflectApply(handler, this, args);
        } else {
          var len = handler.length;
          var listeners = arrayClone(handler, len);
          for (var i = 0; i < len; ++i)
            ReflectApply(listeners[i], this, args);
        }
        return true;
      };
      function _addListener(target, type, listener, prepend) {
        var m;
        var events;
        var existing;
        checkListener(listener);
        events = target._events;
        if (events === void 0) {
          events = target._events = /* @__PURE__ */ Object.create(null);
          target._eventsCount = 0;
        } else {
          if (events.newListener !== void 0) {
            target.emit(
              "newListener",
              type,
              listener.listener ? listener.listener : listener
            );
            events = target._events;
          }
          existing = events[type];
        }
        if (existing === void 0) {
          existing = events[type] = listener;
          ++target._eventsCount;
        } else {
          if (typeof existing === "function") {
            existing = events[type] = prepend ? [listener, existing] : [existing, listener];
          } else if (prepend) {
            existing.unshift(listener);
          } else {
            existing.push(listener);
          }
          m = _getMaxListeners(target);
          if (m > 0 && existing.length > m && !existing.warned) {
            existing.warned = true;
            var w = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
            w.name = "MaxListenersExceededWarning";
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            ProcessEmitWarning(w);
          }
        }
        return target;
      }
      EventEmitter2.prototype.addListener = function addListener(type, listener) {
        return _addListener(this, type, listener, false);
      };
      EventEmitter2.prototype.on = EventEmitter2.prototype.addListener;
      EventEmitter2.prototype.prependListener = function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
      };
      function onceWrapper() {
        if (!this.fired) {
          this.target.removeListener(this.type, this.wrapFn);
          this.fired = true;
          if (arguments.length === 0)
            return this.listener.call(this.target);
          return this.listener.apply(this.target, arguments);
        }
      }
      function _onceWrap(target, type, listener) {
        var state2 = { fired: false, wrapFn: void 0, target, type, listener };
        var wrapped = onceWrapper.bind(state2);
        wrapped.listener = listener;
        state2.wrapFn = wrapped;
        return wrapped;
      }
      EventEmitter2.prototype.once = function once2(type, listener) {
        checkListener(listener);
        this.on(type, _onceWrap(this, type, listener));
        return this;
      };
      EventEmitter2.prototype.prependOnceListener = function prependOnceListener(type, listener) {
        checkListener(listener);
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };
      EventEmitter2.prototype.removeListener = function removeListener(type, listener) {
        var list, events, position, i, originalListener;
        checkListener(listener);
        events = this._events;
        if (events === void 0)
          return this;
        list = events[type];
        if (list === void 0)
          return this;
        if (list === listener || list.listener === listener) {
          if (--this._eventsCount === 0)
            this._events = /* @__PURE__ */ Object.create(null);
          else {
            delete events[type];
            if (events.removeListener)
              this.emit("removeListener", type, list.listener || listener);
          }
        } else if (typeof list !== "function") {
          position = -1;
          for (i = list.length - 1; i >= 0; i--) {
            if (list[i] === listener || list[i].listener === listener) {
              originalListener = list[i].listener;
              position = i;
              break;
            }
          }
          if (position < 0)
            return this;
          if (position === 0)
            list.shift();
          else {
            spliceOne(list, position);
          }
          if (list.length === 1)
            events[type] = list[0];
          if (events.removeListener !== void 0)
            this.emit("removeListener", type, originalListener || listener);
        }
        return this;
      };
      EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
      EventEmitter2.prototype.removeAllListeners = function removeAllListeners(type) {
        var listeners, events, i;
        events = this._events;
        if (events === void 0)
          return this;
        if (events.removeListener === void 0) {
          if (arguments.length === 0) {
            this._events = /* @__PURE__ */ Object.create(null);
            this._eventsCount = 0;
          } else if (events[type] !== void 0) {
            if (--this._eventsCount === 0)
              this._events = /* @__PURE__ */ Object.create(null);
            else
              delete events[type];
          }
          return this;
        }
        if (arguments.length === 0) {
          var keys = Object.keys(events);
          var key;
          for (i = 0; i < keys.length; ++i) {
            key = keys[i];
            if (key === "removeListener") continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners("removeListener");
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
          return this;
        }
        listeners = events[type];
        if (typeof listeners === "function") {
          this.removeListener(type, listeners);
        } else if (listeners !== void 0) {
          for (i = listeners.length - 1; i >= 0; i--) {
            this.removeListener(type, listeners[i]);
          }
        }
        return this;
      };
      function _listeners(target, type, unwrap) {
        var events = target._events;
        if (events === void 0)
          return [];
        var evlistener = events[type];
        if (evlistener === void 0)
          return [];
        if (typeof evlistener === "function")
          return unwrap ? [evlistener.listener || evlistener] : [evlistener];
        return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
      }
      EventEmitter2.prototype.listeners = function listeners(type) {
        return _listeners(this, type, true);
      };
      EventEmitter2.prototype.rawListeners = function rawListeners(type) {
        return _listeners(this, type, false);
      };
      EventEmitter2.listenerCount = function(emitter, type) {
        if (typeof emitter.listenerCount === "function") {
          return emitter.listenerCount(type);
        } else {
          return listenerCount.call(emitter, type);
        }
      };
      EventEmitter2.prototype.listenerCount = listenerCount;
      function listenerCount(type) {
        var events = this._events;
        if (events !== void 0) {
          var evlistener = events[type];
          if (typeof evlistener === "function") {
            return 1;
          } else if (evlistener !== void 0) {
            return evlistener.length;
          }
        }
        return 0;
      }
      EventEmitter2.prototype.eventNames = function eventNames() {
        return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
      };
      function arrayClone(arr, n) {
        var copy = new Array(n);
        for (var i = 0; i < n; ++i)
          copy[i] = arr[i];
        return copy;
      }
      function spliceOne(list, index) {
        for (; index + 1 < list.length; index++)
          list[index] = list[index + 1];
        list.pop();
      }
      function unwrapListeners(arr) {
        var ret = new Array(arr.length);
        for (var i = 0; i < ret.length; ++i) {
          ret[i] = arr[i].listener || arr[i];
        }
        return ret;
      }
      function once(emitter, name) {
        return new Promise(function(resolve, reject) {
          function errorListener(err) {
            emitter.removeListener(name, resolver);
            reject(err);
          }
          function resolver() {
            if (typeof emitter.removeListener === "function") {
              emitter.removeListener("error", errorListener);
            }
            resolve([].slice.call(arguments));
          }
          ;
          eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
          if (name !== "error") {
            addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
          }
        });
      }
      function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
        if (typeof emitter.on === "function") {
          eventTargetAgnosticAddListener(emitter, "error", handler, flags);
        }
      }
      function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
        if (typeof emitter.on === "function") {
          if (flags.once) {
            emitter.once(name, listener);
          } else {
            emitter.on(name, listener);
          }
        } else if (typeof emitter.addEventListener === "function") {
          emitter.addEventListener(name, function wrapListener(arg) {
            if (flags.once) {
              emitter.removeEventListener(name, wrapListener);
            }
            listener(arg);
          });
        } else {
          throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
        }
      }
    }
  });

  // node_modules/@owlbear-rodeo/sdk/lib/api/PlayerApi.js
  var __awaiter = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var PlayerApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    get id() {
      if (!this.messageBus.userId) {
        throw Error("Unable to get user ID: not ready");
      }
      return this.messageBus.userId;
    }
    getSelection() {
      return __awaiter(this, void 0, void 0, function* () {
        const { selection } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_SELECTION", {});
        return selection;
      });
    }
    select(items2, replace) {
      return __awaiter(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_PLAYER_SELECT", { items: items2, replace });
      });
    }
    deselect(items2) {
      return __awaiter(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_PLAYER_DESELECT", { items: items2 });
      });
    }
    getName() {
      return __awaiter(this, void 0, void 0, function* () {
        const { name } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_NAME", {});
        return name;
      });
    }
    setName(name) {
      return __awaiter(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_PLAYER_SET_NAME", { name });
      });
    }
    getColor() {
      return __awaiter(this, void 0, void 0, function* () {
        const { color } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_COLOR", {});
        return color;
      });
    }
    setColor(color) {
      return __awaiter(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_PLAYER_SET_COLOR", { color });
      });
    }
    getSyncView() {
      return __awaiter(this, void 0, void 0, function* () {
        const { syncView } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_SYNC_VIEW", {});
        return syncView;
      });
    }
    setSyncView(syncView) {
      return __awaiter(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_PLAYER_SET_SYNC_VIEW", { syncView });
      });
    }
    getId() {
      return __awaiter(this, void 0, void 0, function* () {
        const { id } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_ID", {});
        return id;
      });
    }
    getRole() {
      return __awaiter(this, void 0, void 0, function* () {
        const { role: role2 } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_ROLE", {});
        return role2;
      });
    }
    getMetadata() {
      return __awaiter(this, void 0, void 0, function* () {
        const { metadata } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_METADATA", {});
        return metadata;
      });
    }
    setMetadata(update) {
      return __awaiter(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_PLAYER_SET_METADATA", { update });
      });
    }
    hasPermission(permission) {
      return __awaiter(this, void 0, void 0, function* () {
        const role2 = yield this.getRole();
        if (role2 === "GM") {
          return true;
        }
        const { permissions } = yield this.messageBus.sendAsync("OBR_ROOM_GET_PERMISSIONS", {});
        return permissions.indexOf(permission) > -1;
      });
    }
    getConnectionId() {
      return __awaiter(this, void 0, void 0, function* () {
        const { connectionId } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_CONNECTION_ID", {});
        return connectionId;
      });
    }
    onChange(callback) {
      const handleChange = (data) => {
        callback(data.player);
      };
      this.messageBus.send("OBR_PLAYER_SUBSCRIBE", {});
      this.messageBus.on("OBR_PLAYER_EVENT_CHANGE", handleChange);
      return () => {
        this.messageBus.send("OBR_PLAYER_UNSUBSCRIBE", {});
        this.messageBus.off("OBR_PLAYER_EVENT_CHANGE", handleChange);
      };
    }
  };
  var PlayerApi_default = PlayerApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/ViewportApi.js
  var __awaiter2 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var ViewportApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    reset() {
      return __awaiter2(this, void 0, void 0, function* () {
        const { transform } = yield this.messageBus.sendAsync("OBR_VIEWPORT_RESET", {});
        return transform;
      });
    }
    animateTo(transform) {
      return __awaiter2(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_VIEWPORT_ANIMATE_TO", { transform });
      });
    }
    animateToBounds(bounds) {
      return __awaiter2(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_VIEWPORT_ANIMATE_TO_BOUNDS", {
          bounds
        });
      });
    }
    getPosition() {
      return __awaiter2(this, void 0, void 0, function* () {
        const { position } = yield this.messageBus.sendAsync("OBR_VIEWPORT_GET_POSITION", {});
        return position;
      });
    }
    setPosition(position) {
      return __awaiter2(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_VIEWPORT_SET_POSITION", { position });
      });
    }
    getScale() {
      return __awaiter2(this, void 0, void 0, function* () {
        const { scale } = yield this.messageBus.sendAsync("OBR_VIEWPORT_GET_SCALE", {});
        return scale;
      });
    }
    setScale(scale) {
      return __awaiter2(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_VIEWPORT_SET_SCALE", { scale });
      });
    }
    getWidth() {
      return __awaiter2(this, void 0, void 0, function* () {
        const { width } = yield this.messageBus.sendAsync("OBR_VIEWPORT_GET_WIDTH", {});
        return width;
      });
    }
    getHeight() {
      return __awaiter2(this, void 0, void 0, function* () {
        const { height } = yield this.messageBus.sendAsync("OBR_VIEWPORT_GET_HEIGHT", {});
        return height;
      });
    }
    transformPoint(point) {
      return __awaiter2(this, void 0, void 0, function* () {
        const { point: transformed } = yield this.messageBus.sendAsync("OBR_VIEWPORT_TRANSFORM_POINT", { point });
        return transformed;
      });
    }
    inverseTransformPoint(point) {
      return __awaiter2(this, void 0, void 0, function* () {
        const { point: transformed } = yield this.messageBus.sendAsync("OBR_VIEWPORT_INVERSE_TRANSFORM_POINT", { point });
        return transformed;
      });
    }
  };
  var ViewportApi_default = ViewportApi;

  // node_modules/@owlbear-rodeo/sdk/lib/messages/Message.js
  function isMessage(message) {
    return typeof message.id === "string";
  }

  // node_modules/@owlbear-rodeo/sdk/lib/messages/MessageBus.js
  var import_events = __toESM(require_events());

  // node_modules/uuid/dist/esm-browser/rng.js
  var getRandomValues;
  var rnds8 = new Uint8Array(16);
  function rng() {
    if (!getRandomValues) {
      getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);
      if (!getRandomValues) {
        throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
      }
    }
    return getRandomValues(rnds8);
  }

  // node_modules/uuid/dist/esm-browser/stringify.js
  var byteToHex = [];
  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).slice(1));
  }
  function unsafeStringify(arr, offset = 0) {
    return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
  }

  // node_modules/uuid/dist/esm-browser/native.js
  var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
  var native_default = {
    randomUUID
  };

  // node_modules/uuid/dist/esm-browser/v4.js
  function v4(options, buf, offset) {
    if (native_default.randomUUID && !buf && !options) {
      return native_default.randomUUID();
    }
    options = options || {};
    const rnds = options.random || (options.rng || rng)();
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = rnds[i];
      }
      return buf;
    }
    return unsafeStringify(rnds);
  }
  var v4_default = v4;

  // node_modules/@owlbear-rodeo/sdk/lib/messages/MessageBus.js
  var MessageBus = class extends import_events.EventEmitter {
    constructor(origin, roomId) {
      super();
      this.ready = false;
      this.userId = null;
      this.ref = null;
      this.handleMessage = (event) => {
        const message = event.data;
        if (event.origin === this.targetOrigin && isMessage(message)) {
          if (message.id === "OBR_READY") {
            this.ready = true;
            const data = message.data;
            this.ref = data.ref;
            this.userId = data.userId;
          }
          this.emit(message.id, message.data);
        }
      };
      this.send = (id, data, nonce) => {
        var _a;
        if (!this.ref) {
          throw Error("Unable to send message: not ready");
        }
        (_a = window.parent) === null || _a === void 0 ? void 0 : _a.postMessage({
          id,
          data,
          ref: this.ref,
          nonce
        }, this.targetOrigin);
      };
      this.sendAsync = (id, data, timeout = 5e3) => {
        const nonce = `_${v4_default()}`;
        this.send(id, data, nonce);
        return Promise.race([
          new Promise((resolve, reject) => {
            const self = this;
            function onResponse(value) {
              self.off(`${id}_RESPONSE${nonce}`, onResponse);
              self.off(`${id}_ERROR${nonce}`, onError);
              resolve(value);
            }
            function onError(error) {
              self.off(`${id}_RESPONSE${nonce}`, onResponse);
              self.off(`${id}_ERROR${nonce}`, onError);
              reject(error);
            }
            this.on(`${id}_RESPONSE${nonce}`, onResponse);
            this.on(`${id}_ERROR${nonce}`, onError);
          }),
          ...timeout > 0 ? [
            new Promise((_, reject) => window.setTimeout(() => reject(new Error(`Message ${id} took longer than ${timeout}ms to get a result`)), timeout))
          ] : []
        ]);
      };
      this.roomId = roomId;
      this.targetOrigin = origin;
      window.addEventListener("message", this.handleMessage);
      this.setMaxListeners(100);
    }
    destroy() {
      window.removeEventListener("message", this.handleMessage);
    }
  };
  var MessageBus_default = MessageBus;

  // node_modules/@owlbear-rodeo/sdk/lib/api/NotificationApi.js
  var __awaiter3 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var NotificationApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    show(message, variant) {
      return __awaiter3(this, void 0, void 0, function* () {
        const { id } = yield this.messageBus.sendAsync("OBR_NOTIFICATION_SHOW", { message, variant });
        return id;
      });
    }
    close(id) {
      return __awaiter3(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_NOTIFICATION_CLOSE", { id });
      });
    }
  };
  var NotificationApi_default = NotificationApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/scene/SceneFogApi.js
  var __awaiter4 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var SceneFogApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    getColor() {
      return __awaiter4(this, void 0, void 0, function* () {
        const { color } = yield this.messageBus.sendAsync("OBR_SCENE_FOG_GET_COLOR", {});
        return color;
      });
    }
    setColor(color) {
      return __awaiter4(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_FOG_SET_COLOR", { color });
      });
    }
    getStrokeWidth() {
      return __awaiter4(this, void 0, void 0, function* () {
        const { strokeWidth } = yield this.messageBus.sendAsync("OBR_SCENE_FOG_GET_STROKE_WIDTH", {});
        return strokeWidth;
      });
    }
    setStrokeWidth(strokeWidth) {
      return __awaiter4(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_FOG_SET_STROKE_WIDTH", {
          strokeWidth
        });
      });
    }
    getFilled() {
      return __awaiter4(this, void 0, void 0, function* () {
        const { filled } = yield this.messageBus.sendAsync("OBR_SCENE_FOG_GET_FILLED", {});
        return filled;
      });
    }
    setFilled(filled) {
      return __awaiter4(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_FOG_SET_FILLED", { filled });
      });
    }
    onChange(callback) {
      const handleChange = (data) => {
        callback(data.fog);
      };
      this.messageBus.send("OBR_SCENE_FOG_SUBSCRIBE", {});
      this.messageBus.on("OBR_SCENE_FOG_EVENT_CHANGE", handleChange);
      return () => {
        this.messageBus.send("OBR_SCENE_FOG_UNSUBSCRIBE", {});
        this.messageBus.off("OBR_SCENE_FOG_EVENT_CHANGE", handleChange);
      };
    }
  };
  var SceneFogApi_default = SceneFogApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/scene/SceneGridApi.js
  var __awaiter5 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var SceneGridApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    getDpi() {
      return __awaiter5(this, void 0, void 0, function* () {
        const { dpi } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_DPI", {});
        return dpi;
      });
    }
    getScale() {
      return __awaiter5(this, void 0, void 0, function* () {
        const scale = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_SCALE", {});
        return scale;
      });
    }
    setScale(scale) {
      return __awaiter5(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_GRID_SET_SCALE", { scale });
      });
    }
    getColor() {
      return __awaiter5(this, void 0, void 0, function* () {
        const { color } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_COLOR", {});
        return color;
      });
    }
    setColor(color) {
      return __awaiter5(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_GRID_SET_COLOR", { color });
      });
    }
    getOpacity() {
      return __awaiter5(this, void 0, void 0, function* () {
        const { opacity } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_OPACITY", {});
        return opacity;
      });
    }
    setOpacity(opacity) {
      return __awaiter5(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_GRID_SET_OPACITY", { opacity });
      });
    }
    getType() {
      return __awaiter5(this, void 0, void 0, function* () {
        const { type } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_TYPE", {});
        return type;
      });
    }
    setType(type) {
      return __awaiter5(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_GRID_SET_TYPE", { type });
      });
    }
    getLineType() {
      return __awaiter5(this, void 0, void 0, function* () {
        const { lineType } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_LINE_TYPE", {});
        return lineType;
      });
    }
    setLineType(lineType) {
      return __awaiter5(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_GRID_SET_LINE_TYPE", {
          lineType
        });
      });
    }
    getMeasurement() {
      return __awaiter5(this, void 0, void 0, function* () {
        const { measurement } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_MEASUREMENT", {});
        return measurement;
      });
    }
    setMeasurement(measurement) {
      return __awaiter5(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_GRID_SET_MEASUREMENT", {
          measurement
        });
      });
    }
    getLineWidth() {
      return __awaiter5(this, void 0, void 0, function* () {
        const { lineWidth } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_LINE_WIDTH", {});
        return lineWidth;
      });
    }
    setLineWidth(lineWidth) {
      return __awaiter5(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_GRID_SET_LINE_WIDTH", {
          lineWidth
        });
      });
    }
    snapPosition(position, snappingSensitivity, useCorners, useCenter) {
      return __awaiter5(this, void 0, void 0, function* () {
        const { position: snapped } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_SNAP_POSITION", {
          position,
          snappingSensitivity,
          useCorners,
          useCenter
        });
        return snapped;
      });
    }
    getDistance(from, to) {
      return __awaiter5(this, void 0, void 0, function* () {
        const { distance } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_DISTANCE", { from, to });
        return distance;
      });
    }
    onChange(callback) {
      const handleChange = (data) => {
        callback(data.grid);
      };
      this.messageBus.send("OBR_SCENE_GRID_SUBSCRIBE", {});
      this.messageBus.on("OBR_SCENE_GRID_EVENT_CHANGE", handleChange);
      return () => {
        this.messageBus.send("OBR_SCENE_GRID_UNSUBSCRIBE", {});
        this.messageBus.off("OBR_SCENE_GRID_EVENT_CHANGE", handleChange);
      };
    }
  };
  var SceneGridApi_default = SceneGridApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/scene/SceneHistoryApi.js
  var __awaiter6 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var SceneHistoryApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    undo() {
      return __awaiter6(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_HISTORY_UNDO", {});
      });
    }
    redo() {
      return __awaiter6(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_HISTORY_REDO", {});
      });
    }
    canUndo() {
      return __awaiter6(this, void 0, void 0, function* () {
        const { canUndo } = yield this.messageBus.sendAsync("OBR_SCENE_HISTORY_CAN_UNDO", {});
        return canUndo;
      });
    }
    canRedo() {
      return __awaiter6(this, void 0, void 0, function* () {
        const { canRedo } = yield this.messageBus.sendAsync("OBR_SCENE_HISTORY_CAN_REDO", {});
        return canRedo;
      });
    }
  };
  var SceneHistoryApi_default = SceneHistoryApi;

  // node_modules/immer/dist/immer.mjs
  var NOTHING = Symbol.for("immer-nothing");
  var DRAFTABLE = Symbol.for("immer-draftable");
  var DRAFT_STATE = Symbol.for("immer-state");
  var errors = true ? [
    // All error codes, starting by 0:
    function(plugin) {
      return `The plugin for '${plugin}' has not been loaded into Immer. To enable the plugin, import and call \`enable${plugin}()\` when initializing your application.`;
    },
    function(thing) {
      return `produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '${thing}'`;
    },
    "This object has been frozen and should not be mutated",
    function(data) {
      return "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " + data;
    },
    "An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.",
    "Immer forbids circular references",
    "The first or second argument to `produce` must be a function",
    "The third argument to `produce` must be a function or undefined",
    "First argument to `createDraft` must be a plain object, an array, or an immerable object",
    "First argument to `finishDraft` must be a draft returned by `createDraft`",
    function(thing) {
      return `'current' expects a draft, got: ${thing}`;
    },
    "Object.defineProperty() cannot be used on an Immer draft",
    "Object.setPrototypeOf() cannot be used on an Immer draft",
    "Immer only supports deleting array indices",
    "Immer only supports setting array indices and the 'length' property",
    function(thing) {
      return `'original' expects a draft, got: ${thing}`;
    }
    // Note: if more errors are added, the errorOffset in Patches.ts should be increased
    // See Patches.ts for additional errors
  ] : [];
  function die(error, ...args) {
    if (true) {
      const e = errors[error];
      const msg = typeof e === "function" ? e.apply(null, args) : e;
      throw new Error(`[Immer] ${msg}`);
    }
    throw new Error(
      `[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`
    );
  }
  var getPrototypeOf = Object.getPrototypeOf;
  function isDraft(value) {
    return !!value && !!value[DRAFT_STATE];
  }
  function isDraftable(value) {
    if (!value)
      return false;
    return isPlainObject(value) || Array.isArray(value) || !!value[DRAFTABLE] || !!value.constructor?.[DRAFTABLE] || isMap(value) || isSet(value);
  }
  var objectCtorString = Object.prototype.constructor.toString();
  var cachedCtorStrings = /* @__PURE__ */ new WeakMap();
  function isPlainObject(value) {
    if (!value || typeof value !== "object")
      return false;
    const proto = Object.getPrototypeOf(value);
    if (proto === null || proto === Object.prototype)
      return true;
    const Ctor = Object.hasOwnProperty.call(proto, "constructor") && proto.constructor;
    if (Ctor === Object)
      return true;
    if (typeof Ctor !== "function")
      return false;
    let ctorString = cachedCtorStrings.get(Ctor);
    if (ctorString === void 0) {
      ctorString = Function.toString.call(Ctor);
      cachedCtorStrings.set(Ctor, ctorString);
    }
    return ctorString === objectCtorString;
  }
  function each(obj, iter, strict = true) {
    if (getArchtype(obj) === 0) {
      const keys = strict ? Reflect.ownKeys(obj) : Object.keys(obj);
      keys.forEach((key) => {
        iter(key, obj[key], obj);
      });
    } else {
      obj.forEach((entry, index) => iter(index, entry, obj));
    }
  }
  function getArchtype(thing) {
    const state2 = thing[DRAFT_STATE];
    return state2 ? state2.type_ : Array.isArray(thing) ? 1 : isMap(thing) ? 2 : isSet(thing) ? 3 : 0;
  }
  function has(thing, prop) {
    return getArchtype(thing) === 2 ? thing.has(prop) : Object.prototype.hasOwnProperty.call(thing, prop);
  }
  function get(thing, prop) {
    return getArchtype(thing) === 2 ? thing.get(prop) : thing[prop];
  }
  function set(thing, propOrOldValue, value) {
    const t = getArchtype(thing);
    if (t === 2)
      thing.set(propOrOldValue, value);
    else if (t === 3) {
      thing.add(value);
    } else
      thing[propOrOldValue] = value;
  }
  function is(x, y) {
    if (x === y) {
      return x !== 0 || 1 / x === 1 / y;
    } else {
      return x !== x && y !== y;
    }
  }
  function isMap(target) {
    return target instanceof Map;
  }
  function isSet(target) {
    return target instanceof Set;
  }
  function latest(state2) {
    return state2.copy_ || state2.base_;
  }
  function shallowCopy(base, strict) {
    if (isMap(base)) {
      return new Map(base);
    }
    if (isSet(base)) {
      return new Set(base);
    }
    if (Array.isArray(base))
      return Array.prototype.slice.call(base);
    const isPlain = isPlainObject(base);
    if (strict === true || strict === "class_only" && !isPlain) {
      const descriptors = Object.getOwnPropertyDescriptors(base);
      delete descriptors[DRAFT_STATE];
      let keys = Reflect.ownKeys(descriptors);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const desc = descriptors[key];
        if (desc.writable === false) {
          desc.writable = true;
          desc.configurable = true;
        }
        if (desc.get || desc.set)
          descriptors[key] = {
            configurable: true,
            writable: true,
            // could live with !!desc.set as well here...
            enumerable: desc.enumerable,
            value: base[key]
          };
      }
      return Object.create(getPrototypeOf(base), descriptors);
    } else {
      const proto = getPrototypeOf(base);
      if (proto !== null && isPlain) {
        return { ...base };
      }
      const obj = Object.create(proto);
      return Object.assign(obj, base);
    }
  }
  function freeze(obj, deep = false) {
    if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj))
      return obj;
    if (getArchtype(obj) > 1) {
      Object.defineProperties(obj, {
        set: dontMutateMethodOverride,
        add: dontMutateMethodOverride,
        clear: dontMutateMethodOverride,
        delete: dontMutateMethodOverride
      });
    }
    Object.freeze(obj);
    if (deep)
      Object.values(obj).forEach((value) => freeze(value, true));
    return obj;
  }
  function dontMutateFrozenCollections() {
    die(2);
  }
  var dontMutateMethodOverride = {
    value: dontMutateFrozenCollections
  };
  function isFrozen(obj) {
    if (obj === null || typeof obj !== "object")
      return true;
    return Object.isFrozen(obj);
  }
  var plugins = {};
  function getPlugin(pluginKey) {
    const plugin = plugins[pluginKey];
    if (!plugin) {
      die(0, pluginKey);
    }
    return plugin;
  }
  function loadPlugin(pluginKey, implementation) {
    if (!plugins[pluginKey])
      plugins[pluginKey] = implementation;
  }
  var currentScope;
  function getCurrentScope() {
    return currentScope;
  }
  function createScope(parent_, immer_) {
    return {
      drafts_: [],
      parent_,
      immer_,
      // Whenever the modified draft contains a draft from another scope, we
      // need to prevent auto-freezing so the unowned draft can be finalized.
      canAutoFreeze_: true,
      unfinalizedDrafts_: 0
    };
  }
  function usePatchesInScope(scope, patchListener) {
    if (patchListener) {
      getPlugin("Patches");
      scope.patches_ = [];
      scope.inversePatches_ = [];
      scope.patchListener_ = patchListener;
    }
  }
  function revokeScope(scope) {
    leaveScope(scope);
    scope.drafts_.forEach(revokeDraft);
    scope.drafts_ = null;
  }
  function leaveScope(scope) {
    if (scope === currentScope) {
      currentScope = scope.parent_;
    }
  }
  function enterScope(immer2) {
    return currentScope = createScope(currentScope, immer2);
  }
  function revokeDraft(draft) {
    const state2 = draft[DRAFT_STATE];
    if (state2.type_ === 0 || state2.type_ === 1)
      state2.revoke_();
    else
      state2.revoked_ = true;
  }
  function processResult(result, scope) {
    scope.unfinalizedDrafts_ = scope.drafts_.length;
    const baseDraft = scope.drafts_[0];
    const isReplaced = result !== void 0 && result !== baseDraft;
    if (isReplaced) {
      if (baseDraft[DRAFT_STATE].modified_) {
        revokeScope(scope);
        die(4);
      }
      if (isDraftable(result)) {
        result = finalize(scope, result);
        if (!scope.parent_)
          maybeFreeze(scope, result);
      }
      if (scope.patches_) {
        getPlugin("Patches").generateReplacementPatches_(
          baseDraft[DRAFT_STATE].base_,
          result,
          scope.patches_,
          scope.inversePatches_
        );
      }
    } else {
      result = finalize(scope, baseDraft, []);
    }
    revokeScope(scope);
    if (scope.patches_) {
      scope.patchListener_(scope.patches_, scope.inversePatches_);
    }
    return result !== NOTHING ? result : void 0;
  }
  function finalize(rootScope, value, path) {
    if (isFrozen(value))
      return value;
    const useStrictIteration = rootScope.immer_.shouldUseStrictIteration();
    const state2 = value[DRAFT_STATE];
    if (!state2) {
      each(
        value,
        (key, childValue) => finalizeProperty(rootScope, state2, value, key, childValue, path),
        useStrictIteration
      );
      return value;
    }
    if (state2.scope_ !== rootScope)
      return value;
    if (!state2.modified_) {
      maybeFreeze(rootScope, state2.base_, true);
      return state2.base_;
    }
    if (!state2.finalized_) {
      state2.finalized_ = true;
      state2.scope_.unfinalizedDrafts_--;
      const result = state2.copy_;
      let resultEach = result;
      let isSet2 = false;
      if (state2.type_ === 3) {
        resultEach = new Set(result);
        result.clear();
        isSet2 = true;
      }
      each(
        resultEach,
        (key, childValue) => finalizeProperty(
          rootScope,
          state2,
          result,
          key,
          childValue,
          path,
          isSet2
        ),
        useStrictIteration
      );
      maybeFreeze(rootScope, result, false);
      if (path && rootScope.patches_) {
        getPlugin("Patches").generatePatches_(
          state2,
          path,
          rootScope.patches_,
          rootScope.inversePatches_
        );
      }
    }
    return state2.copy_;
  }
  function finalizeProperty(rootScope, parentState, targetObject, prop, childValue, rootPath, targetIsSet) {
    if (childValue == null) {
      return;
    }
    if (typeof childValue !== "object" && !targetIsSet) {
      return;
    }
    const childIsFrozen = isFrozen(childValue);
    if (childIsFrozen && !targetIsSet) {
      return;
    }
    if (childValue === targetObject)
      die(5);
    if (isDraft(childValue)) {
      const path = rootPath && parentState && parentState.type_ !== 3 && // Set objects are atomic since they have no keys.
      !has(parentState.assigned_, prop) ? rootPath.concat(prop) : void 0;
      const res = finalize(rootScope, childValue, path);
      set(targetObject, prop, res);
      if (isDraft(res)) {
        rootScope.canAutoFreeze_ = false;
      } else
        return;
    } else if (targetIsSet) {
      targetObject.add(childValue);
    }
    if (isDraftable(childValue) && !childIsFrozen) {
      if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
        return;
      }
      if (parentState && parentState.base_ && parentState.base_[prop] === childValue && childIsFrozen) {
        return;
      }
      finalize(rootScope, childValue);
      if ((!parentState || !parentState.scope_.parent_) && typeof prop !== "symbol" && (isMap(targetObject) ? targetObject.has(prop) : Object.prototype.propertyIsEnumerable.call(targetObject, prop)))
        maybeFreeze(rootScope, childValue);
    }
  }
  function maybeFreeze(scope, value, deep = false) {
    if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
      freeze(value, deep);
    }
  }
  function createProxyProxy(base, parent) {
    const isArray = Array.isArray(base);
    const state2 = {
      type_: isArray ? 1 : 0,
      // Track which produce call this is associated with.
      scope_: parent ? parent.scope_ : getCurrentScope(),
      // True for both shallow and deep changes.
      modified_: false,
      // Used during finalization.
      finalized_: false,
      // Track which properties have been assigned (true) or deleted (false).
      assigned_: {},
      // The parent draft state.
      parent_: parent,
      // The base state.
      base_: base,
      // The base proxy.
      draft_: null,
      // set below
      // The base copy with any updated values.
      copy_: null,
      // Called by the `produce` function.
      revoke_: null,
      isManual_: false
    };
    let target = state2;
    let traps = objectTraps;
    if (isArray) {
      target = [state2];
      traps = arrayTraps;
    }
    const { revoke, proxy } = Proxy.revocable(target, traps);
    state2.draft_ = proxy;
    state2.revoke_ = revoke;
    return proxy;
  }
  var objectTraps = {
    get(state2, prop) {
      if (prop === DRAFT_STATE)
        return state2;
      const source = latest(state2);
      if (!has(source, prop)) {
        return readPropFromProto(state2, source, prop);
      }
      const value = source[prop];
      if (state2.finalized_ || !isDraftable(value)) {
        return value;
      }
      if (value === peek(state2.base_, prop)) {
        prepareCopy(state2);
        return state2.copy_[prop] = createProxy(value, state2);
      }
      return value;
    },
    has(state2, prop) {
      return prop in latest(state2);
    },
    ownKeys(state2) {
      return Reflect.ownKeys(latest(state2));
    },
    set(state2, prop, value) {
      const desc = getDescriptorFromProto(latest(state2), prop);
      if (desc?.set) {
        desc.set.call(state2.draft_, value);
        return true;
      }
      if (!state2.modified_) {
        const current2 = peek(latest(state2), prop);
        const currentState = current2?.[DRAFT_STATE];
        if (currentState && currentState.base_ === value) {
          state2.copy_[prop] = value;
          state2.assigned_[prop] = false;
          return true;
        }
        if (is(value, current2) && (value !== void 0 || has(state2.base_, prop)))
          return true;
        prepareCopy(state2);
        markChanged(state2);
      }
      if (state2.copy_[prop] === value && // special case: handle new props with value 'undefined'
      (value !== void 0 || prop in state2.copy_) || // special case: NaN
      Number.isNaN(value) && Number.isNaN(state2.copy_[prop]))
        return true;
      state2.copy_[prop] = value;
      state2.assigned_[prop] = true;
      return true;
    },
    deleteProperty(state2, prop) {
      if (peek(state2.base_, prop) !== void 0 || prop in state2.base_) {
        state2.assigned_[prop] = false;
        prepareCopy(state2);
        markChanged(state2);
      } else {
        delete state2.assigned_[prop];
      }
      if (state2.copy_) {
        delete state2.copy_[prop];
      }
      return true;
    },
    // Note: We never coerce `desc.value` into an Immer draft, because we can't make
    // the same guarantee in ES5 mode.
    getOwnPropertyDescriptor(state2, prop) {
      const owner = latest(state2);
      const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
      if (!desc)
        return desc;
      return {
        writable: true,
        configurable: state2.type_ !== 1 || prop !== "length",
        enumerable: desc.enumerable,
        value: owner[prop]
      };
    },
    defineProperty() {
      die(11);
    },
    getPrototypeOf(state2) {
      return getPrototypeOf(state2.base_);
    },
    setPrototypeOf() {
      die(12);
    }
  };
  var arrayTraps = {};
  each(objectTraps, (key, fn) => {
    arrayTraps[key] = function() {
      arguments[0] = arguments[0][0];
      return fn.apply(this, arguments);
    };
  });
  arrayTraps.deleteProperty = function(state2, prop) {
    if (isNaN(parseInt(prop)))
      die(13);
    return arrayTraps.set.call(this, state2, prop, void 0);
  };
  arrayTraps.set = function(state2, prop, value) {
    if (prop !== "length" && isNaN(parseInt(prop)))
      die(14);
    return objectTraps.set.call(this, state2[0], prop, value, state2[0]);
  };
  function peek(draft, prop) {
    const state2 = draft[DRAFT_STATE];
    const source = state2 ? latest(state2) : draft;
    return source[prop];
  }
  function readPropFromProto(state2, source, prop) {
    const desc = getDescriptorFromProto(source, prop);
    return desc ? `value` in desc ? desc.value : (
      // This is a very special case, if the prop is a getter defined by the
      // prototype, we should invoke it with the draft as context!
      desc.get?.call(state2.draft_)
    ) : void 0;
  }
  function getDescriptorFromProto(source, prop) {
    if (!(prop in source))
      return void 0;
    let proto = getPrototypeOf(source);
    while (proto) {
      const desc = Object.getOwnPropertyDescriptor(proto, prop);
      if (desc)
        return desc;
      proto = getPrototypeOf(proto);
    }
    return void 0;
  }
  function markChanged(state2) {
    if (!state2.modified_) {
      state2.modified_ = true;
      if (state2.parent_) {
        markChanged(state2.parent_);
      }
    }
  }
  function prepareCopy(state2) {
    if (!state2.copy_) {
      state2.copy_ = shallowCopy(
        state2.base_,
        state2.scope_.immer_.useStrictShallowCopy_
      );
    }
  }
  var Immer2 = class {
    constructor(config) {
      this.autoFreeze_ = true;
      this.useStrictShallowCopy_ = false;
      this.useStrictIteration_ = true;
      this.produce = (base, recipe, patchListener) => {
        if (typeof base === "function" && typeof recipe !== "function") {
          const defaultBase = recipe;
          recipe = base;
          const self = this;
          return function curriedProduce(base2 = defaultBase, ...args) {
            return self.produce(base2, (draft) => recipe.call(this, draft, ...args));
          };
        }
        if (typeof recipe !== "function")
          die(6);
        if (patchListener !== void 0 && typeof patchListener !== "function")
          die(7);
        let result;
        if (isDraftable(base)) {
          const scope = enterScope(this);
          const proxy = createProxy(base, void 0);
          let hasError = true;
          try {
            result = recipe(proxy);
            hasError = false;
          } finally {
            if (hasError)
              revokeScope(scope);
            else
              leaveScope(scope);
          }
          usePatchesInScope(scope, patchListener);
          return processResult(result, scope);
        } else if (!base || typeof base !== "object") {
          result = recipe(base);
          if (result === void 0)
            result = base;
          if (result === NOTHING)
            result = void 0;
          if (this.autoFreeze_)
            freeze(result, true);
          if (patchListener) {
            const p = [];
            const ip = [];
            getPlugin("Patches").generateReplacementPatches_(base, result, p, ip);
            patchListener(p, ip);
          }
          return result;
        } else
          die(1, base);
      };
      this.produceWithPatches = (base, recipe) => {
        if (typeof base === "function") {
          return (state2, ...args) => this.produceWithPatches(state2, (draft) => base(draft, ...args));
        }
        let patches, inversePatches;
        const result = this.produce(base, recipe, (p, ip) => {
          patches = p;
          inversePatches = ip;
        });
        return [result, patches, inversePatches];
      };
      if (typeof config?.autoFreeze === "boolean")
        this.setAutoFreeze(config.autoFreeze);
      if (typeof config?.useStrictShallowCopy === "boolean")
        this.setUseStrictShallowCopy(config.useStrictShallowCopy);
      if (typeof config?.useStrictIteration === "boolean")
        this.setUseStrictIteration(config.useStrictIteration);
    }
    createDraft(base) {
      if (!isDraftable(base))
        die(8);
      if (isDraft(base))
        base = current(base);
      const scope = enterScope(this);
      const proxy = createProxy(base, void 0);
      proxy[DRAFT_STATE].isManual_ = true;
      leaveScope(scope);
      return proxy;
    }
    finishDraft(draft, patchListener) {
      const state2 = draft && draft[DRAFT_STATE];
      if (!state2 || !state2.isManual_)
        die(9);
      const { scope_: scope } = state2;
      usePatchesInScope(scope, patchListener);
      return processResult(void 0, scope);
    }
    /**
     * Pass true to automatically freeze all copies created by Immer.
     *
     * By default, auto-freezing is enabled.
     */
    setAutoFreeze(value) {
      this.autoFreeze_ = value;
    }
    /**
     * Pass true to enable strict shallow copy.
     *
     * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
     */
    setUseStrictShallowCopy(value) {
      this.useStrictShallowCopy_ = value;
    }
    /**
     * Pass false to use faster iteration that skips non-enumerable properties
     * but still handles symbols for compatibility.
     *
     * By default, strict iteration is enabled (includes all own properties).
     */
    setUseStrictIteration(value) {
      this.useStrictIteration_ = value;
    }
    shouldUseStrictIteration() {
      return this.useStrictIteration_;
    }
    applyPatches(base, patches) {
      let i;
      for (i = patches.length - 1; i >= 0; i--) {
        const patch = patches[i];
        if (patch.path.length === 0 && patch.op === "replace") {
          base = patch.value;
          break;
        }
      }
      if (i > -1) {
        patches = patches.slice(i + 1);
      }
      const applyPatchesImpl = getPlugin("Patches").applyPatches_;
      if (isDraft(base)) {
        return applyPatchesImpl(base, patches);
      }
      return this.produce(
        base,
        (draft) => applyPatchesImpl(draft, patches)
      );
    }
  };
  function createProxy(value, parent) {
    const draft = isMap(value) ? getPlugin("MapSet").proxyMap_(value, parent) : isSet(value) ? getPlugin("MapSet").proxySet_(value, parent) : createProxyProxy(value, parent);
    const scope = parent ? parent.scope_ : getCurrentScope();
    scope.drafts_.push(draft);
    return draft;
  }
  function current(value) {
    if (!isDraft(value))
      die(10, value);
    return currentImpl(value);
  }
  function currentImpl(value) {
    if (!isDraftable(value) || isFrozen(value))
      return value;
    const state2 = value[DRAFT_STATE];
    let copy;
    let strict = true;
    if (state2) {
      if (!state2.modified_)
        return state2.base_;
      state2.finalized_ = true;
      copy = shallowCopy(value, state2.scope_.immer_.useStrictShallowCopy_);
      strict = state2.scope_.immer_.shouldUseStrictIteration();
    } else {
      copy = shallowCopy(value, true);
    }
    each(
      copy,
      (key, childValue) => {
        set(copy, key, currentImpl(childValue));
      },
      strict
    );
    if (state2) {
      state2.finalized_ = false;
    }
    return copy;
  }
  function enablePatches() {
    const errorOffset = 16;
    if (true) {
      errors.push(
        'Sets cannot have "replace" patches.',
        function(op) {
          return "Unsupported patch operation: " + op;
        },
        function(path) {
          return "Cannot apply patch, path doesn't resolve: " + path;
        },
        "Patching reserved attributes like __proto__, prototype and constructor is not allowed"
      );
    }
    const REPLACE = "replace";
    const ADD = "add";
    const REMOVE = "remove";
    function generatePatches_(state2, basePath, patches, inversePatches) {
      switch (state2.type_) {
        case 0:
        case 2:
          return generatePatchesFromAssigned(
            state2,
            basePath,
            patches,
            inversePatches
          );
        case 1:
          return generateArrayPatches(state2, basePath, patches, inversePatches);
        case 3:
          return generateSetPatches(
            state2,
            basePath,
            patches,
            inversePatches
          );
      }
    }
    function generateArrayPatches(state2, basePath, patches, inversePatches) {
      let { base_, assigned_ } = state2;
      let copy_ = state2.copy_;
      if (copy_.length < base_.length) {
        ;
        [base_, copy_] = [copy_, base_];
        [patches, inversePatches] = [inversePatches, patches];
      }
      for (let i = 0; i < base_.length; i++) {
        if (assigned_[i] && copy_[i] !== base_[i]) {
          const path = basePath.concat([i]);
          patches.push({
            op: REPLACE,
            path,
            // Need to maybe clone it, as it can in fact be the original value
            // due to the base/copy inversion at the start of this function
            value: clonePatchValueIfNeeded(copy_[i])
          });
          inversePatches.push({
            op: REPLACE,
            path,
            value: clonePatchValueIfNeeded(base_[i])
          });
        }
      }
      for (let i = base_.length; i < copy_.length; i++) {
        const path = basePath.concat([i]);
        patches.push({
          op: ADD,
          path,
          // Need to maybe clone it, as it can in fact be the original value
          // due to the base/copy inversion at the start of this function
          value: clonePatchValueIfNeeded(copy_[i])
        });
      }
      for (let i = copy_.length - 1; base_.length <= i; --i) {
        const path = basePath.concat([i]);
        inversePatches.push({
          op: REMOVE,
          path
        });
      }
    }
    function generatePatchesFromAssigned(state2, basePath, patches, inversePatches) {
      const { base_, copy_ } = state2;
      each(state2.assigned_, (key, assignedValue) => {
        const origValue = get(base_, key);
        const value = get(copy_, key);
        const op = !assignedValue ? REMOVE : has(base_, key) ? REPLACE : ADD;
        if (origValue === value && op === REPLACE)
          return;
        const path = basePath.concat(key);
        patches.push(op === REMOVE ? { op, path } : { op, path, value });
        inversePatches.push(
          op === ADD ? { op: REMOVE, path } : op === REMOVE ? { op: ADD, path, value: clonePatchValueIfNeeded(origValue) } : { op: REPLACE, path, value: clonePatchValueIfNeeded(origValue) }
        );
      });
    }
    function generateSetPatches(state2, basePath, patches, inversePatches) {
      let { base_, copy_ } = state2;
      let i = 0;
      base_.forEach((value) => {
        if (!copy_.has(value)) {
          const path = basePath.concat([i]);
          patches.push({
            op: REMOVE,
            path,
            value
          });
          inversePatches.unshift({
            op: ADD,
            path,
            value
          });
        }
        i++;
      });
      i = 0;
      copy_.forEach((value) => {
        if (!base_.has(value)) {
          const path = basePath.concat([i]);
          patches.push({
            op: ADD,
            path,
            value
          });
          inversePatches.unshift({
            op: REMOVE,
            path,
            value
          });
        }
        i++;
      });
    }
    function generateReplacementPatches_(baseValue, replacement, patches, inversePatches) {
      patches.push({
        op: REPLACE,
        path: [],
        value: replacement === NOTHING ? void 0 : replacement
      });
      inversePatches.push({
        op: REPLACE,
        path: [],
        value: baseValue
      });
    }
    function applyPatches_(draft, patches) {
      patches.forEach((patch) => {
        const { path, op } = patch;
        let base = draft;
        for (let i = 0; i < path.length - 1; i++) {
          const parentType = getArchtype(base);
          let p = path[i];
          if (typeof p !== "string" && typeof p !== "number") {
            p = "" + p;
          }
          if ((parentType === 0 || parentType === 1) && (p === "__proto__" || p === "constructor"))
            die(errorOffset + 3);
          if (typeof base === "function" && p === "prototype")
            die(errorOffset + 3);
          base = get(base, p);
          if (typeof base !== "object")
            die(errorOffset + 2, path.join("/"));
        }
        const type = getArchtype(base);
        const value = deepClonePatchValue(patch.value);
        const key = path[path.length - 1];
        switch (op) {
          case REPLACE:
            switch (type) {
              case 2:
                return base.set(key, value);
              case 3:
                die(errorOffset);
              default:
                return base[key] = value;
            }
          case ADD:
            switch (type) {
              case 1:
                return key === "-" ? base.push(value) : base.splice(key, 0, value);
              case 2:
                return base.set(key, value);
              case 3:
                return base.add(value);
              default:
                return base[key] = value;
            }
          case REMOVE:
            switch (type) {
              case 1:
                return base.splice(key, 1);
              case 2:
                return base.delete(key);
              case 3:
                return base.delete(patch.value);
              default:
                return delete base[key];
            }
          default:
            die(errorOffset + 1, op);
        }
      });
      return draft;
    }
    function deepClonePatchValue(obj) {
      if (!isDraftable(obj))
        return obj;
      if (Array.isArray(obj))
        return obj.map(deepClonePatchValue);
      if (isMap(obj))
        return new Map(
          Array.from(obj.entries()).map(([k, v]) => [k, deepClonePatchValue(v)])
        );
      if (isSet(obj))
        return new Set(Array.from(obj).map(deepClonePatchValue));
      const cloned = Object.create(getPrototypeOf(obj));
      for (const key in obj)
        cloned[key] = deepClonePatchValue(obj[key]);
      if (has(obj, DRAFTABLE))
        cloned[DRAFTABLE] = obj[DRAFTABLE];
      return cloned;
    }
    function clonePatchValueIfNeeded(obj) {
      if (isDraft(obj)) {
        return deepClonePatchValue(obj);
      } else
        return obj;
    }
    loadPlugin("Patches", {
      applyPatches_,
      generatePatches_,
      generateReplacementPatches_
    });
  }
  var immer = new Immer2();
  var produce = immer.produce;
  var produceWithPatches = /* @__PURE__ */ immer.produceWithPatches.bind(
    immer
  );

  // node_modules/@owlbear-rodeo/sdk/lib/api/scene/SceneItemsApi.js
  var __awaiter7 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  enablePatches();
  var SceneItemsApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    getItems(filter) {
      return __awaiter7(this, void 0, void 0, function* () {
        if (Array.isArray(filter)) {
          const { items: items2 } = yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_GET_ITEMS", { ids: filter });
          return items2;
        } else if (filter) {
          const { items: items2 } = yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_GET_ALL_ITEMS", {});
          return items2.filter(filter);
        } else {
          const { items: items2 } = yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_GET_ALL_ITEMS", {});
          return items2;
        }
      });
    }
    isItemArray(value) {
      return Array.isArray(value) && value.every((item) => typeof item !== "string");
    }
    updateItems(filterOrItems, update) {
      return __awaiter7(this, void 0, void 0, function* () {
        let items2;
        if (this.isItemArray(filterOrItems)) {
          items2 = filterOrItems;
        } else {
          items2 = yield this.getItems(filterOrItems);
        }
        const [nextState, patches] = produceWithPatches(items2, update);
        const nextUpdates = nextState.map((item) => ({
          id: item.id,
          type: item.type
        }));
        for (const patch of patches) {
          const [index, key] = patch.path;
          if (typeof index === "number" && typeof key === "string") {
            nextUpdates[index][key] = nextState[index][key];
          }
        }
        const updates = nextUpdates.filter(
          // Ensure that there are updates besides the default ID and type
          (update2) => Object.keys(update2).length > 2
        );
        if (updates.length === 0) {
          return;
        }
        yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_UPDATE_ITEMS", {
          updates
        });
      });
    }
    addItems(items2) {
      return __awaiter7(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_ADD_ITEMS", {
          items: items2
        });
      });
    }
    deleteItems(ids) {
      return __awaiter7(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_DELETE_ITEMS", {
          ids
        });
      });
    }
    getItemAttachments(ids) {
      return __awaiter7(this, void 0, void 0, function* () {
        const { items: items2 } = yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_GET_ITEM_ATTACHMENTS", { ids });
        return items2;
      });
    }
    getItemBounds(ids) {
      return __awaiter7(this, void 0, void 0, function* () {
        const { bounds } = yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_GET_ITEM_BOUNDS", { ids });
        return bounds;
      });
    }
    onChange(callback) {
      const handleChange = (data) => {
        callback(data.items);
      };
      this.messageBus.send("OBR_SCENE_ITEMS_SUBSCRIBE", {});
      this.messageBus.on("OBR_SCENE_ITEMS_EVENT_CHANGE", handleChange);
      return () => {
        this.messageBus.send("OBR_SCENE_ITEMS_UNSUBSCRIBE", {});
        this.messageBus.off("OBR_SCENE_ITEMS_EVENT_CHANGE", handleChange);
      };
    }
  };
  var SceneItemsApi_default = SceneItemsApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/scene/SceneLocalApi.js
  var __awaiter8 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  enablePatches();
  var SceneLocalApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    getItems(filter) {
      return __awaiter8(this, void 0, void 0, function* () {
        if (Array.isArray(filter)) {
          const { items: items2 } = yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_GET_ITEMS", { ids: filter });
          return items2;
        } else if (filter) {
          const { items: items2 } = yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_GET_ALL_ITEMS", {});
          return items2.filter(filter);
        } else {
          const { items: items2 } = yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_GET_ALL_ITEMS", {});
          return items2;
        }
      });
    }
    isItemArray(value) {
      return Array.isArray(value) && value.every((item) => typeof item !== "string");
    }
    updateItems(filterOrItems, update, fastUpdate) {
      return __awaiter8(this, void 0, void 0, function* () {
        let items2;
        if (this.isItemArray(filterOrItems)) {
          items2 = filterOrItems;
        } else {
          items2 = yield this.getItems(filterOrItems);
        }
        const [nextState, patches] = produceWithPatches(items2, update);
        const nextUpdates = nextState.map((item) => ({
          id: item.id,
          type: item.type
        }));
        for (const patch of patches) {
          const [index, key] = patch.path;
          if (typeof index === "number" && typeof key === "string") {
            nextUpdates[index][key] = nextState[index][key];
          }
        }
        const updates = nextUpdates.filter(
          // Ensure that there are updates besides the default ID and type
          (update2) => Object.keys(update2).length > 2
        );
        if (updates.length === 0) {
          return;
        }
        yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_UPDATE_ITEMS", {
          updates,
          fastUpdate
        });
      });
    }
    addItems(items2) {
      return __awaiter8(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_ADD_ITEMS", {
          items: items2
        });
      });
    }
    deleteItems(ids) {
      return __awaiter8(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_DELETE_ITEMS", {
          ids
        });
      });
    }
    getItemAttachments(ids) {
      return __awaiter8(this, void 0, void 0, function* () {
        const { items: items2 } = yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_GET_ITEM_ATTACHMENTS", { ids });
        return items2;
      });
    }
    getItemBounds(ids) {
      return __awaiter8(this, void 0, void 0, function* () {
        const { bounds } = yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_GET_ITEM_BOUNDS", { ids });
        return bounds;
      });
    }
    onChange(callback) {
      const handleChange = (data) => {
        callback(data.items);
      };
      this.messageBus.send("OBR_SCENE_LOCAL_SUBSCRIBE", {});
      this.messageBus.on("OBR_SCENE_LOCAL_EVENT_CHANGE", handleChange);
      return () => {
        this.messageBus.send("OBR_SCENE_LOCAL_UNSUBSCRIBE", {});
        this.messageBus.off("OBR_SCENE_LOCAL_EVENT_CHANGE", handleChange);
      };
    }
  };
  var SceneLocalApi_default = SceneLocalApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/scene/SceneApi.js
  var __awaiter9 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var SceneApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
      this.grid = new SceneGridApi_default(messageBus2);
      this.fog = new SceneFogApi_default(messageBus2);
      this.history = new SceneHistoryApi_default(messageBus2);
      this.items = new SceneItemsApi_default(messageBus2);
      this.local = new SceneLocalApi_default(messageBus2);
    }
    isReady() {
      return __awaiter9(this, void 0, void 0, function* () {
        const { ready } = yield this.messageBus.sendAsync("OBR_SCENE_IS_READY", {});
        return ready;
      });
    }
    onReadyChange(callback) {
      const handleChange = (data) => {
        callback(data.ready);
      };
      this.messageBus.send("OBR_SCENE_READY_SUBSCRIBE", {});
      this.messageBus.on("OBR_SCENE_EVENT_READY_CHANGE", handleChange);
      return () => {
        this.messageBus.send("OBR_SCENE_READY_UNSUBSCRIBE", {});
        this.messageBus.off("OBR_SCENE_EVENT_READY_CHANGE", handleChange);
      };
    }
    getMetadata() {
      return __awaiter9(this, void 0, void 0, function* () {
        const { metadata } = yield this.messageBus.sendAsync("OBR_SCENE_GET_METADATA", {});
        return metadata;
      });
    }
    setMetadata(update) {
      return __awaiter9(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_SCENE_SET_METADATA", { update });
      });
    }
    onMetadataChange(callback) {
      const handleChange = (data) => {
        callback(data.metadata);
      };
      this.messageBus.send("OBR_SCENE_METADATA_SUBSCRIBE", {});
      this.messageBus.on("OBR_SCENE_METADATA_EVENT_CHANGE", handleChange);
      return () => {
        this.messageBus.send("OBR_SCENE_METADATA_UNSUBSCRIBE", {});
        this.messageBus.off("OBR_SCENE_METADATA_EVENT_CHANGE", handleChange);
      };
    }
  };
  var SceneApi_default = SceneApi;

  // node_modules/@owlbear-rodeo/sdk/lib/common/normalize.js
  function normalizeUrl(url) {
    return url.startsWith("http") ? url : `${window.location.origin}${url}`;
  }
  function normalizeIconPaths(icons) {
    return icons.map((base) => Object.assign(Object.assign({}, base), { icon: normalizeUrl(base.icon) }));
  }
  function normalizeUrlObject(urlObject) {
    return Object.assign(Object.assign({}, urlObject), { url: normalizeUrl(urlObject.url) });
  }

  // node_modules/@owlbear-rodeo/sdk/lib/api/ContextMenuApi.js
  var __awaiter10 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var ContextMenuApi = class {
    constructor(messageBus2) {
      this.contextMenus = {};
      this.handleClick = (event) => {
        var _a;
        const menu = this.contextMenus[event.id];
        if (menu) {
          (_a = menu.onClick) === null || _a === void 0 ? void 0 : _a.call(menu, event.context, event.elementId);
        }
      };
      this.messageBus = messageBus2;
      messageBus2.on("OBR_CONTEXT_MENU_EVENT_CLICK", this.handleClick);
    }
    create(contextMenu) {
      return __awaiter10(this, void 0, void 0, function* () {
        this.messageBus.sendAsync("OBR_CONTEXT_MENU_CREATE", {
          id: contextMenu.id,
          shortcut: contextMenu.shortcut,
          icons: normalizeIconPaths(contextMenu.icons),
          embed: contextMenu.embed && normalizeUrlObject(contextMenu.embed)
        });
        this.contextMenus[contextMenu.id] = contextMenu;
      });
    }
    remove(id) {
      return __awaiter10(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_CONTEXT_MENU_REMOVE", { id });
        delete this.contextMenus[id];
      });
    }
  };
  var ContextMenuApi_default = ContextMenuApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/ToolApi.js
  var __awaiter11 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var ToolApi = class {
    constructor(messageBus2) {
      this.tools = {};
      this.toolActions = {};
      this.toolModes = {};
      this.handleToolClick = (event) => {
        const tool = this.tools[event.id];
        if (tool) {
          if (tool.onClick) {
            const result = tool.onClick(event.context, event.elementId);
            Promise.resolve(result).then((activate) => {
              if (activate) {
                this.messageBus.send("OBR_TOOL_ACTIVATE", {
                  id: event.id
                });
              }
            });
          } else {
            this.messageBus.send("OBR_TOOL_ACTIVATE", {
              id: event.id
            });
          }
        }
      };
      this.handleToolActionClick = (event) => {
        var _a;
        const action = this.toolActions[event.id];
        if (action) {
          (_a = action.onClick) === null || _a === void 0 ? void 0 : _a.call(action, event.context, event.elementId);
        }
      };
      this.handleToolModeClick = (event) => {
        const mode = this.toolModes[event.id];
        if (mode) {
          if (mode.onClick) {
            const result = mode.onClick(event.context, event.elementId);
            Promise.resolve(result).then((activate) => {
              if (activate) {
                this.messageBus.send("OBR_TOOL_MODE_ACTIVATE", {
                  toolId: event.context.activeTool,
                  modeId: event.id
                });
              }
            });
          } else {
            this.messageBus.send("OBR_TOOL_MODE_ACTIVATE", {
              toolId: event.context.activeTool,
              modeId: event.id
            });
          }
        }
      };
      this.handleToolModeToolClick = (event) => {
        const mode = this.toolModes[event.id];
        if (mode) {
          if (mode.onToolClick) {
            const result = mode.onToolClick(event.context, event.event);
            Promise.resolve(result).then((select) => {
              if (select && event.event.target && !event.event.target.locked) {
                this.messageBus.sendAsync("OBR_PLAYER_SELECT", {
                  items: [event.event.target.id]
                });
              }
            });
          } else {
            if (event.event.target && !event.event.target.locked) {
              this.messageBus.sendAsync("OBR_PLAYER_SELECT", {
                items: [event.event.target.id]
              });
            }
          }
        }
      };
      this.handleToolModeToolDoubleClick = (event) => {
        const mode = this.toolModes[event.id];
        if (mode) {
          if (mode.onToolDoubleClick) {
            const result = mode.onToolDoubleClick(event.context, event.event);
            Promise.resolve(result).then((select) => {
              if (select && event.event.target) {
                this.messageBus.sendAsync("OBR_PLAYER_SELECT", {
                  items: [event.event.target.id]
                });
              }
            });
          } else {
            if (event.event.target) {
              this.messageBus.sendAsync("OBR_PLAYER_SELECT", {
                items: [event.event.target.id]
              });
            }
          }
        }
      };
      this.handleToolModeToolDown = (event) => {
        var _a;
        const mode = this.toolModes[event.id];
        if (mode) {
          (_a = mode.onToolDown) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);
        }
      };
      this.handleToolModeToolMove = (event) => {
        var _a;
        const mode = this.toolModes[event.id];
        if (mode) {
          (_a = mode.onToolMove) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);
        }
      };
      this.handleToolModeToolUp = (event) => {
        var _a;
        const mode = this.toolModes[event.id];
        if (mode) {
          (_a = mode.onToolUp) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);
        }
      };
      this.handleToolModeToolDragStart = (event) => {
        var _a;
        const mode = this.toolModes[event.id];
        if (mode) {
          (_a = mode.onToolDragStart) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);
        }
      };
      this.handleToolModeToolDragMove = (event) => {
        var _a;
        const mode = this.toolModes[event.id];
        if (mode) {
          (_a = mode.onToolDragMove) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);
        }
      };
      this.handleToolModeToolDragEnd = (event) => {
        var _a;
        const mode = this.toolModes[event.id];
        if (mode) {
          (_a = mode.onToolDragEnd) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);
        }
      };
      this.handleToolModeToolDragCancel = (event) => {
        var _a;
        const mode = this.toolModes[event.id];
        if (mode) {
          (_a = mode.onToolDragCancel) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);
        }
      };
      this.handleToolModeKeyDown = (event) => {
        var _a;
        const mode = this.toolModes[event.id];
        if (mode) {
          (_a = mode.onKeyDown) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);
        }
      };
      this.handleToolModeKeyUp = (event) => {
        var _a;
        const mode = this.toolModes[event.id];
        if (mode) {
          (_a = mode.onKeyUp) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);
        }
      };
      this.handleToolModeActivate = (event) => {
        var _a;
        const mode = this.toolModes[event.id];
        if (mode) {
          (_a = mode.onActivate) === null || _a === void 0 ? void 0 : _a.call(mode, event.context);
        }
      };
      this.handleToolModeDeactivate = (event) => {
        var _a;
        const mode = this.toolModes[event.id];
        if (mode) {
          (_a = mode.onDeactivate) === null || _a === void 0 ? void 0 : _a.call(mode, event.context);
        }
      };
      this.messageBus = messageBus2;
      messageBus2.on("OBR_TOOL_EVENT_CLICK", this.handleToolClick);
      messageBus2.on("OBR_TOOL_ACTION_EVENT_CLICK", this.handleToolActionClick);
      messageBus2.on("OBR_TOOL_MODE_EVENT_CLICK", this.handleToolModeClick);
      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_CLICK", this.handleToolModeToolClick);
      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_DOUBLE_CLICK", this.handleToolModeToolDoubleClick);
      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_DOWN", this.handleToolModeToolDown);
      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_MOVE", this.handleToolModeToolMove);
      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_UP", this.handleToolModeToolUp);
      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_DRAG_START", this.handleToolModeToolDragStart);
      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_DRAG_MOVE", this.handleToolModeToolDragMove);
      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_DRAG_END", this.handleToolModeToolDragEnd);
      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_DRAG_CANCEL", this.handleToolModeToolDragCancel);
      messageBus2.on("OBR_TOOL_MODE_EVENT_KEY_DOWN", this.handleToolModeKeyDown);
      messageBus2.on("OBR_TOOL_MODE_EVENT_KEY_UP", this.handleToolModeKeyUp);
      messageBus2.on("OBR_TOOL_MODE_EVENT_ACTIVATE", this.handleToolModeActivate);
      messageBus2.on("OBR_TOOL_MODE_EVENT_DEACTIVATE", this.handleToolModeDeactivate);
    }
    create(tool) {
      return __awaiter11(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_TOOL_CREATE", {
          id: tool.id,
          shortcut: tool.shortcut,
          defaultMode: tool.defaultMode,
          defaultMetadata: tool.defaultMetadata,
          icons: normalizeIconPaths(tool.icons),
          disabled: tool.disabled
        });
        this.tools[tool.id] = tool;
      });
    }
    remove(id) {
      return __awaiter11(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_TOOL_REMOVE", { id });
        delete this.tools[id];
      });
    }
    activateTool(id) {
      return __awaiter11(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_TOOL_ACTIVATE", { id });
      });
    }
    getActiveTool() {
      return __awaiter11(this, void 0, void 0, function* () {
        const { id } = yield this.messageBus.sendAsync("OBR_TOOL_GET_ACTIVE", {});
        return id;
      });
    }
    onToolChange(callback) {
      const handleChange = (data) => {
        callback(data.id);
      };
      this.messageBus.send("OBR_TOOL_ACTIVE_SUBSCRIBE", {});
      this.messageBus.on("OBR_TOOL_ACTIVE_EVENT_CHANGE", handleChange);
      return () => {
        this.messageBus.send("OBR_TOOL_ACTIVE_UNSUBSCRIBE", {});
        this.messageBus.off("OBR_TOOL_ACTIVE_EVENT_CHANGE", handleChange);
      };
    }
    getMetadata(id) {
      return __awaiter11(this, void 0, void 0, function* () {
        const { metadata } = yield this.messageBus.sendAsync("OBR_TOOL_GET_METADATA", { id });
        return metadata;
      });
    }
    setMetadata(toolId, update) {
      return __awaiter11(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_TOOL_SET_METADATA", {
          toolId,
          update
        });
      });
    }
    createAction(action) {
      return __awaiter11(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_TOOL_ACTION_CREATE", {
          id: action.id,
          shortcut: action.shortcut,
          icons: normalizeIconPaths(action.icons),
          disabled: action.disabled
        });
        this.toolActions[action.id] = action;
      });
    }
    removeAction(id) {
      return __awaiter11(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_TOOL_ACTION_REMOVE", { id });
        delete this.tools[id];
      });
    }
    createMode(mode) {
      return __awaiter11(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_TOOL_MODE_CREATE", {
          id: mode.id,
          shortcut: mode.shortcut,
          icons: normalizeIconPaths(mode.icons),
          preventDrag: mode.preventDrag,
          disabled: mode.disabled,
          cursors: mode.cursors
        });
        this.toolModes[mode.id] = mode;
      });
    }
    removeMode(id) {
      return __awaiter11(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_TOOL_MODE_REMOVE", { id });
        delete this.tools[id];
      });
    }
    activateMode(toolId, modeId) {
      return __awaiter11(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_TOOL_MODE_ACTIVATE", {
          toolId,
          modeId
        });
      });
    }
    getActiveToolMode() {
      return __awaiter11(this, void 0, void 0, function* () {
        const { id } = yield this.messageBus.sendAsync("OBR_TOOL_MODE_GET_ACTIVE", {});
        return id;
      });
    }
    onToolModeChange(callback) {
      const handleChange = (data) => {
        callback(data.id);
      };
      this.messageBus.send("OBR_TOOL_MODE_ACTIVE_SUBSCRIBE", {});
      this.messageBus.on("OBR_TOOL_MODE_ACTIVE_EVENT_CHANGE", handleChange);
      return () => {
        this.messageBus.send("OBR_TOOL_MODE_ACTIVE_UNSUBSCRIBE", {});
        this.messageBus.off("OBR_TOOL_MODE_ACTIVE_EVENT_CHANGE", handleChange);
      };
    }
  };
  var ToolApi_default = ToolApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/PopoverApi.js
  var __awaiter12 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var PopoverApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    open(popover) {
      return __awaiter12(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_POPOVER_OPEN", Object.assign({}, normalizeUrlObject(popover)));
      });
    }
    close(id) {
      return __awaiter12(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_POPOVER_CLOSE", { id });
      });
    }
    getWidth(id) {
      return __awaiter12(this, void 0, void 0, function* () {
        const { width } = yield this.messageBus.sendAsync("OBR_POPOVER_GET_WIDTH", { id });
        return width;
      });
    }
    setWidth(id, width) {
      return __awaiter12(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_POPOVER_SET_WIDTH", { id, width });
      });
    }
    getHeight(id) {
      return __awaiter12(this, void 0, void 0, function* () {
        const { height } = yield this.messageBus.sendAsync("OBR_POPOVER_GET_HEIGHT", { id });
        return height;
      });
    }
    setHeight(id, height) {
      return __awaiter12(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_POPOVER_SET_HEIGHT", { id, height });
      });
    }
  };
  var PopoverApi_default = PopoverApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/ModalApi.js
  var __awaiter13 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var ModalApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    open(modal) {
      return __awaiter13(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_MODAL_OPEN", Object.assign({}, normalizeUrlObject(modal)));
      });
    }
    close(id) {
      return __awaiter13(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_MODAL_CLOSE", { id });
      });
    }
  };
  var ModalApi_default = ModalApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/ActionApi.js
  var __awaiter14 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var ActionApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    getWidth() {
      return __awaiter14(this, void 0, void 0, function* () {
        const { width } = yield this.messageBus.sendAsync("OBR_ACTION_GET_WIDTH", {});
        return width;
      });
    }
    setWidth(width) {
      return __awaiter14(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_ACTION_SET_WIDTH", { width });
      });
    }
    getHeight() {
      return __awaiter14(this, void 0, void 0, function* () {
        const { height } = yield this.messageBus.sendAsync("OBR_ACTION_GET_HEIGHT", {});
        return height;
      });
    }
    setHeight(height) {
      return __awaiter14(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_ACTION_SET_HEIGHT", { height });
      });
    }
    getBadgeText() {
      return __awaiter14(this, void 0, void 0, function* () {
        const { badgeText } = yield this.messageBus.sendAsync("OBR_ACTION_GET_BADGE_TEXT", {});
        return badgeText;
      });
    }
    setBadgeText(badgeText) {
      return __awaiter14(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_ACTION_SET_BADGE_TEXT", { badgeText });
      });
    }
    getBadgeBackgroundColor() {
      return __awaiter14(this, void 0, void 0, function* () {
        const { badgeBackgroundColor } = yield this.messageBus.sendAsync("OBR_ACTION_GET_BADGE_BACKGROUND_COLOR", {});
        return badgeBackgroundColor;
      });
    }
    setBadgeBackgroundColor(badgeBackgroundColor) {
      return __awaiter14(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_ACTION_SET_BADGE_BACKGROUND_COLOR", {
          badgeBackgroundColor
        });
      });
    }
    getIcon() {
      return __awaiter14(this, void 0, void 0, function* () {
        const { icon } = yield this.messageBus.sendAsync("OBR_ACTION_GET_ICON", {});
        return icon;
      });
    }
    setIcon(icon) {
      return __awaiter14(this, void 0, void 0, function* () {
        const data = normalizeIconPaths([{ icon }]);
        yield this.messageBus.sendAsync("OBR_ACTION_SET_ICON", {
          icon: data[0].icon
        });
      });
    }
    getTitle() {
      return __awaiter14(this, void 0, void 0, function* () {
        const { title } = yield this.messageBus.sendAsync("OBR_ACTION_GET_TITLE", {});
        return title;
      });
    }
    setTitle(title) {
      return __awaiter14(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_ACTION_SET_TITLE", { title });
      });
    }
    isOpen() {
      return __awaiter14(this, void 0, void 0, function* () {
        const { isOpen } = yield this.messageBus.sendAsync("OBR_ACTION_GET_IS_OPEN", {});
        return isOpen;
      });
    }
    open() {
      return __awaiter14(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_ACTION_OPEN", {});
      });
    }
    close() {
      return __awaiter14(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_ACTION_CLOSE", {});
      });
    }
    onOpenChange(callback) {
      const handleChange = (data) => {
        callback(data.isOpen);
      };
      this.messageBus.send("OBR_ACTION_IS_OPEN_SUBSCRIBE", {});
      this.messageBus.on("OBR_ACTION_IS_OPEN_EVENT_CHANGE", handleChange);
      return () => {
        this.messageBus.send("OBR_IS_OPEN_ACTION_UNSUBSCRIBE", {});
        this.messageBus.off("OBR_ACTION_IS_OPEN_EVENT_CHANGE", handleChange);
      };
    }
  };
  var ActionApi_default = ActionApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/InteractionApi.js
  var __awaiter15 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  enablePatches();
  var InteractionApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    startItemInteraction(baseState) {
      return __awaiter15(this, void 0, void 0, function* () {
        const { id } = yield this.messageBus.sendAsync("OBR_INTERACTION_START_ITEM_INTERACTION", { baseState });
        let prev = baseState;
        const dispatcher = (update) => {
          const [next, patches] = produceWithPatches(prev, update);
          prev = next;
          this.messageBus.send("OBR_INTERACTION_UPDATE_ITEM_INTERACTION", {
            id,
            patches
          });
          return next;
        };
        const stop = () => {
          this.messageBus.send("OBR_INTERACTION_STOP_ITEM_INTERACTION", { id });
        };
        return [dispatcher, stop];
      });
    }
  };
  var InteractionApi_default = InteractionApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/PartyApi.js
  var __awaiter16 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var PartyApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    getPlayers() {
      return __awaiter16(this, void 0, void 0, function* () {
        const { players } = yield this.messageBus.sendAsync("OBR_PARTY_GET_PLAYERS", {});
        return players;
      });
    }
    onChange(callback) {
      const handleChange = (data) => {
        callback(data.players);
      };
      this.messageBus.send("OBR_PARTY_SUBSCRIBE", {});
      this.messageBus.on("OBR_PARTY_EVENT_CHANGE", handleChange);
      return () => {
        this.messageBus.send("OBR_PARTY_UNSUBSCRIBE", {});
        this.messageBus.off("OBR_PARTY_EVENT_CHANGE", handleChange);
      };
    }
  };
  var PartyApi_default = PartyApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/RoomApi.js
  var __awaiter17 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var RoomApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    get id() {
      return this.messageBus.roomId;
    }
    getPermissions() {
      return __awaiter17(this, void 0, void 0, function* () {
        const { permissions } = yield this.messageBus.sendAsync("OBR_ROOM_GET_PERMISSIONS", {});
        return permissions;
      });
    }
    getMetadata() {
      return __awaiter17(this, void 0, void 0, function* () {
        const { metadata } = yield this.messageBus.sendAsync("OBR_ROOM_GET_METADATA", {});
        return metadata;
      });
    }
    setMetadata(update) {
      return __awaiter17(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_ROOM_SET_METADATA", { update });
      });
    }
    onMetadataChange(callback) {
      const handleChange = (data) => {
        callback(data.metadata);
      };
      this.messageBus.send("OBR_ROOM_METADATA_SUBSCRIBE", {});
      this.messageBus.on("OBR_ROOM_METADATA_EVENT_CHANGE", handleChange);
      return () => {
        this.messageBus.send("OBR_METADATA_ROOM_UNSUBSCRIBE", {});
        this.messageBus.off("OBR_ROOM_METADATA_EVENT_CHANGE", handleChange);
      };
    }
    onPermissionsChange(callback) {
      const handleChange = (data) => {
        callback(data.permissions);
      };
      this.messageBus.send("OBR_ROOM_PERMISSIONS_SUBSCRIBE", {});
      this.messageBus.on("OBR_ROOM_PERMISSIONS_EVENT_CHANGE", handleChange);
      return () => {
        this.messageBus.send("OBR_PERMISSIONS_ROOM_UNSUBSCRIBE", {});
        this.messageBus.off("OBR_ROOM_PERMISSIONS_EVENT_CHANGE", handleChange);
      };
    }
  };
  var RoomApi_default = RoomApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/ThemeApi.js
  var __awaiter18 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var ThemeApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    getTheme() {
      return __awaiter18(this, void 0, void 0, function* () {
        const { theme } = yield this.messageBus.sendAsync("OBR_THEME_GET_THEME", {});
        return theme;
      });
    }
    onChange(callback) {
      const handleChange = (data) => {
        callback(data.theme);
      };
      this.messageBus.send("OBR_THEME_SUBSCRIBE", {});
      this.messageBus.on("OBR_THEME_EVENT_CHANGE", handleChange);
      return () => {
        this.messageBus.send("OBR_THEME_UNSUBSCRIBE", {});
        this.messageBus.off("OBR_THEME_EVENT_CHANGE", handleChange);
      };
    }
  };
  var ThemeApi_default = ThemeApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/AssetsApi.js
  var __awaiter19 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var AssetsApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    uploadImages(images, typeHint) {
      return __awaiter19(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_ASSETS_UPLOAD_IMAGES", {
          images,
          typeHint
        });
      });
    }
    uploadScenes(scenes, disableShowScenes) {
      return __awaiter19(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_ASSETS_UPLOAD_SCENES", {
          scenes,
          disableShowScenes
        });
      });
    }
    downloadImages(multiple, defaultSearch, typeHint) {
      return __awaiter19(this, void 0, void 0, function* () {
        const { images } = yield this.messageBus.sendAsync("OBR_ASSETS_DOWNLOAD_IMAGES", { multiple, defaultSearch, typeHint }, -1);
        return images;
      });
    }
    downloadScenes(multiple, defaultSearch) {
      return __awaiter19(this, void 0, void 0, function* () {
        const { scenes } = yield this.messageBus.sendAsync("OBR_ASSETS_DOWNLOAD_SCENES", { multiple, defaultSearch }, -1);
        return scenes;
      });
    }
  };
  var AssetsApi_default = AssetsApi;

  // node_modules/@owlbear-rodeo/sdk/lib/api/BroadcastApi.js
  var __awaiter20 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step2(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step2(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step2(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step2((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var BroadcastApi = class {
    constructor(messageBus2) {
      this.messageBus = messageBus2;
    }
    sendMessage(channel2, data, options) {
      return __awaiter20(this, void 0, void 0, function* () {
        yield this.messageBus.sendAsync("OBR_BROADCAST_SEND_MESSAGE", {
          channel: channel2,
          data,
          options
        });
      });
    }
    onMessage(channel2, callback) {
      this.messageBus.send("OBR_BROADCAST_SUBSCRIBE", { channel: channel2 });
      this.messageBus.on(`OBR_BROADCAST_MESSAGE_${channel2}`, callback);
      return () => {
        this.messageBus.send("OBR_BROADCAST_UNSUBSCRIBE", { channel: channel2 });
        this.messageBus.off(`OBR_BROADCAST_MESSAGE_${channel2}`, callback);
      };
    }
  };
  var BroadcastApi_default = BroadcastApi;

  // node_modules/@owlbear-rodeo/sdk/lib/builders/GenericItemBuilder.js
  var GenericItemBuilder = class {
    constructor(player) {
      this._item = {
        createdUserId: player.id,
        id: v4_default(),
        name: "Item",
        zIndex: Date.now(),
        lastModified: (/* @__PURE__ */ new Date()).toISOString(),
        lastModifiedUserId: player.id,
        locked: false,
        metadata: {},
        position: { x: 0, y: 0 },
        rotation: 0,
        scale: { x: 1, y: 1 },
        type: "ITEM",
        visible: true,
        layer: "POPOVER"
      };
    }
    createdUserId(createdUserId) {
      this._item.createdUserId = createdUserId;
      return this.self();
    }
    id(id) {
      this._item.id = id;
      return this.self();
    }
    name(name) {
      this._item.name = name;
      return this.self();
    }
    description(description) {
      this._item.description = description;
      return this.self();
    }
    lastModified(lastModified) {
      this._item.lastModified = lastModified;
      return this.self();
    }
    zIndex(zIndex) {
      this._item.zIndex = zIndex;
      return this.self();
    }
    lastModifiedUserId(lastModifiedUserId) {
      this._item.lastModifiedUserId = lastModifiedUserId;
      return this.self();
    }
    locked(locked) {
      this._item.locked = locked;
      return this.self();
    }
    metadata(metadata) {
      this._item.metadata = metadata;
      return this.self();
    }
    position(position) {
      this._item.position = position;
      return this.self();
    }
    rotation(rotation) {
      this._item.rotation = rotation;
      return this.self();
    }
    scale(scale) {
      this._item.scale = scale;
      return this.self();
    }
    visible(visible) {
      this._item.visible = visible;
      return this.self();
    }
    attachedTo(attachedTo) {
      this._item.attachedTo = attachedTo;
      return this.self();
    }
    layer(layer) {
      this._item.layer = layer;
      return this.self();
    }
    disableHit(disable) {
      this._item.disableHit = disable;
      return this.self();
    }
    disableAutoZIndex(disable) {
      this._item.disableAutoZIndex = disable;
      return this.self();
    }
    disableAttachmentBehavior(disable) {
      this._item.disableAttachmentBehavior = disable;
      return this.self();
    }
    self() {
      return this;
    }
  };

  // node_modules/@owlbear-rodeo/sdk/lib/builders/ImageBuilder.js
  var ImageBuilder = class extends GenericItemBuilder {
    constructor(player, image, grid) {
      super(player);
      this._image = image;
      this._grid = grid;
      this._item.name = "Image";
      this._text = {
        richText: [
          {
            type: "paragraph",
            children: [{ text: "" }]
          }
        ],
        plainText: "",
        style: {
          padding: 8,
          fontFamily: "Roboto",
          fontSize: 24,
          fontWeight: 400,
          textAlign: "CENTER",
          textAlignVertical: "BOTTOM",
          fillColor: "white",
          fillOpacity: 1,
          strokeColor: "white",
          strokeOpacity: 1,
          strokeWidth: 0,
          lineHeight: 1.5
        },
        type: "PLAIN",
        width: "AUTO",
        height: "AUTO"
      };
      this._textItemType = "LABEL";
    }
    text(text) {
      this._text = text;
      return this.self();
    }
    textItemType(textItemType) {
      this._textItemType = textItemType;
      return this.self();
    }
    textWidth(width) {
      this._text.width = width;
      return this.self();
    }
    textHeight(height) {
      this._text.height = height;
      return this.self();
    }
    richText(richText) {
      this._text.richText = richText;
      return this.self();
    }
    plainText(plainText2) {
      this._text.plainText = plainText2;
      return this.self();
    }
    textType(textType) {
      this._text.type = textType;
      return this.self();
    }
    textPadding(padding) {
      this._text.style.padding = padding;
      return this.self();
    }
    fontFamily(fontFamily) {
      this._text.style.fontFamily = fontFamily;
      return this.self();
    }
    fontSize(fontSize) {
      this._text.style.fontSize = fontSize;
      return this.self();
    }
    fontWeight(fontWeight) {
      this._text.style.fontWeight = fontWeight;
      return this.self();
    }
    textAlign(textAlign) {
      this._text.style.textAlign = textAlign;
      return this.self();
    }
    textAlignVertical(textAlignVertical) {
      this._text.style.textAlignVertical = textAlignVertical;
      return this.self();
    }
    textFillColor(fillColor) {
      this._text.style.fillColor = fillColor;
      return this.self();
    }
    textFillOpacity(fillOpacity) {
      this._text.style.fillOpacity = fillOpacity;
      return this.self();
    }
    textStrokeColor(strokeColor) {
      this._text.style.strokeColor = strokeColor;
      return this.self();
    }
    textStrokeOpacity(strokeOpacity) {
      this._text.style.strokeOpacity = strokeOpacity;
      return this.self();
    }
    textStrokeWidth(strokeWidth) {
      this._text.style.strokeWidth = strokeWidth;
      return this.self();
    }
    textLineHeight(lineHeight) {
      this._text.style.lineHeight = lineHeight;
      return this.self();
    }
    build() {
      return Object.assign(Object.assign({}, this._item), { type: "IMAGE", image: this._image, grid: this._grid, text: this._text, textItemType: this._textItemType });
    }
  };

  // node_modules/js-base64/base64.mjs
  var _TD = typeof TextDecoder === "function" ? new TextDecoder("utf-8", { ignoreBOM: true }) : void 0;
  var _TE = typeof TextEncoder === "function" ? new TextEncoder() : void 0;
  var b64ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  var b64chs = Array.prototype.slice.call(b64ch);
  var b64tab = ((a) => {
    let tab = {};
    a.forEach((c, i) => tab[c] = i);
    return tab;
  })(b64chs);
  var b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
  var _fromCC = String.fromCharCode.bind(String);
  var _tidyB64 = (s) => s.replace(/[^A-Za-z0-9\+\/]/g, "");
  var btoaPolyfill = (bin) => {
    let u32, c0, c1, c2, asc = "";
    const pad = bin.length % 3;
    for (let i = 0; i < bin.length; ) {
      if ((c0 = bin.charCodeAt(i++)) > 255 || (c1 = bin.charCodeAt(i++)) > 255 || (c2 = bin.charCodeAt(i++)) > 255)
        throw new TypeError("invalid character found");
      u32 = c0 << 16 | c1 << 8 | c2;
      asc += b64chs[u32 >> 18 & 63] + b64chs[u32 >> 12 & 63] + b64chs[u32 >> 6 & 63] + b64chs[u32 & 63];
    }
    return pad ? asc.slice(0, pad - 3) + "===".substring(pad) : asc;
  };
  var _btoa = typeof btoa === "function" ? (bin) => btoa(bin) : btoaPolyfill;
  var _fromUint8Array = typeof Uint8Array.prototype.toBase64 === "function" ? Function.prototype.call.bind(Uint8Array.prototype.toBase64) : (u8a) => {
    const maxargs = 4096;
    let strs = [];
    for (let i = 0, l = u8a.length; i < l; i += maxargs) {
      strs.push(_fromCC.apply(null, u8a.subarray(i, i + maxargs)));
    }
    return _btoa(strs.join(""));
  };
  var re_btou = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g;
  var cb_btou = (cccc) => {
    switch (cccc.length) {
      case 4:
        var cp = (7 & cccc.charCodeAt(0)) << 18 | (63 & cccc.charCodeAt(1)) << 12 | (63 & cccc.charCodeAt(2)) << 6 | 63 & cccc.charCodeAt(3), offset = cp - 65536;
        return _fromCC((offset >>> 10) + 55296) + _fromCC((offset & 1023) + 56320);
      case 3:
        return _fromCC((15 & cccc.charCodeAt(0)) << 12 | (63 & cccc.charCodeAt(1)) << 6 | 63 & cccc.charCodeAt(2));
      default:
        return _fromCC((31 & cccc.charCodeAt(0)) << 6 | 63 & cccc.charCodeAt(1));
    }
  };
  var btou = (b) => b.replace(re_btou, cb_btou);
  var atobPolyfill = (asc) => {
    asc = asc.replace(/\s+/g, "");
    if (!b64re.test(asc))
      throw new TypeError("malformed base64.");
    asc += "==".slice(2 - (asc.length & 3));
    let u24, r1, r2;
    let binArray = [];
    for (let i = 0; i < asc.length; ) {
      u24 = b64tab[asc.charAt(i++)] << 18 | b64tab[asc.charAt(i++)] << 12 | (r1 = b64tab[asc.charAt(i++)]) << 6 | (r2 = b64tab[asc.charAt(i++)]);
      if (r1 === 64) {
        binArray.push(_fromCC(u24 >> 16 & 255));
      } else if (r2 === 64) {
        binArray.push(_fromCC(u24 >> 16 & 255, u24 >> 8 & 255));
      } else {
        binArray.push(_fromCC(u24 >> 16 & 255, u24 >> 8 & 255, u24 & 255));
      }
    }
    return binArray.join("");
  };
  var _atob = typeof atob === "function" ? (asc) => atob(_tidyB64(asc)) : atobPolyfill;
  var _toUint8Array = typeof Uint8Array.fromBase64 === "function" ? (a) => Uint8Array.fromBase64(a) : (a) => {
    const bin = _atob(a), l = bin.length, u8a = new Uint8Array(l);
    for (let i = 0; i < l; i++)
      u8a[i] = bin.charCodeAt(i);
    return u8a;
  };
  var _decode = _TD ? (a) => _TD.decode(_toUint8Array(a)) : (a) => btou(_atob(a));
  var _unURI = (a) => _tidyB64(a.replace(/[-_]/g, (m0) => m0 == "-" ? "+" : "/"));
  var decode = (src) => _decode(_unURI(src));

  // node_modules/@owlbear-rodeo/sdk/lib/common/getDetails.js
  function getDetails() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const ref = urlSearchParams.get("obrref");
    let origin = "";
    let roomId = "";
    if (ref) {
      const decodedRef = decode(ref);
      const parts = decodedRef.split(" ");
      if (parts.length === 2) {
        origin = parts[0];
        roomId = parts[1];
      }
    }
    return { origin, roomId };
  }

  // node_modules/@owlbear-rodeo/sdk/lib/types/items/Image.js
  function isImage(item) {
    return item.type === "IMAGE";
  }

  // node_modules/@owlbear-rodeo/sdk/lib/types/items/Path.js
  var Command;
  (function(Command2) {
    Command2[Command2["MOVE"] = 0] = "MOVE";
    Command2[Command2["LINE"] = 1] = "LINE";
    Command2[Command2["QUAD"] = 2] = "QUAD";
    Command2[Command2["CONIC"] = 3] = "CONIC";
    Command2[Command2["CUBIC"] = 4] = "CUBIC";
    Command2[Command2["CLOSE"] = 5] = "CLOSE";
  })(Command || (Command = {}));

  // node_modules/@owlbear-rodeo/sdk/lib/index.js
  var details = getDetails();
  var messageBus = new MessageBus_default(details.origin, details.roomId);
  var viewportApi = new ViewportApi_default(messageBus);
  var playerApi = new PlayerApi_default(messageBus);
  var partyApi = new PartyApi_default(messageBus);
  var notificationApi = new NotificationApi_default(messageBus);
  var sceneApi = new SceneApi_default(messageBus);
  var contextMenuApi = new ContextMenuApi_default(messageBus);
  var toolApi = new ToolApi_default(messageBus);
  var popoverApi = new PopoverApi_default(messageBus);
  var modalApi = new ModalApi_default(messageBus);
  var actionApi = new ActionApi_default(messageBus);
  var interactionApi = new InteractionApi_default(messageBus);
  var roomApi = new RoomApi_default(messageBus);
  var themeApi = new ThemeApi_default(messageBus);
  var assetsApi = new AssetsApi_default(messageBus);
  var broadcastApi = new BroadcastApi_default(messageBus);
  var OBR = {
    onReady: (callback) => {
      if (messageBus.ready) {
        callback();
      } else {
        messageBus.once("OBR_READY", () => callback());
      }
    },
    get isReady() {
      return messageBus.ready;
    },
    viewport: viewportApi,
    player: playerApi,
    party: partyApi,
    notification: notificationApi,
    scene: sceneApi,
    contextMenu: contextMenuApi,
    tool: toolApi,
    popover: popoverApi,
    modal: modalApi,
    action: actionApi,
    interaction: interactionApi,
    room: roomApi,
    theme: themeApi,
    assets: assetsApi,
    broadcast: broadcastApi,
    /** True if the current site is embedded in an instance of Owlbear Rodeo */
    isAvailable: Boolean(details.origin)
  };
  function buildImage(image, grid) {
    return new ImageBuilder(playerApi, image, grid);
  }
  var lib_default = OBR;

  // src/shared/names.ts
  function matchKey(name) {
    return name.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  function stripTokenSuffix(name) {
    return name.trim().replace(/\s+(?:#?\d+|\(\d+\)|[A-Z]\d*)$/, "").trim();
  }
  function nameCandidates(token) {
    const out = [];
    for (const raw of [token.label, token.name]) {
      const s = (raw ?? "").trim();
      if (!s) continue;
      out.push(s);
      const stripped = stripTokenSuffix(s);
      if (stripped && stripped !== s) out.push(stripped);
    }
    return [...new Set(out)];
  }

  // src/shared/party.ts
  function matchPicks(picks, members) {
    const matched = /* @__PURE__ */ new Map();
    const used = /* @__PURE__ */ new Set();
    const keysOf = (p) => [p.name, p.label ?? ""].map(matchKey).filter(Boolean);
    for (const member of members) {
      const key = matchKey(member);
      const i = picks.findIndex((p, idx) => !used.has(idx) && keysOf(p).includes(key));
      if (i !== -1) {
        matched.set(member, i);
        used.add(i);
      }
    }
    for (const member of members) {
      if (matched.has(member)) continue;
      const key = matchKey(member);
      const candidates = picks.map((p, idx) => ({ idx, keys: keysOf(p) })).filter(({ idx, keys }) => !used.has(idx) && keys.some((k) => k.startsWith(key) || key.startsWith(k)));
      if (candidates.length === 1) {
        matched.set(member, candidates[0].idx);
        used.add(candidates[0].idx);
      }
    }
    const unmatched = picks.map((_, i) => i).filter((i) => !used.has(i));
    return { matched, unmatched };
  }
  function rowPositions(center, count, spacing) {
    return Array.from({ length: count }, (_, i) => ({ x: center.x + (i - (count - 1) / 2) * spacing, y: center.y }));
  }

  // src/shared/hp.ts
  function parseHpInput(input) {
    const s = input.trim().toLowerCase().replace(/\s+/g, "");
    if (!s) return null;
    let m = /^(?:max|m)=?(\d+)$/.exec(s);
    if (m) return { kind: "max", amount: Number(m[1]) };
    m = /^=(-?\d+)$/.exec(s);
    if (m) return { kind: "set", amount: Number(m[1]) };
    m = /^\+(\d+)$/.exec(s);
    if (m) return { kind: "heal", amount: Number(m[1]) };
    m = /^-?(\d+)$/.exec(s);
    if (m) return { kind: "damage", amount: Number(m[1]) };
    return null;
  }
  function applyHp(state2, op) {
    switch (op.kind) {
      case "damage":
        return { ...state2, hp: state2.hp - op.amount };
      case "heal":
        return { ...state2, hp: Math.min(state2.maxHp, Math.max(state2.hp, 0) + op.amount) };
      case "set":
        return { ...state2, hp: op.amount };
      case "max": {
        const taken = state2.maxHp - state2.hp;
        const maxHp = Math.max(1, op.amount);
        return { hp: maxHp - taken, maxHp };
      }
    }
  }
  function hpBand(state2) {
    if (state2.hp <= 0) return "down";
    if (state2.hp <= state2.maxHp / 2) return "bloodied";
    return "healthy";
  }

  // src/shared/turns.ts
  var EMPTY_COMBAT = { round: 0, turn: null, party: null, members: [], init: {}, held: [] };
  var monsterId = (creature) => `m:${matchKey(creature)}`;
  var tokenEntryId = (tokenId) => `t:${tokenId}`;
  var pcId = (name) => `p:${matchKey(name)}`;
  function monsterName(creature, n, siblings) {
    return siblings > 1 && n ? `${creature} ${n}` : creature;
  }
  function buildEntries(monsters, pcTokens, state2) {
    const byId = /* @__PURE__ */ new Map();
    const held = new Set(state2.held);
    const initOf = (...ids) => {
      for (const id of ids) if (typeof state2.init[id] === "number") return state2.init[id];
      return null;
    };
    const make = (id, kind, name, mod, group = id) => ({
      id,
      kind,
      name,
      group,
      mod,
      // Monsters fall back to their group's roll (how 0.2.0 stored it).
      init: initOf(id, group),
      held: held.has(id) || held.has(group),
      down: false,
      tokens: []
    });
    const siblings = /* @__PURE__ */ new Map();
    for (const t of monsters) siblings.set(monsterId(t.creature), (siblings.get(monsterId(t.creature)) ?? 0) + 1);
    for (const t of monsters) {
      const group = monsterId(t.creature);
      const id = tokenEntryId(t.id);
      const entry = make(id, "monster", monsterName(t.creature, t.n, siblings.get(group)), t.mod, group);
      entry.tokens.push({ id: t.id, hp: t.hp, maxHp: t.maxHp, visible: t.visible });
      if (!t.visible) entry.held = true;
      entry.down = t.hp <= 0;
      byId.set(id, entry);
    }
    for (const name of state2.members) {
      const id = pcId(name);
      if (!byId.has(id)) byId.set(id, make(id, "pc", name, 0));
    }
    for (const t of pcTokens) {
      const id = pcId(t.pc);
      const entry = byId.get(id) ?? make(id, "pc", t.pc, 0);
      entry.tokens.push({ id: t.id, visible: t.visible });
      byId.set(id, entry);
    }
    return [...byId.values()].sort(compareEntries);
  }
  function compareEntries(a, b) {
    if (a.init === null || b.init === null) {
      if (a.init !== b.init) return a.init === null ? 1 : -1;
    } else if (a.init !== b.init) return b.init - a.init;
    if (a.kind !== b.kind) return a.kind === "monster" ? -1 : 1;
    if (a.mod !== b.mod) return b.mod - a.mod;
    return a.name.localeCompare(b.name, void 0, { numeric: true });
  }
  function acting(entries2) {
    return entries2.filter((e) => e.init !== null && !e.held && !e.down);
  }
  function step(entries2, state2, dir) {
    const order2 = acting(entries2);
    if (!order2.length) return { turn: null, round: state2.round };
    if (state2.round === 0 || state2.turn === null) return { turn: order2[0].id, round: 1 };
    let idx = order2.findIndex((e) => e.id === state2.turn);
    if (idx === -1) {
      const all = entries2.findIndex((e) => e.id === state2.turn);
      const after = all === -1 ? -1 : order2.findIndex((e) => entries2.indexOf(e) > all);
      if (dir === 1) {
        if (after === -1) return { turn: order2[0].id, round: state2.round + 1 };
        return { turn: order2[after].id, round: state2.round };
      }
      idx = after === -1 ? order2.length : after;
    }
    let next = idx + dir;
    let round = state2.round;
    if (next >= order2.length) {
      next = 0;
      round++;
    } else if (next < 0) {
      next = order2.length - 1;
      round = Math.max(1, round - 1);
    }
    return { turn: order2[next].id, round };
  }
  function displayName(e) {
    return e.name;
  }
  function rollMissing(entries2, init, d20) {
    const next = { ...init };
    const groupRoll = /* @__PURE__ */ new Map();
    for (const e of entries2) if (e.kind === "monster" && e.init !== null && !groupRoll.has(e.group)) groupRoll.set(e.group, e.init);
    for (const e of entries2) {
      if (e.kind !== "monster" || e.init !== null) continue;
      if (!groupRoll.has(e.group)) groupRoll.set(e.group, d20() + e.mod);
      next[e.id] = groupRoll.get(e.group);
    }
    return next;
  }
  function rollD20(random = Math.random) {
    return 1 + Math.floor(random() * 20);
  }

  // src/shared/protocol.ts
  var DEFAULT_PORT = 27190;

  // src/extension/common.ts
  var EXT_ID = "com.gizmo73.obsidian-bestiary";
  var TOKEN_KEY = `${EXT_ID}/creature`;
  var LABEL_KEY = `${EXT_ID}/hp-label`;
  var MENU_ID = `${EXT_ID}/menu`;
  var PC_KEY = `${EXT_ID}/pc`;
  var COMBAT_KEY = `${EXT_ID}/combat`;
  var ORDER_KEY = `${EXT_ID}/order`;
  var RING_KEY = `${EXT_ID}/turn-ring`;
  function readCreature(metadata) {
    const c = metadata[TOKEN_KEY];
    return c && typeof c.name === "string" ? c : null;
  }
  function readPc(metadata) {
    const pc = metadata[PC_KEY];
    return pc && typeof pc.name === "string" ? pc.name : null;
  }
  function readCombat(metadata) {
    const c = metadata[COMBAT_KEY];
    return { ...EMPTY_COMBAT, ...c ?? {} };
  }
  function readOrder(metadata) {
    return metadata[ORDER_KEY] ?? null;
  }
  function combatTokens(items2) {
    const monsters = [];
    const pcs = [];
    for (const item of items2) {
      const c = readCreature(item.metadata);
      if (c) {
        monsters.push({ id: item.id, creature: c.name, n: c.n, mod: c.init, hp: c.hp, maxHp: c.maxHp, visible: item.visible });
        continue;
      }
      const pc = readPc(item.metadata);
      if (pc) pcs.push({ id: item.id, pc, visible: item.visible });
    }
    return { monsters, pcs };
  }
  var PORT_KEY = "obsidian-bestiary:port";
  var PARTIES_KEY = "obsidian-bestiary:parties";
  var LAST_PARTY_KEY = "obsidian-bestiary:last-party";
  function loadParties() {
    try {
      const raw = localStorage.getItem(PARTIES_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  function getLastParty() {
    try {
      return localStorage.getItem(LAST_PARTY_KEY);
    } catch {
      return null;
    }
  }
  function setLastParty(name) {
    try {
      if (name) localStorage.setItem(LAST_PARTY_KEY, name);
      else localStorage.removeItem(LAST_PARTY_KEY);
    } catch {
    }
  }
  function getPort() {
    try {
      const p = Number(localStorage.getItem(PORT_KEY));
      return Number.isInteger(p) && p > 0 ? p : DEFAULT_PORT;
    } catch {
      return DEFAULT_PORT;
    }
  }
  function setPort(port) {
    try {
      localStorage.setItem(PORT_KEY, String(port));
    } catch {
    }
  }
  function openChannel(onMessage) {
    const channel2 = new BroadcastChannel("obsidian-bestiary");
    channel2.onmessage = (e) => onMessage(e.data);
    return {
      post: (msg) => channel2.postMessage(msg),
      close: () => channel2.close()
    };
  }

  // src/extension/theme.ts
  function apply(theme) {
    const root2 = document.documentElement;
    root2.dataset.theme = theme.mode === "LIGHT" ? "light" : "dark";
    root2.style.setProperty("--obr-text", theme.text.primary);
    root2.style.setProperty("--obr-text-2", theme.text.secondary);
    root2.style.setProperty("--obr-primary", theme.primary.main);
    root2.style.setProperty("--obr-paper", theme.background.paper);
  }
  async function followTheme() {
    try {
      apply(await lib_default.theme.getTheme());
      lib_default.theme.onChange(apply);
    } catch {
    }
  }

  // src/extension/popover.ts
  var root = document.getElementById("app");
  var role = "PLAYER";
  var status = null;
  var parties = loadParties();
  var partyError = "";
  var state = { ...EMPTY_COMBAT };
  var items = [];
  var order = null;
  var formOpen = null;
  var confirmEnd = false;
  var lastPartyApplied = false;
  var editingHp = null;
  var partyNotice = "";
  var inserting = false;
  var hpError = "";
  var esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  var ICON = {
    eye: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`,
    eyeOff: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.2 3.2M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M2 2l20 20"/></svg>`,
    dice: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 22V12M21 7l-9 5-9-5"/></svg>`
  };
  var channel = openChannel((msg) => {
    if (msg.type === "status") {
      status = msg.status;
      render();
    } else if (msg.type === "parties") {
      parties = msg.parties;
      partyError = msg.error ?? "";
      if (msg.error && !formOpen) partyNotice = msg.error;
      if (!msg.error && formOpen) formOpen = null;
      void syncPartyMembers();
      render();
    }
  });
  var entries = () => {
    const { monsters, pcs } = combatTokens(items);
    return buildEntries(monsters, pcs, state);
  };
  async function save(next) {
    state = { ...state, ...next };
    await lib_default.scene.setMetadata({ [COMBAT_KEY]: state });
    render();
  }
  var findParty = (name) => parties?.parties.find((p) => p.name === name);
  async function syncPartyMembers() {
    if (role !== "GM") return;
    if (state.party) {
      const party = findParty(state.party);
      if (party && JSON.stringify(party.members) !== JSON.stringify(state.members)) await save({ members: party.members });
      return;
    }
    const last = getLastParty();
    if (!lastPartyApplied && last && findParty(last)) {
      lastPartyApplied = true;
      await choose(last);
    }
  }
  async function choose(partyName) {
    const party = findParty(partyName);
    setLastParty(party ? party.name : null);
    await save({ party: party?.name ?? null, members: party?.members ?? [] });
  }
  var plainText = (text) => text?.plainText ?? "";
  function describeError(err) {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    const message = err?.message ?? err?.error;
    if (typeof message === "string") return message;
    try {
      return JSON.stringify(err) ?? String(err);
    } catch {
      return String(err);
    }
  }
  function artFromItem(item) {
    return toArt({ ...item, type: "CHARACTER" });
  }
  async function pickImages(search) {
    const attempts = [
      () => lib_default.assets.downloadImages(true, search || void 0, "CHARACTER"),
      () => lib_default.assets.downloadImages(true),
      () => lib_default.assets.downloadImages()
    ];
    let error = "";
    for (const attempt of attempts) {
      try {
        return { picks: await attempt() ?? [] };
      } catch (err) {
        error = describeError(err);
        console.warn("[obsidian-bestiary] asset picker failed:", err);
      }
    }
    return { picks: [], error };
  }
  function toArt(d) {
    return {
      name: d.name,
      image: { url: d.image.url, mime: d.image.mime, width: d.image.width, height: d.image.height },
      grid: { dpi: d.grid.dpi, offset: { x: d.grid.offset.x, y: d.grid.offset.y } },
      scale: { x: d.scale.x, y: d.scale.y },
      rotation: d.rotation,
      text: d.text,
      textItemType: d.textItemType,
      description: d.description
    };
  }
  async function insertParty(repick) {
    const members = state.members;
    if (!members.length || inserting) return;
    inserting = true;
    partyNotice = "";
    try {
      const byKey = new Map(members.map((m) => [matchKey(m), m]));
      const present = /* @__PURE__ */ new Set();
      const toLink = [];
      const art = { ...parties?.art ?? {} };
      const saved = {};
      const learn = (m, item) => {
        if (!art[m] && isImage(item) && item.image?.url) saved[m] = art[m] = artFromItem(item);
      };
      for (const item of await lib_default.scene.items.getItems()) {
        const pc = readPc(item.metadata);
        if (pc) {
          const m = byKey.get(matchKey(pc));
          if (m) {
            present.add(m);
            learn(m, item);
          }
          continue;
        }
        if (item.layer !== "CHARACTER" || readCreature(item.metadata)) continue;
        const label = isImage(item) ? item.text?.plainText ?? "" : "";
        for (const candidate of nameCandidates({ name: item.name, label })) {
          const m = byKey.get(matchKey(candidate));
          if (m && !present.has(m)) {
            present.add(m);
            toLink.push({ id: item.id, pc: m });
            learn(m, item);
            break;
          }
        }
      }
      const need = repick ? members : members.filter((m) => !present.has(m) && !art[m]);
      const unmatched = [];
      let pickerError = "";
      if (need.length) {
        const { picks, error } = await pickImages(need.length === 1 ? need[0] : "");
        pickerError = error ?? "";
        const result = matchPicks(
          picks.map((p) => ({ name: p.name, label: plainText(p.text) })),
          need
        );
        for (const [m, i] of result.matched) saved[m] = art[m] = toArt(picks[i]);
        for (const i of result.unmatched) unmatched.push(toArt(picks[i]));
      }
      if (Object.keys(saved).length) channel.post({ type: "save-art", art: saved });
      const placing = [
        ...members.filter((m) => !present.has(m) && art[m]).map((m) => ({ pc: m, art: art[m] })),
        ...unmatched.map((a) => ({ pc: null, art: a }))
      ];
      const missing = members.filter((m) => !present.has(m) && !art[m]);
      if (toLink.length) {
        const pcFor = new Map(toLink.map((t) => [t.id, t.pc]));
        await lib_default.scene.items.updateItems([...pcFor.keys()], (drafts) => {
          for (const d of drafts) d.metadata[PC_KEY] = { name: pcFor.get(d.id) };
        });
      }
      if (placing.length) {
        const dpi = await lib_default.scene.grid.getDpi();
        const size = (a) => a.image.width / a.grid.dpi * dpi * Math.abs(a.scale.x);
        const spacing = Math.max(dpi, ...placing.map((p) => size(p.art)));
        const [w, h] = await Promise.all([lib_default.viewport.getWidth(), lib_default.viewport.getHeight()]);
        const center = await lib_default.viewport.inverseTransformPoint({ x: w / 2, y: h / 2 });
        const spots = await Promise.all(rowPositions(center, placing.length, spacing).map((p) => lib_default.scene.grid.snapPosition(p)));
        const tokens = placing.map(({ pc, art: a }, i) => {
          let b = buildImage(a.image, a.grid).name(a.name).scale(a.scale).rotation(a.rotation).layer("CHARACTER").position(spots[i]).metadata(pc ? { [PC_KEY]: { name: pc } } : {});
          if (a.text) b = b.text(a.text);
          if (a.textItemType) b = b.textItemType(a.textItemType);
          if (a.description) b = b.description(a.description);
          return b.build();
        });
        await lib_default.scene.items.addItems(tokens);
      }
      const parts = [];
      const placed = placing.filter((p) => p.pc).map((p) => p.pc);
      if (placed.length) parts.push(`Added ${placed.join(", ")}`);
      if (toLink.length) parts.push(`linked ${toLink.map((t) => t.pc).join(", ")} already on the map`);
      if (unmatched.length) parts.push(`placed ${unmatched.map((a) => a.name).join(", ")} unlinked (no PC with that name)`);
      if (missing.length && !pickerError) parts.push(`no token picked for ${missing.join(", ")}`);
      if (pickerError) {
        parts.push(
          `Owlbear's token picker didn't open (${pickerError}). Drag ${missing.length ? missing.join(", ") : "the party"} onto the map from your library once and press Insert party again: it will remember them`
        );
      }
      partyNotice = parts.length ? `${parts.join("; ")}.` : "Everyone's already on the map.";
    } catch (err) {
      partyNotice = `Couldn't insert the party: ${describeError(err)}`;
    } finally {
      inserting = false;
      render();
    }
  }
  async function selectTokens(entry) {
    const ids = entry?.tokens.map((t) => t.id) ?? [];
    if (ids.length) await lib_default.player.select(ids, true);
  }
  async function move(dir) {
    const list = entries();
    const next = step(list, state, dir);
    await save(next);
    await selectTokens(list.find((e) => e.id === next.turn));
  }
  async function rollMissing2() {
    await save({ init: rollMissing(entries(), state.init, rollD20) });
  }
  async function migrateGroupKeys() {
    if (role !== "GM") return;
    const legacy = (id) => id.startsWith("m:");
    if (!Object.keys(state.init).some(legacy) && !state.held.some(legacy)) return;
    const init = {};
    for (const [id, value] of Object.entries(state.init)) if (!legacy(id)) init[id] = value;
    const held = state.held.filter((id) => !legacy(id));
    for (const e of entries()) {
      if (e.kind !== "monster") continue;
      if (e.init !== null) init[e.id] = e.init;
      if (e.held && !held.includes(e.id)) held.push(e.id);
    }
    const turn = state.turn && legacy(state.turn) ? entries().find((e) => e.group === state.turn)?.id ?? null : state.turn;
    await save({ init, held, turn });
  }
  async function migrateHeldMonsters() {
    if (role !== "GM") return;
    const monsterIds = (id) => id.startsWith("t:") || id.startsWith("m:");
    if (!state.held.some(monsterIds)) return;
    const tokens = entries().filter((e) => e.kind === "monster" && (state.held.includes(e.id) || state.held.includes(e.group))).flatMap((e) => e.tokens.map((t) => t.id));
    if (tokens.length) {
      await lib_default.scene.items.updateItems(tokens, (drafts) => {
        for (const d of drafts) d.visible = false;
      });
    }
    await save({ held: state.held.filter((id) => !monsterIds(id)) });
  }
  async function toggleHeld(entry) {
    if (entry.kind === "monster") {
      const show = entry.held;
      await lib_default.scene.items.updateItems(
        entry.tokens.map((t) => t.id),
        (drafts) => {
          for (const d of drafts) d.visible = show;
        }
      );
      if (state.held.includes(entry.id) || state.held.includes(entry.group)) {
        await save({ held: state.held.filter((id) => id !== entry.id && id !== entry.group) });
      }
      return;
    }
    const held = entry.held ? state.held.filter((id) => id !== entry.id) : [...state.held, entry.id];
    await save({ held });
  }
  async function applyHpTo(entry, value) {
    const op = parseHpInput(value);
    if (!op) {
      hpError = "Try 7, +5, =20 or max 30";
      return false;
    }
    const ids = entry.tokens.map((t) => t.id);
    await lib_default.scene.items.updateItems(ids, (drafts) => {
      for (const d of drafts) {
        const c = readCreature(d.metadata);
        if (c) d.metadata[TOKEN_KEY] = { ...c, ...applyHp(c, op) };
      }
    });
    hpError = "";
    return true;
  }
  var renderQueued = false;
  function render() {
    const active = document.activeElement;
    if (active && root.contains(active) && active.tagName === "INPUT") {
      renderQueued = true;
      return;
    }
    renderQueued = false;
    root.innerHTML = role === "GM" ? gmHtml() : playerHtml();
    if (role === "GM") wireGm();
  }
  document.addEventListener("focusout", () => setTimeout(() => renderQueued && render(), 0));
  function playerHtml() {
    const list = order?.entries ?? [];
    return `
    <header><h1>Initiative</h1>${order && order.round > 0 ? `<span class="round">Round ${order.round}</span>` : ""}</header>
    ${list.length ? `<ol class="public">${list.map((e) => `<li class="${e.active ? "active" : ""}">${esc(e.name)}</li>`).join("")}</ol>` : `<p class="help">No turn order yet.</p>`}`;
  }
  function connDot() {
    const s = status;
    const cls = !s ? "pending" : s.state === "connected" ? s.error ? "warn" : "ok" : s.state === "offline" ? "fail" : "pending";
    const title = s?.state === "connected" ? `Connected to ${s.vault} \xB7 ${s.creatures ?? 0} creatures` : s?.state === "offline" ? `Not connected to Obsidian: ${s.error ?? ""}` : "Connecting to Obsidian\u2026";
    return `<span class="conn ${cls}" title="${esc(title)}"></span>`;
  }
  function partyOptions() {
    const list = parties?.parties ?? [];
    const group = (label, src) => {
      const opts = list.filter((p) => p.source === src);
      return opts.length ? `<optgroup label="${label}">${opts.map((p) => `<option value="${esc(p.name)}" ${p.name === state.party ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</optgroup>` : "";
    };
    return `<option value="" ${state.party ? "" : "selected"}>No party</option>${group("Initiative Tracker", "initiative-tracker")}${group("Made in Owlbear", "bridge")}`;
  }
  function rowHtml(e) {
    const cls = [e.kind, e.id === state.turn && state.round > 0 ? "active" : "", e.held ? "held" : "", e.down ? "down" : ""].filter(Boolean).join(" ");
    const t = e.tokens[0];
    const hps = e.kind !== "monster" ? `<span class="tag">PC${e.tokens.length ? "" : " \xB7 no token"}</span>` : editingHp === e.id ? `<input class="hp-input" type="text" inputmode="numeric" placeholder="7 \xB7 +5 \xB7 =20" aria-label="Damage or heal ${esc(e.name)}">` : `<button class="chip ${hpBand({ hp: t.hp ?? 0, maxHp: t.maxHp ?? 1 })}" type="button" title="Damage or heal">${t.hp}/${t.maxHp}</button>`;
    return `
    <li class="${cls}" data-id="${esc(e.id)}">
      <input class="init" type="number" inputmode="numeric" value="${e.init ?? ""}" placeholder="\u2013" aria-label="Initiative for ${esc(e.name)}">
      <button class="name" type="button" title="Select on the map">${esc(displayName(e))}</button>
      ${hps}
      ${e.kind === "monster" ? `<button class="icon reroll" type="button" title="Roll d20 ${e.mod >= 0 ? "+" : ""}${e.mod}">${ICON.dice}</button>` : `<span class="icon-spacer"></span>`}
      <button class="icon hold" type="button" title="${e.kind === "monster" ? e.held ? "Hidden from players, not in the fight yet: click to reveal" : "Visible to players: click to hide (and skip)" : e.held ? "Not in combat yet: click to join" : "In combat: click to hold back"}">${e.held ? ICON.eyeOff : ICON.eye}</button>
    </li>`;
  }
  function gmHtml() {
    const list = entries();
    const started = state.round > 0;
    const party = findParty(state.party);
    const s = status;
    return `
    <header><h1>Turn order</h1>${connDot()}${started ? `<span class="round">Round ${state.round}</span>` : ""}</header>
    <div class="bar">
      <select id="party" aria-label="Party">${partyOptions()}</select>
      <button id="new-party" type="button" title="New party">New</button>
      ${party?.source === "bridge" ? `<button id="edit-party" type="button" title="Edit party">Edit</button>` : ""}
    </div>
    ${formOpen ? partyFormHtml() : ""}
    ${state.members.length ? `<div class="bar">
      <button id="insert-party" type="button" title="Put the party's tokens on the map, linked" ${inserting ? "disabled" : ""}>Insert party</button>
      <button id="repick" type="button" title="Choose the party's token images again">Re-pick tokens</button>
    </div>` : ""}
    ${partyNotice ? `<div class="notice">${esc(partyNotice)}</div>` : ""}
    <div class="bar">
      <button id="roll" type="button" title="Roll for monsters without a number">Roll</button>
      ${started ? `<button id="prev" type="button" title="Previous turn">\u25C0</button>` : ""}
      <button id="next" class="primary" type="button">${started ? "Next \u25B6" : "Start"}</button>
      ${started || Object.keys(state.init).length ? `<button id="end" type="button">${confirmEnd ? "End combat?" : "End"}</button>` : ""}
    </div>
    ${hpError ? `<div class="error">${esc(hpError)}</div>` : ""}
    ${list.length ? `<ol class="order">${list.map(rowHtml).join("")}</ol>` : `<p class="help">Link tokens (right-click \u2192 <b>Statblock &amp; HP</b>) or pick a party to build the order.</p>`}
    <details class="conn-details">
      <summary>Connection</summary>
      <p class="help">${s?.state === "connected" ? `Connected to \u201C${esc(s.vault ?? "")}\u201D \xB7 ${s.creatures ?? 0} creatures${s.syncedAt ? ` \xB7 synced ${new Date(s.syncedAt).toLocaleTimeString()}` : ""}${s.error ? `<br>${esc(s.error)}` : ""}${(s.protocol ?? 1) < 2 ? "<br>Update Owlbear Bestiary Bridge in Obsidian to use parties." : ""}` : s?.state === "offline" ? `Not connected: ${esc(s.error ?? "")}. Is Obsidian open with Owlbear Bestiary Bridge enabled?` : "Connecting\u2026"}</p>
      <div class="bar">
        <button id="reconnect" type="button">Reconnect</button>
        <button id="refresh" type="button" ${s?.state === "connected" ? "" : "disabled"}>Refresh bestiary</button>
      </div>
      <label>Port <input id="port" type="number" min="1024" max="65535" value="${getPort()}"></label>
      <button id="save-port" type="button">Save port</button>
    </details>`;
  }
  function partyFormHtml() {
    const editing = formOpen?.editing ? findParty(formOpen.editing) : void 0;
    const members = new Set(editing?.members ?? []);
    const known = [.../* @__PURE__ */ new Set([...parties?.pcs ?? [], ...members])].sort((a, b) => a.localeCompare(b));
    return `
    <form id="party-form" class="party-form">
      <input id="party-name" type="text" placeholder="Party name" value="${esc(editing?.name ?? "")}" ${editing ? "readonly" : ""}>
      <div class="members">${known.length ? known.map(
      (n) => `<label class="member"><input type="checkbox" value="${esc(n)}" ${members.has(n) ? "checked" : ""}> ${esc(n)}</label>`
    ).join("") : `<span class="help">No PCs known yet: add names below.</span>`}</div>
      <input id="party-extra" type="text" placeholder="More names, comma separated">
      ${partyError ? `<div class="error">${esc(partyError)}</div>` : ""}
      <div class="bar">
        <button type="submit" class="primary">Save</button>
        <button id="party-cancel" type="button">Cancel</button>
        ${editing ? `<button id="party-delete" type="button">Delete</button>` : ""}
      </div>
    </form>`;
  }
  function wireGm() {
    const on = (id, fn) => document.getElementById(id)?.addEventListener("click", fn);
    document.getElementById("party")?.addEventListener("change", (e) => void choose(e.target.value));
    on("insert-party", () => void insertParty(false));
    on("repick", () => void insertParty(true));
    on("new-party", () => {
      formOpen = { editing: null };
      partyError = "";
      render();
    });
    on("edit-party", () => {
      formOpen = { editing: state.party };
      partyError = "";
      render();
    });
    on("party-cancel", () => {
      formOpen = null;
      render();
    });
    on("party-delete", () => {
      if (formOpen?.editing) channel.post({ type: "delete-party", name: formOpen.editing });
      void choose("");
    });
    document.getElementById("party-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("party-name").value.trim();
      const checked = [...document.querySelectorAll(".member input:checked")].map((i) => i.value);
      const extra = document.getElementById("party-extra").value.split(",").map((s) => s.trim()).filter(Boolean);
      if (!name) {
        partyError = "Give the party a name";
        render();
        return;
      }
      channel.post({ type: "save-party", name, members: [...checked, ...extra] });
      setLastParty(name);
      lastPartyApplied = false;
      void save({ party: name, members: [.../* @__PURE__ */ new Set([...checked, ...extra])] });
    });
    on("roll", () => void rollMissing2());
    on("next", () => void move(1));
    on("prev", () => void move(-1));
    on("end", () => {
      if (!confirmEnd) {
        confirmEnd = true;
        render();
        setTimeout(() => {
          confirmEnd = false;
          render();
        }, 4e3);
        return;
      }
      confirmEnd = false;
      void save({ round: 0, turn: null, init: {}, held: [] });
    });
    const list = entries();
    root.querySelectorAll("ol.order li").forEach((li) => {
      const entry = list.find((e) => e.id === li.dataset.id);
      if (!entry) return;
      const input = li.querySelector("input.init");
      const commit = () => {
        const init = { ...state.init };
        const value = input.value.trim();
        if (value === "") delete init[entry.id];
        else if (Number.isFinite(Number(value))) init[entry.id] = Math.trunc(Number(value));
        else return;
        if (init[entry.id] !== state.init[entry.id]) void save({ init });
      };
      input.addEventListener("change", commit);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") input.blur();
      });
      li.querySelector(".name")?.addEventListener("click", () => void selectTokens(entry));
      li.querySelector(".reroll")?.addEventListener("click", () => void save({ init: { ...state.init, [entry.id]: rollD20() + entry.mod } }));
      li.querySelector(".hold")?.addEventListener("click", () => void toggleHeld(entry));
      li.querySelector(".chip")?.addEventListener("click", () => {
        editingHp = entry.id;
        hpError = "";
        render();
        root.querySelector(`li[data-id="${CSS.escape(entry.id)}"] .hp-input`)?.focus();
      });
      const hpInput = li.querySelector(".hp-input");
      if (hpInput) {
        const close = () => {
          editingHp = null;
          hpInput.blur();
          render();
        };
        hpInput.addEventListener("keydown", async (e) => {
          if (e.key === "Escape") close();
          if (e.key !== "Enter") return;
          if (await applyHpTo(entry, hpInput.value)) close();
          else {
            hpInput.select();
            root.querySelector(".error")?.remove();
            root.querySelector("ol.order")?.insertAdjacentHTML("beforebegin", `<div class="error">${esc(hpError)}</div>`);
          }
        });
        hpInput.addEventListener("blur", () => {
          if (editingHp === entry.id) {
            editingHp = null;
            setTimeout(render, 0);
          }
        });
      }
    });
    on("reconnect", () => channel.post({ type: "reconnect" }));
    on("refresh", () => channel.post({ type: "refresh-bestiary" }));
    on("save-port", () => {
      const port = Number(document.getElementById("port").value);
      if (!Number.isInteger(port) || port < 1024 || port > 65535) return;
      setPort(port);
      channel.post({ type: "reconnect" });
    });
  }
  render();
  lib_default.onReady(async () => {
    void followTheme();
    role = await lib_default.player.getRole();
    void lib_default.action.setWidth(360).catch(() => void 0);
    void lib_default.action.setHeight(role === "GM" ? 560 : 320).catch(() => void 0);
    const load = async () => {
      const metadata = await lib_default.scene.getMetadata();
      state = readCombat(metadata);
      order = readOrder(metadata);
      if (role === "GM") items = await lib_default.scene.items.getItems();
      render();
    };
    lib_default.scene.onMetadataChange((metadata) => {
      state = readCombat(metadata);
      order = readOrder(metadata);
      render();
    });
    lib_default.scene.onReadyChange((ready) => ready && void load());
    if (role === "GM") {
      lib_default.scene.items.onChange((next) => {
        items = next;
        render();
      });
      channel.post({ type: "get-status" });
      channel.post({ type: "get-parties" });
    }
    lib_default.player.onChange((p) => {
      if (p.role !== role) {
        role = p.role;
        void load();
      }
    });
    if (await lib_default.scene.isReady()) await load();
    await migrateGroupKeys();
    await migrateHeldMonsters();
    await syncPartyMembers();
  });
})();
