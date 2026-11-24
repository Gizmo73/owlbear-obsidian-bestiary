"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/ws/lib/stream.js"(exports2, module2) {
    "use strict";
    var { Duplex } = require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module2.exports = createWebSocketStream2;
  }
});

// node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/ws/lib/constants.js"(exports2, module2) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module2.exports = {
      BINARY_TYPES,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
      kListener: Symbol("kListener"),
      kStatusCode: Symbol("status-code"),
      kWebSocket: Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/ws/lib/buffer-util.js"(exports2, module2) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module2.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = require("bufferutil");
        module2.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module2.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/ws/lib/limiter.js"(exports2, module2) {
    "use strict";
    var kDone = Symbol("kDone");
    var kRun = Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module2.exports = Limiter;
  }
});

// node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/ws/lib/permessage-deflate.js"(exports2, module2) {
    "use strict";
    var zlib = require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = Symbol("permessage-deflate");
    var kTotalLength = Symbol("total-length");
    var kCallback = Symbol("callback");
    var kBuffers = Symbol("buffers");
    var kError = Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       * @param {Boolean} [isServer=false] Create the instance in either server or
       *     client mode
       * @param {Number} [maxPayload=0] The maximum allowed message length
       */
      constructor(options, isServer, maxPayload) {
        this._maxPayload = maxPayload | 0;
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._isServer = !!isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module2.exports = PerMessageDeflate;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "node_modules/ws/lib/validation.js"(exports2, module2) {
    "use strict";
    var { isUtf8 } = require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module2.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module2.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = require("utf-8-validate");
        module2.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/ws/lib/receiver.js"(exports2, module2) {
    "use strict";
    var { Writable } = require("stream");
    var PerMessageDeflate = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module2.exports = Receiver2;
  }
});

// node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/ws/lib/sender.js"(exports2, module2) {
    "use strict";
    var { Duplex } = require("stream");
    var { randomFillSync } = require("crypto");
    var PerMessageDeflate = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else {
            buf.set(data, 2);
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {Buffer[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module2.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/ws/lib/event-target.js"(exports2, module2) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = Symbol("kCode");
    var kData = Symbol("kData");
    var kError = Symbol("kError");
    var kMessage = Symbol("kMessage");
    var kReason = Symbol("kReason");
    var kTarget = Symbol("kTarget");
    var kType = Symbol("kType");
    var kWasClean = Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module2.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/ws/lib/extension.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension) => {
        let configurations = extensions[extension];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module2.exports = { format, parse };
  }
});

// node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/ws/lib/websocket.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var https = require("https");
    var http2 = require("http");
    var net = require("net");
    var tls = require("tls");
    var { randomBytes, createHash } = require("crypto");
    var { Duplex, Readable } = require("stream");
    var { URL: URL2 } = require("url");
    var PerMessageDeflate = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var closeTimeout = 30 * 1e3;
    var kAborted = Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate.extensionName]) {
          this._extensions[PerMessageDeflate.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module2.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        protocolVersion: protocolVersions[1],
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL2) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL2(address);
        } catch (e) {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https.request : http2.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate(
          opts.perMessageDeflate !== true ? opts.perMessageDeflate : {},
          false,
          opts.maxPayload
        );
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL2(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      let chunk;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && (chunk = websocket._socket.read()) !== null) {
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "node_modules/ws/lib/subprotocol.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module2.exports = { parse };
  }
});

// node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/ws/lib/websocket-server.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var http2 = require("http");
    var { Duplex } = require("stream");
    var { createHash } = require("crypto");
    var extension = require_extension();
    var PerMessageDeflate = require_permessage_deflate();
    var subprotocol = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http2.createServer((req, res) => {
            const body = http2.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 8 && version !== 13) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate(
            this.options.perMessageDeflate,
            true,
            this.options.maxPayload
          );
          try {
            const offers = extension.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
              extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate.extensionName]) {
          const params = extensions[PerMessageDeflate.extensionName].params;
          const value = extension.format({
            [PerMessageDeflate.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module2.exports = WebSocketServer2;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http2.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http2.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message);
      }
    }
  }
});

// plugin/src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => OwlbearBridgeSpike
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// shared.ts
var BRIDGE_PORT = 27190;
var LOCAL_BASE = `http://127.0.0.1:${BRIDGE_PORT}/ext/`;
var EXTENSION_ORIGINS = [
  "https://gizmo73.github.io",
  `http://127.0.0.1:${BRIDGE_PORT}`,
  `http://localhost:${BRIDGE_PORT}`
];
var MSG_KEY = "__obsidianBridge";
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
function matchKey(name) {
  return name.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// plugin/src/server.ts
var import_node_http = __toESM(require("node:http"), 1);

// node_modules/ws/wrapper.mjs
var import_stream = __toESM(require_stream(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);

// plugin/src/server.ts
function startBridgeServer(opts) {
  const validHosts = /* @__PURE__ */ new Set([`127.0.0.1:${opts.port}`, `localhost:${opts.port}`]);
  const clients = /* @__PURE__ */ new Set();
  const server = import_node_http.default.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${opts.port}`);
    const origin = req.headers.origin;
    if (!validHosts.has(req.headers.host ?? "")) {
      res.writeHead(421).end("wrong host");
      return;
    }
    if (url.pathname.startsWith("/ext/")) {
      const name = url.pathname.slice("/ext/".length) || "index.html";
      const file = opts.files[name];
      if (!file) {
        res.writeHead(404).end("not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": file.type,
        "Access-Control-Allow-Origin": "*",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Cache-Control": "no-store"
      });
      res.end(file.body);
      return;
    }
    if (url.pathname === "/ping") {
      if (origin && !opts.allowedOrigins.includes(origin)) {
        opts.onLog(`rejected /ping from origin ${origin}`);
        res.writeHead(403).end("origin not allowed");
        return;
      }
      const headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Private-Network": "true"
      };
      if (origin) {
        headers["Access-Control-Allow-Origin"] = origin;
        headers["Vary"] = "Origin";
      }
      if (req.method === "OPTIONS") {
        headers["Access-Control-Allow-Methods"] = "GET";
        headers["Access-Control-Allow-Headers"] = "*";
        res.writeHead(204, headers).end();
        return;
      }
      opts.onLog(`HTTP /ping from ${origin ?? "no origin"}`);
      res.writeHead(200, headers).end(
        JSON.stringify({ ok: true, plugin: "owlbear-bridge-spike", version: opts.version })
      );
      return;
    }
    res.writeHead(404).end("not found");
  });
  const wss = new import_websocket_server.default({ noServer: true });
  server.on("upgrade", (req, socket, head) => {
    const origin = req.headers.origin ?? "";
    const path = new URL(req.url ?? "/", "http://x").pathname;
    if (path !== "/ws" || !validHosts.has(req.headers.host ?? "") || !opts.allowedOrigins.includes(origin)) {
      opts.onLog(`rejected websocket from origin "${origin}" path ${path}`);
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      clients.add(ws);
      opts.onClientsChanged?.(clients.size);
      opts.onLog(`websocket connected from ${origin}`);
      const reply = (msg) => {
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
      };
      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(String(data));
          if (msg && typeof msg === "object") opts.onMessage(msg, reply);
        } catch {
          opts.onLog("ignored non-JSON websocket message");
        }
      });
      ws.on("close", () => {
        clients.delete(ws);
        opts.onClientsChanged?.(clients.size);
        opts.onLog(`websocket closed (${origin})`);
      });
    });
  });
  const listening = new Promise((resolve, reject) => {
    server.once("error", (err) => {
      opts.onLog(
        err.code === "EADDRINUSE" ? `port ${opts.port} is already in use; the bridge could not start` : `server error: ${err.message}`
      );
      reject(err);
    });
    server.listen(opts.port, "127.0.0.1", () => {
      opts.onLog(`listening on http://127.0.0.1:${opts.port}`);
      resolve();
    });
  });
  listening.catch(() => void 0);
  return {
    listening,
    broadcast(msg) {
      const text = JSON.stringify(msg);
      for (const ws of clients) if (ws.readyState === ws.OPEN) ws.send(text);
    },
    close() {
      for (const ws of clients) ws.terminate();
      wss.close();
      return new Promise((resolve) => server.close(() => resolve()));
    }
  };
}

// plugin/src/relay.ts
function bootstrapScript(extensionOrigins, msgKey) {
  return `(() => {
  if (!window.__obsBridge) {
    const ORIGINS = ${JSON.stringify(extensionOrigins)};
    const KEY = ${JSON.stringify(msgKey)};
    const queue = [];
    const listen = (w) => w.addEventListener("message", (e) => {
      if (e.data && e.data[KEY] && ORIGINS.includes(e.origin)) queue.push(e.data);
    });
    listen(window);
    const frames = () => {
      const out = [];
      const walk = (root) => {
        root.querySelectorAll("iframe").forEach((f) => {
          out.push(f);
          try { if (f.contentDocument) walk(f.contentDocument); } catch {}
        });
        root.querySelectorAll("*").forEach((el) => { if (el.shadowRoot) walk(el.shadowRoot); });
      };
      walk(document);
      return out;
    };
    const ours = () => frames().filter((f) => {
      try { return ORIGINS.includes(new URL(f.src, location.href).origin); } catch { return false; }
    });
    window.__obsBridge = {
      send(msg) {
        for (const f of ours()) {
          try { f.contentWindow.postMessage(Object.assign({ [KEY]: true }, msg), new URL(f.src, location.href).origin); } catch {}
        }
      },
      drain() { return queue.splice(0); },
      frames() { return ours().map((f) => f.src); },
    };
  }
  return { drained: window.__obsBridge.drain(), frames: window.__obsBridge.frames() };
})()`;
}
function sendScript(msg) {
  return `window.__obsBridge && window.__obsBridge.send(${JSON.stringify(msg)})`;
}
var WebviewRelay = class {
  constructor(opts) {
    this.opts = opts;
    __publicField(this, "timer", null);
    __publicField(this, "busy", false);
    __publicField(this, "bootstrap");
    this.bootstrap = bootstrapScript(opts.extensionOrigins, opts.msgKey);
  }
  start() {
    this.timer = setInterval(() => void this.tick(), this.opts.intervalMs ?? 500);
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
  async tick() {
    if (this.busy) return;
    this.busy = true;
    const status = { webviews: 0, owlbear: 0, frames: [] };
    try {
      const views = this.opts.findWebviews();
      status.webviews = views.length;
      for (const view of views) {
        let url = "";
        try {
          url = view.getURL();
        } catch {
          continue;
        }
        if (!/^https:\/\/(www\.)?owlbear\.rodeo\//.test(url)) continue;
        status.owlbear++;
        const result = await view.executeJavaScript(this.bootstrap);
        if (!result) continue;
        status.frames.push(...result.frames);
        const reply = (msg) => void view.executeJavaScript(sendScript(msg)).catch(() => void 0);
        for (const msg of result.drained) this.opts.onMessage(msg, reply);
      }
    } catch (err) {
      status.error = err.message;
    } finally {
      this.busy = false;
      this.opts.onStatus(status);
    }
  }
};

// plugin/src/embedded.gen.ts
var EXTENSION_FILES = { "manifest.json": { "type": "application/json", "body": '{\n  "name": "Obsidian Bridge Test (Obsidian)",\n  "version": "0.0.1",\n  "manifest_version": 1,\n  "action": {\n    "title": "Obsidian Bridge Test (Obsidian)",\n    "icon": "http://127.0.0.1:27190/ext/icon.svg",\n    "popover": "http://127.0.0.1:27190/ext/index.html",\n    "width": 380,\n    "height": 560\n  },\n  "icon": "http://127.0.0.1:27190/ext/icon.svg",\n  "author": "Gizmo73",\n  "homepage_url": "https://github.com/Gizmo73/owlbear-obsidian-bestiary",\n  "description": "Throwaway connection test between Owlbear Rodeo and an Obsidian plugin"\n}' }, "index.html": { "type": "text/html; charset=utf-8", "body": '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Obsidian Bridge Test</title>\n<style>\n  :root { color-scheme: light dark; --bg: #1e1e24; --fg: #e8e6e3; --muted: #9a98a0; --ok: #4caf7a; --fail: #e06c6c; --pending: #d9b84a; --line: #33323a; }\n  @media (prefers-color-scheme: light) { :root { --bg: #fbfaf8; --fg: #222; --muted: #666; --line: #ddd; } }\n  * { box-sizing: border-box; }\n  body { margin: 0; padding: 12px; background: var(--bg); color: var(--fg); font: 13px/1.4 system-ui, sans-serif; }\n  h1 { font-size: 15px; margin: 0 0 2px; }\n  #variant { color: var(--muted); font-size: 11px; margin-bottom: 10px; word-break: break-all; }\n  .row { display: grid; grid-template-columns: 18px 1fr; gap: 0 6px; padding: 6px 0; border-bottom: 1px solid var(--line); }\n  .row .icon { grid-row: span 2; font-weight: 700; }\n  .row .label { font-weight: 600; }\n  .row .detail { color: var(--muted); font-size: 12px; word-break: break-word; }\n  .ok .icon { color: var(--ok); } .fail .icon { color: var(--fail); } .pending .icon { color: var(--pending); }\n  button { margin: 10px 0; padding: 5px 10px; border-radius: 6px; border: 1px solid var(--line); background: transparent; color: var(--fg); cursor: pointer; }\n  details { margin-top: 6px; }\n  textarea, pre { width: 100%; font: 11px/1.35 ui-monospace, monospace; color: var(--fg); background: transparent; border: 1px solid var(--line); border-radius: 6px; padding: 6px; }\n  textarea { height: 110px; resize: vertical; }\n  pre { max-height: 160px; overflow: auto; white-space: pre-wrap; margin: 6px 0 0; }\n</style>\n</head>\n<body>\n  <h1>Obsidian bridge test</h1>\n  <div id="variant"></div>\n  <div id="rows"></div>\n  <button id="retry">Retry A &amp; B</button> <button id="link">Try C: obsidian:// link</button>\n  <details open>\n    <summary>Results to send back (copy or screenshot)</summary>\n    <textarea id="summary" readonly></textarea>\n  </details>\n  <details>\n    <summary>Log</summary>\n    <pre id="log"></pre>\n  </details>\n  <script src="app.js"></script>\n</body>\n</html>\n' }, "app.js": { "type": "text/javascript; charset=utf-8", "body": '"use strict";\n(() => {\n  var __create = Object.create;\n  var __defProp = Object.defineProperty;\n  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;\n  var __getOwnPropNames = Object.getOwnPropertyNames;\n  var __getProtoOf = Object.getPrototypeOf;\n  var __hasOwnProp = Object.prototype.hasOwnProperty;\n  var __commonJS = (cb, mod) => function __require() {\n    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;\n  };\n  var __copyProps = (to, from, except, desc) => {\n    if (from && typeof from === "object" || typeof from === "function") {\n      for (let key of __getOwnPropNames(from))\n        if (!__hasOwnProp.call(to, key) && key !== except)\n          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });\n    }\n    return to;\n  };\n  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(\n    // If the importer is in node compatibility mode or this is not an ESM\n    // file that has been converted to a CommonJS file using a Babel-\n    // compatible transform (i.e. "__esModule" has not been set), then set\n    // "default" to the CommonJS "module.exports" for node compatibility.\n    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,\n    mod\n  ));\n\n  // node_modules/events/events.js\n  var require_events = __commonJS({\n    "node_modules/events/events.js"(exports, module) {\n      "use strict";\n      var R = typeof Reflect === "object" ? Reflect : null;\n      var ReflectApply = R && typeof R.apply === "function" ? R.apply : function ReflectApply2(target, receiver, args) {\n        return Function.prototype.apply.call(target, receiver, args);\n      };\n      var ReflectOwnKeys;\n      if (R && typeof R.ownKeys === "function") {\n        ReflectOwnKeys = R.ownKeys;\n      } else if (Object.getOwnPropertySymbols) {\n        ReflectOwnKeys = function ReflectOwnKeys2(target) {\n          return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));\n        };\n      } else {\n        ReflectOwnKeys = function ReflectOwnKeys2(target) {\n          return Object.getOwnPropertyNames(target);\n        };\n      }\n      function ProcessEmitWarning(warning) {\n        if (console && console.warn) console.warn(warning);\n      }\n      var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value) {\n        return value !== value;\n      };\n      function EventEmitter2() {\n        EventEmitter2.init.call(this);\n      }\n      module.exports = EventEmitter2;\n      module.exports.once = once;\n      EventEmitter2.EventEmitter = EventEmitter2;\n      EventEmitter2.prototype._events = void 0;\n      EventEmitter2.prototype._eventsCount = 0;\n      EventEmitter2.prototype._maxListeners = void 0;\n      var defaultMaxListeners = 10;\n      function checkListener(listener) {\n        if (typeof listener !== "function") {\n          throw new TypeError(\'The "listener" argument must be of type Function. Received type \' + typeof listener);\n        }\n      }\n      Object.defineProperty(EventEmitter2, "defaultMaxListeners", {\n        enumerable: true,\n        get: function() {\n          return defaultMaxListeners;\n        },\n        set: function(arg) {\n          if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) {\n            throw new RangeError(\'The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received \' + arg + ".");\n          }\n          defaultMaxListeners = arg;\n        }\n      });\n      EventEmitter2.init = function() {\n        if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {\n          this._events = /* @__PURE__ */ Object.create(null);\n          this._eventsCount = 0;\n        }\n        this._maxListeners = this._maxListeners || void 0;\n      };\n      EventEmitter2.prototype.setMaxListeners = function setMaxListeners(n) {\n        if (typeof n !== "number" || n < 0 || NumberIsNaN(n)) {\n          throw new RangeError(\'The value of "n" is out of range. It must be a non-negative number. Received \' + n + ".");\n        }\n        this._maxListeners = n;\n        return this;\n      };\n      function _getMaxListeners(that) {\n        if (that._maxListeners === void 0)\n          return EventEmitter2.defaultMaxListeners;\n        return that._maxListeners;\n      }\n      EventEmitter2.prototype.getMaxListeners = function getMaxListeners() {\n        return _getMaxListeners(this);\n      };\n      EventEmitter2.prototype.emit = function emit(type) {\n        var args = [];\n        for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);\n        var doError = type === "error";\n        var events = this._events;\n        if (events !== void 0)\n          doError = doError && events.error === void 0;\n        else if (!doError)\n          return false;\n        if (doError) {\n          var er;\n          if (args.length > 0)\n            er = args[0];\n          if (er instanceof Error) {\n            throw er;\n          }\n          var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));\n          err.context = er;\n          throw err;\n        }\n        var handler = events[type];\n        if (handler === void 0)\n          return false;\n        if (typeof handler === "function") {\n          ReflectApply(handler, this, args);\n        } else {\n          var len = handler.length;\n          var listeners = arrayClone(handler, len);\n          for (var i = 0; i < len; ++i)\n            ReflectApply(listeners[i], this, args);\n        }\n        return true;\n      };\n      function _addListener(target, type, listener, prepend) {\n        var m;\n        var events;\n        var existing;\n        checkListener(listener);\n        events = target._events;\n        if (events === void 0) {\n          events = target._events = /* @__PURE__ */ Object.create(null);\n          target._eventsCount = 0;\n        } else {\n          if (events.newListener !== void 0) {\n            target.emit(\n              "newListener",\n              type,\n              listener.listener ? listener.listener : listener\n            );\n            events = target._events;\n          }\n          existing = events[type];\n        }\n        if (existing === void 0) {\n          existing = events[type] = listener;\n          ++target._eventsCount;\n        } else {\n          if (typeof existing === "function") {\n            existing = events[type] = prepend ? [listener, existing] : [existing, listener];\n          } else if (prepend) {\n            existing.unshift(listener);\n          } else {\n            existing.push(listener);\n          }\n          m = _getMaxListeners(target);\n          if (m > 0 && existing.length > m && !existing.warned) {\n            existing.warned = true;\n            var w = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");\n            w.name = "MaxListenersExceededWarning";\n            w.emitter = target;\n            w.type = type;\n            w.count = existing.length;\n            ProcessEmitWarning(w);\n          }\n        }\n        return target;\n      }\n      EventEmitter2.prototype.addListener = function addListener(type, listener) {\n        return _addListener(this, type, listener, false);\n      };\n      EventEmitter2.prototype.on = EventEmitter2.prototype.addListener;\n      EventEmitter2.prototype.prependListener = function prependListener(type, listener) {\n        return _addListener(this, type, listener, true);\n      };\n      function onceWrapper() {\n        if (!this.fired) {\n          this.target.removeListener(this.type, this.wrapFn);\n          this.fired = true;\n          if (arguments.length === 0)\n            return this.listener.call(this.target);\n          return this.listener.apply(this.target, arguments);\n        }\n      }\n      function _onceWrap(target, type, listener) {\n        var state = { fired: false, wrapFn: void 0, target, type, listener };\n        var wrapped = onceWrapper.bind(state);\n        wrapped.listener = listener;\n        state.wrapFn = wrapped;\n        return wrapped;\n      }\n      EventEmitter2.prototype.once = function once2(type, listener) {\n        checkListener(listener);\n        this.on(type, _onceWrap(this, type, listener));\n        return this;\n      };\n      EventEmitter2.prototype.prependOnceListener = function prependOnceListener(type, listener) {\n        checkListener(listener);\n        this.prependListener(type, _onceWrap(this, type, listener));\n        return this;\n      };\n      EventEmitter2.prototype.removeListener = function removeListener(type, listener) {\n        var list, events, position, i, originalListener;\n        checkListener(listener);\n        events = this._events;\n        if (events === void 0)\n          return this;\n        list = events[type];\n        if (list === void 0)\n          return this;\n        if (list === listener || list.listener === listener) {\n          if (--this._eventsCount === 0)\n            this._events = /* @__PURE__ */ Object.create(null);\n          else {\n            delete events[type];\n            if (events.removeListener)\n              this.emit("removeListener", type, list.listener || listener);\n          }\n        } else if (typeof list !== "function") {\n          position = -1;\n          for (i = list.length - 1; i >= 0; i--) {\n            if (list[i] === listener || list[i].listener === listener) {\n              originalListener = list[i].listener;\n              position = i;\n              break;\n            }\n          }\n          if (position < 0)\n            return this;\n          if (position === 0)\n            list.shift();\n          else {\n            spliceOne(list, position);\n          }\n          if (list.length === 1)\n            events[type] = list[0];\n          if (events.removeListener !== void 0)\n            this.emit("removeListener", type, originalListener || listener);\n        }\n        return this;\n      };\n      EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;\n      EventEmitter2.prototype.removeAllListeners = function removeAllListeners(type) {\n        var listeners, events, i;\n        events = this._events;\n        if (events === void 0)\n          return this;\n        if (events.removeListener === void 0) {\n          if (arguments.length === 0) {\n            this._events = /* @__PURE__ */ Object.create(null);\n            this._eventsCount = 0;\n          } else if (events[type] !== void 0) {\n            if (--this._eventsCount === 0)\n              this._events = /* @__PURE__ */ Object.create(null);\n            else\n              delete events[type];\n          }\n          return this;\n        }\n        if (arguments.length === 0) {\n          var keys = Object.keys(events);\n          var key;\n          for (i = 0; i < keys.length; ++i) {\n            key = keys[i];\n            if (key === "removeListener") continue;\n            this.removeAllListeners(key);\n          }\n          this.removeAllListeners("removeListener");\n          this._events = /* @__PURE__ */ Object.create(null);\n          this._eventsCount = 0;\n          return this;\n        }\n        listeners = events[type];\n        if (typeof listeners === "function") {\n          this.removeListener(type, listeners);\n        } else if (listeners !== void 0) {\n          for (i = listeners.length - 1; i >= 0; i--) {\n            this.removeListener(type, listeners[i]);\n          }\n        }\n        return this;\n      };\n      function _listeners(target, type, unwrap) {\n        var events = target._events;\n        if (events === void 0)\n          return [];\n        var evlistener = events[type];\n        if (evlistener === void 0)\n          return [];\n        if (typeof evlistener === "function")\n          return unwrap ? [evlistener.listener || evlistener] : [evlistener];\n        return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);\n      }\n      EventEmitter2.prototype.listeners = function listeners(type) {\n        return _listeners(this, type, true);\n      };\n      EventEmitter2.prototype.rawListeners = function rawListeners(type) {\n        return _listeners(this, type, false);\n      };\n      EventEmitter2.listenerCount = function(emitter, type) {\n        if (typeof emitter.listenerCount === "function") {\n          return emitter.listenerCount(type);\n        } else {\n          return listenerCount.call(emitter, type);\n        }\n      };\n      EventEmitter2.prototype.listenerCount = listenerCount;\n      function listenerCount(type) {\n        var events = this._events;\n        if (events !== void 0) {\n          var evlistener = events[type];\n          if (typeof evlistener === "function") {\n            return 1;\n          } else if (evlistener !== void 0) {\n            return evlistener.length;\n          }\n        }\n        return 0;\n      }\n      EventEmitter2.prototype.eventNames = function eventNames() {\n        return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];\n      };\n      function arrayClone(arr, n) {\n        var copy = new Array(n);\n        for (var i = 0; i < n; ++i)\n          copy[i] = arr[i];\n        return copy;\n      }\n      function spliceOne(list, index) {\n        for (; index + 1 < list.length; index++)\n          list[index] = list[index + 1];\n        list.pop();\n      }\n      function unwrapListeners(arr) {\n        var ret = new Array(arr.length);\n        for (var i = 0; i < ret.length; ++i) {\n          ret[i] = arr[i].listener || arr[i];\n        }\n        return ret;\n      }\n      function once(emitter, name) {\n        return new Promise(function(resolve, reject) {\n          function errorListener(err) {\n            emitter.removeListener(name, resolver);\n            reject(err);\n          }\n          function resolver() {\n            if (typeof emitter.removeListener === "function") {\n              emitter.removeListener("error", errorListener);\n            }\n            resolve([].slice.call(arguments));\n          }\n          ;\n          eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });\n          if (name !== "error") {\n            addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });\n          }\n        });\n      }\n      function addErrorHandlerIfEventEmitter(emitter, handler, flags) {\n        if (typeof emitter.on === "function") {\n          eventTargetAgnosticAddListener(emitter, "error", handler, flags);\n        }\n      }\n      function eventTargetAgnosticAddListener(emitter, name, listener, flags) {\n        if (typeof emitter.on === "function") {\n          if (flags.once) {\n            emitter.once(name, listener);\n          } else {\n            emitter.on(name, listener);\n          }\n        } else if (typeof emitter.addEventListener === "function") {\n          emitter.addEventListener(name, function wrapListener(arg) {\n            if (flags.once) {\n              emitter.removeEventListener(name, wrapListener);\n            }\n            listener(arg);\n          });\n        } else {\n          throw new TypeError(\'The "emitter" argument must be of type EventEmitter. Received type \' + typeof emitter);\n        }\n      }\n    }\n  });\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/PlayerApi.js\n  var __awaiter = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var PlayerApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    get id() {\n      if (!this.messageBus.userId) {\n        throw Error("Unable to get user ID: not ready");\n      }\n      return this.messageBus.userId;\n    }\n    getSelection() {\n      return __awaiter(this, void 0, void 0, function* () {\n        const { selection } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_SELECTION", {});\n        return selection;\n      });\n    }\n    select(items, replace) {\n      return __awaiter(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_PLAYER_SELECT", { items, replace });\n      });\n    }\n    deselect(items) {\n      return __awaiter(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_PLAYER_DESELECT", { items });\n      });\n    }\n    getName() {\n      return __awaiter(this, void 0, void 0, function* () {\n        const { name } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_NAME", {});\n        return name;\n      });\n    }\n    setName(name) {\n      return __awaiter(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_PLAYER_SET_NAME", { name });\n      });\n    }\n    getColor() {\n      return __awaiter(this, void 0, void 0, function* () {\n        const { color } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_COLOR", {});\n        return color;\n      });\n    }\n    setColor(color) {\n      return __awaiter(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_PLAYER_SET_COLOR", { color });\n      });\n    }\n    getSyncView() {\n      return __awaiter(this, void 0, void 0, function* () {\n        const { syncView } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_SYNC_VIEW", {});\n        return syncView;\n      });\n    }\n    setSyncView(syncView) {\n      return __awaiter(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_PLAYER_SET_SYNC_VIEW", { syncView });\n      });\n    }\n    getId() {\n      return __awaiter(this, void 0, void 0, function* () {\n        const { id } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_ID", {});\n        return id;\n      });\n    }\n    getRole() {\n      return __awaiter(this, void 0, void 0, function* () {\n        const { role: role2 } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_ROLE", {});\n        return role2;\n      });\n    }\n    getMetadata() {\n      return __awaiter(this, void 0, void 0, function* () {\n        const { metadata } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_METADATA", {});\n        return metadata;\n      });\n    }\n    setMetadata(update) {\n      return __awaiter(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_PLAYER_SET_METADATA", { update });\n      });\n    }\n    hasPermission(permission) {\n      return __awaiter(this, void 0, void 0, function* () {\n        const role2 = yield this.getRole();\n        if (role2 === "GM") {\n          return true;\n        }\n        const { permissions } = yield this.messageBus.sendAsync("OBR_ROOM_GET_PERMISSIONS", {});\n        return permissions.indexOf(permission) > -1;\n      });\n    }\n    getConnectionId() {\n      return __awaiter(this, void 0, void 0, function* () {\n        const { connectionId } = yield this.messageBus.sendAsync("OBR_PLAYER_GET_CONNECTION_ID", {});\n        return connectionId;\n      });\n    }\n    onChange(callback) {\n      const handleChange = (data) => {\n        callback(data.player);\n      };\n      this.messageBus.send("OBR_PLAYER_SUBSCRIBE", {});\n      this.messageBus.on("OBR_PLAYER_EVENT_CHANGE", handleChange);\n      return () => {\n        this.messageBus.send("OBR_PLAYER_UNSUBSCRIBE", {});\n        this.messageBus.off("OBR_PLAYER_EVENT_CHANGE", handleChange);\n      };\n    }\n  };\n  var PlayerApi_default = PlayerApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/ViewportApi.js\n  var __awaiter2 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var ViewportApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    reset() {\n      return __awaiter2(this, void 0, void 0, function* () {\n        const { transform } = yield this.messageBus.sendAsync("OBR_VIEWPORT_RESET", {});\n        return transform;\n      });\n    }\n    animateTo(transform) {\n      return __awaiter2(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_VIEWPORT_ANIMATE_TO", { transform });\n      });\n    }\n    animateToBounds(bounds) {\n      return __awaiter2(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_VIEWPORT_ANIMATE_TO_BOUNDS", {\n          bounds\n        });\n      });\n    }\n    getPosition() {\n      return __awaiter2(this, void 0, void 0, function* () {\n        const { position } = yield this.messageBus.sendAsync("OBR_VIEWPORT_GET_POSITION", {});\n        return position;\n      });\n    }\n    setPosition(position) {\n      return __awaiter2(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_VIEWPORT_SET_POSITION", { position });\n      });\n    }\n    getScale() {\n      return __awaiter2(this, void 0, void 0, function* () {\n        const { scale } = yield this.messageBus.sendAsync("OBR_VIEWPORT_GET_SCALE", {});\n        return scale;\n      });\n    }\n    setScale(scale) {\n      return __awaiter2(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_VIEWPORT_SET_SCALE", { scale });\n      });\n    }\n    getWidth() {\n      return __awaiter2(this, void 0, void 0, function* () {\n        const { width } = yield this.messageBus.sendAsync("OBR_VIEWPORT_GET_WIDTH", {});\n        return width;\n      });\n    }\n    getHeight() {\n      return __awaiter2(this, void 0, void 0, function* () {\n        const { height } = yield this.messageBus.sendAsync("OBR_VIEWPORT_GET_HEIGHT", {});\n        return height;\n      });\n    }\n    transformPoint(point) {\n      return __awaiter2(this, void 0, void 0, function* () {\n        const { point: transformed } = yield this.messageBus.sendAsync("OBR_VIEWPORT_TRANSFORM_POINT", { point });\n        return transformed;\n      });\n    }\n    inverseTransformPoint(point) {\n      return __awaiter2(this, void 0, void 0, function* () {\n        const { point: transformed } = yield this.messageBus.sendAsync("OBR_VIEWPORT_INVERSE_TRANSFORM_POINT", { point });\n        return transformed;\n      });\n    }\n  };\n  var ViewportApi_default = ViewportApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/messages/Message.js\n  function isMessage(message) {\n    return typeof message.id === "string";\n  }\n\n  // node_modules/@owlbear-rodeo/sdk/lib/messages/MessageBus.js\n  var import_events = __toESM(require_events());\n\n  // node_modules/uuid/dist/esm-browser/rng.js\n  var getRandomValues;\n  var rnds8 = new Uint8Array(16);\n  function rng() {\n    if (!getRandomValues) {\n      getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);\n      if (!getRandomValues) {\n        throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");\n      }\n    }\n    return getRandomValues(rnds8);\n  }\n\n  // node_modules/uuid/dist/esm-browser/stringify.js\n  var byteToHex = [];\n  for (let i = 0; i < 256; ++i) {\n    byteToHex.push((i + 256).toString(16).slice(1));\n  }\n  function unsafeStringify(arr, offset = 0) {\n    return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];\n  }\n\n  // node_modules/uuid/dist/esm-browser/native.js\n  var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);\n  var native_default = {\n    randomUUID\n  };\n\n  // node_modules/uuid/dist/esm-browser/v4.js\n  function v4(options, buf, offset) {\n    if (native_default.randomUUID && !buf && !options) {\n      return native_default.randomUUID();\n    }\n    options = options || {};\n    const rnds = options.random || (options.rng || rng)();\n    rnds[6] = rnds[6] & 15 | 64;\n    rnds[8] = rnds[8] & 63 | 128;\n    if (buf) {\n      offset = offset || 0;\n      for (let i = 0; i < 16; ++i) {\n        buf[offset + i] = rnds[i];\n      }\n      return buf;\n    }\n    return unsafeStringify(rnds);\n  }\n  var v4_default = v4;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/messages/MessageBus.js\n  var MessageBus = class extends import_events.EventEmitter {\n    constructor(origin, roomId) {\n      super();\n      this.ready = false;\n      this.userId = null;\n      this.ref = null;\n      this.handleMessage = (event) => {\n        const message = event.data;\n        if (event.origin === this.targetOrigin && isMessage(message)) {\n          if (message.id === "OBR_READY") {\n            this.ready = true;\n            const data = message.data;\n            this.ref = data.ref;\n            this.userId = data.userId;\n          }\n          this.emit(message.id, message.data);\n        }\n      };\n      this.send = (id, data, nonce) => {\n        var _a;\n        if (!this.ref) {\n          throw Error("Unable to send message: not ready");\n        }\n        (_a = window.parent) === null || _a === void 0 ? void 0 : _a.postMessage({\n          id,\n          data,\n          ref: this.ref,\n          nonce\n        }, this.targetOrigin);\n      };\n      this.sendAsync = (id, data, timeout = 5e3) => {\n        const nonce = `_${v4_default()}`;\n        this.send(id, data, nonce);\n        return Promise.race([\n          new Promise((resolve, reject) => {\n            const self = this;\n            function onResponse(value) {\n              self.off(`${id}_RESPONSE${nonce}`, onResponse);\n              self.off(`${id}_ERROR${nonce}`, onError);\n              resolve(value);\n            }\n            function onError(error) {\n              self.off(`${id}_RESPONSE${nonce}`, onResponse);\n              self.off(`${id}_ERROR${nonce}`, onError);\n              reject(error);\n            }\n            this.on(`${id}_RESPONSE${nonce}`, onResponse);\n            this.on(`${id}_ERROR${nonce}`, onError);\n          }),\n          ...timeout > 0 ? [\n            new Promise((_, reject) => window.setTimeout(() => reject(new Error(`Message ${id} took longer than ${timeout}ms to get a result`)), timeout))\n          ] : []\n        ]);\n      };\n      this.roomId = roomId;\n      this.targetOrigin = origin;\n      window.addEventListener("message", this.handleMessage);\n      this.setMaxListeners(100);\n    }\n    destroy() {\n      window.removeEventListener("message", this.handleMessage);\n    }\n  };\n  var MessageBus_default = MessageBus;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/NotificationApi.js\n  var __awaiter3 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var NotificationApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    show(message, variant2) {\n      return __awaiter3(this, void 0, void 0, function* () {\n        const { id } = yield this.messageBus.sendAsync("OBR_NOTIFICATION_SHOW", { message, variant: variant2 });\n        return id;\n      });\n    }\n    close(id) {\n      return __awaiter3(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_NOTIFICATION_CLOSE", { id });\n      });\n    }\n  };\n  var NotificationApi_default = NotificationApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/scene/SceneFogApi.js\n  var __awaiter4 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var SceneFogApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    getColor() {\n      return __awaiter4(this, void 0, void 0, function* () {\n        const { color } = yield this.messageBus.sendAsync("OBR_SCENE_FOG_GET_COLOR", {});\n        return color;\n      });\n    }\n    setColor(color) {\n      return __awaiter4(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_FOG_SET_COLOR", { color });\n      });\n    }\n    getStrokeWidth() {\n      return __awaiter4(this, void 0, void 0, function* () {\n        const { strokeWidth } = yield this.messageBus.sendAsync("OBR_SCENE_FOG_GET_STROKE_WIDTH", {});\n        return strokeWidth;\n      });\n    }\n    setStrokeWidth(strokeWidth) {\n      return __awaiter4(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_FOG_SET_STROKE_WIDTH", {\n          strokeWidth\n        });\n      });\n    }\n    getFilled() {\n      return __awaiter4(this, void 0, void 0, function* () {\n        const { filled } = yield this.messageBus.sendAsync("OBR_SCENE_FOG_GET_FILLED", {});\n        return filled;\n      });\n    }\n    setFilled(filled) {\n      return __awaiter4(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_FOG_SET_FILLED", { filled });\n      });\n    }\n    onChange(callback) {\n      const handleChange = (data) => {\n        callback(data.fog);\n      };\n      this.messageBus.send("OBR_SCENE_FOG_SUBSCRIBE", {});\n      this.messageBus.on("OBR_SCENE_FOG_EVENT_CHANGE", handleChange);\n      return () => {\n        this.messageBus.send("OBR_SCENE_FOG_UNSUBSCRIBE", {});\n        this.messageBus.off("OBR_SCENE_FOG_EVENT_CHANGE", handleChange);\n      };\n    }\n  };\n  var SceneFogApi_default = SceneFogApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/scene/SceneGridApi.js\n  var __awaiter5 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var SceneGridApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    getDpi() {\n      return __awaiter5(this, void 0, void 0, function* () {\n        const { dpi } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_DPI", {});\n        return dpi;\n      });\n    }\n    getScale() {\n      return __awaiter5(this, void 0, void 0, function* () {\n        const scale = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_SCALE", {});\n        return scale;\n      });\n    }\n    setScale(scale) {\n      return __awaiter5(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_GRID_SET_SCALE", { scale });\n      });\n    }\n    getColor() {\n      return __awaiter5(this, void 0, void 0, function* () {\n        const { color } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_COLOR", {});\n        return color;\n      });\n    }\n    setColor(color) {\n      return __awaiter5(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_GRID_SET_COLOR", { color });\n      });\n    }\n    getOpacity() {\n      return __awaiter5(this, void 0, void 0, function* () {\n        const { opacity } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_OPACITY", {});\n        return opacity;\n      });\n    }\n    setOpacity(opacity) {\n      return __awaiter5(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_GRID_SET_OPACITY", { opacity });\n      });\n    }\n    getType() {\n      return __awaiter5(this, void 0, void 0, function* () {\n        const { type } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_TYPE", {});\n        return type;\n      });\n    }\n    setType(type) {\n      return __awaiter5(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_GRID_SET_TYPE", { type });\n      });\n    }\n    getLineType() {\n      return __awaiter5(this, void 0, void 0, function* () {\n        const { lineType } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_LINE_TYPE", {});\n        return lineType;\n      });\n    }\n    setLineType(lineType) {\n      return __awaiter5(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_GRID_SET_LINE_TYPE", {\n          lineType\n        });\n      });\n    }\n    getMeasurement() {\n      return __awaiter5(this, void 0, void 0, function* () {\n        const { measurement } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_MEASUREMENT", {});\n        return measurement;\n      });\n    }\n    setMeasurement(measurement) {\n      return __awaiter5(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_GRID_SET_MEASUREMENT", {\n          measurement\n        });\n      });\n    }\n    getLineWidth() {\n      return __awaiter5(this, void 0, void 0, function* () {\n        const { lineWidth } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_LINE_WIDTH", {});\n        return lineWidth;\n      });\n    }\n    setLineWidth(lineWidth) {\n      return __awaiter5(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_GRID_SET_LINE_WIDTH", {\n          lineWidth\n        });\n      });\n    }\n    snapPosition(position, snappingSensitivity, useCorners, useCenter) {\n      return __awaiter5(this, void 0, void 0, function* () {\n        const { position: snapped } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_SNAP_POSITION", {\n          position,\n          snappingSensitivity,\n          useCorners,\n          useCenter\n        });\n        return snapped;\n      });\n    }\n    getDistance(from, to) {\n      return __awaiter5(this, void 0, void 0, function* () {\n        const { distance } = yield this.messageBus.sendAsync("OBR_SCENE_GRID_GET_DISTANCE", { from, to });\n        return distance;\n      });\n    }\n    onChange(callback) {\n      const handleChange = (data) => {\n        callback(data.grid);\n      };\n      this.messageBus.send("OBR_SCENE_GRID_SUBSCRIBE", {});\n      this.messageBus.on("OBR_SCENE_GRID_EVENT_CHANGE", handleChange);\n      return () => {\n        this.messageBus.send("OBR_SCENE_GRID_UNSUBSCRIBE", {});\n        this.messageBus.off("OBR_SCENE_GRID_EVENT_CHANGE", handleChange);\n      };\n    }\n  };\n  var SceneGridApi_default = SceneGridApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/scene/SceneHistoryApi.js\n  var __awaiter6 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var SceneHistoryApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    undo() {\n      return __awaiter6(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_HISTORY_UNDO", {});\n      });\n    }\n    redo() {\n      return __awaiter6(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_HISTORY_REDO", {});\n      });\n    }\n    canUndo() {\n      return __awaiter6(this, void 0, void 0, function* () {\n        const { canUndo } = yield this.messageBus.sendAsync("OBR_SCENE_HISTORY_CAN_UNDO", {});\n        return canUndo;\n      });\n    }\n    canRedo() {\n      return __awaiter6(this, void 0, void 0, function* () {\n        const { canRedo } = yield this.messageBus.sendAsync("OBR_SCENE_HISTORY_CAN_REDO", {});\n        return canRedo;\n      });\n    }\n  };\n  var SceneHistoryApi_default = SceneHistoryApi;\n\n  // node_modules/immer/dist/immer.mjs\n  var NOTHING = Symbol.for("immer-nothing");\n  var DRAFTABLE = Symbol.for("immer-draftable");\n  var DRAFT_STATE = Symbol.for("immer-state");\n  var errors = true ? [\n    // All error codes, starting by 0:\n    function(plugin) {\n      return `The plugin for \'${plugin}\' has not been loaded into Immer. To enable the plugin, import and call \\`enable${plugin}()\\` when initializing your application.`;\n    },\n    function(thing) {\n      return `produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with \'[immerable]: true\'. Got \'${thing}\'`;\n    },\n    "This object has been frozen and should not be mutated",\n    function(data) {\n      return "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " + data;\n    },\n    "An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.",\n    "Immer forbids circular references",\n    "The first or second argument to `produce` must be a function",\n    "The third argument to `produce` must be a function or undefined",\n    "First argument to `createDraft` must be a plain object, an array, or an immerable object",\n    "First argument to `finishDraft` must be a draft returned by `createDraft`",\n    function(thing) {\n      return `\'current\' expects a draft, got: ${thing}`;\n    },\n    "Object.defineProperty() cannot be used on an Immer draft",\n    "Object.setPrototypeOf() cannot be used on an Immer draft",\n    "Immer only supports deleting array indices",\n    "Immer only supports setting array indices and the \'length\' property",\n    function(thing) {\n      return `\'original\' expects a draft, got: ${thing}`;\n    }\n    // Note: if more errors are added, the errorOffset in Patches.ts should be increased\n    // See Patches.ts for additional errors\n  ] : [];\n  function die(error, ...args) {\n    if (true) {\n      const e = errors[error];\n      const msg = typeof e === "function" ? e.apply(null, args) : e;\n      throw new Error(`[Immer] ${msg}`);\n    }\n    throw new Error(\n      `[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`\n    );\n  }\n  var getPrototypeOf = Object.getPrototypeOf;\n  function isDraft(value) {\n    return !!value && !!value[DRAFT_STATE];\n  }\n  function isDraftable(value) {\n    if (!value)\n      return false;\n    return isPlainObject(value) || Array.isArray(value) || !!value[DRAFTABLE] || !!value.constructor?.[DRAFTABLE] || isMap(value) || isSet(value);\n  }\n  var objectCtorString = Object.prototype.constructor.toString();\n  var cachedCtorStrings = /* @__PURE__ */ new WeakMap();\n  function isPlainObject(value) {\n    if (!value || typeof value !== "object")\n      return false;\n    const proto = Object.getPrototypeOf(value);\n    if (proto === null || proto === Object.prototype)\n      return true;\n    const Ctor = Object.hasOwnProperty.call(proto, "constructor") && proto.constructor;\n    if (Ctor === Object)\n      return true;\n    if (typeof Ctor !== "function")\n      return false;\n    let ctorString = cachedCtorStrings.get(Ctor);\n    if (ctorString === void 0) {\n      ctorString = Function.toString.call(Ctor);\n      cachedCtorStrings.set(Ctor, ctorString);\n    }\n    return ctorString === objectCtorString;\n  }\n  function each(obj, iter, strict = true) {\n    if (getArchtype(obj) === 0) {\n      const keys = strict ? Reflect.ownKeys(obj) : Object.keys(obj);\n      keys.forEach((key) => {\n        iter(key, obj[key], obj);\n      });\n    } else {\n      obj.forEach((entry, index) => iter(index, entry, obj));\n    }\n  }\n  function getArchtype(thing) {\n    const state = thing[DRAFT_STATE];\n    return state ? state.type_ : Array.isArray(thing) ? 1 : isMap(thing) ? 2 : isSet(thing) ? 3 : 0;\n  }\n  function has(thing, prop) {\n    return getArchtype(thing) === 2 ? thing.has(prop) : Object.prototype.hasOwnProperty.call(thing, prop);\n  }\n  function get(thing, prop) {\n    return getArchtype(thing) === 2 ? thing.get(prop) : thing[prop];\n  }\n  function set(thing, propOrOldValue, value) {\n    const t = getArchtype(thing);\n    if (t === 2)\n      thing.set(propOrOldValue, value);\n    else if (t === 3) {\n      thing.add(value);\n    } else\n      thing[propOrOldValue] = value;\n  }\n  function is(x, y) {\n    if (x === y) {\n      return x !== 0 || 1 / x === 1 / y;\n    } else {\n      return x !== x && y !== y;\n    }\n  }\n  function isMap(target) {\n    return target instanceof Map;\n  }\n  function isSet(target) {\n    return target instanceof Set;\n  }\n  function latest(state) {\n    return state.copy_ || state.base_;\n  }\n  function shallowCopy(base, strict) {\n    if (isMap(base)) {\n      return new Map(base);\n    }\n    if (isSet(base)) {\n      return new Set(base);\n    }\n    if (Array.isArray(base))\n      return Array.prototype.slice.call(base);\n    const isPlain = isPlainObject(base);\n    if (strict === true || strict === "class_only" && !isPlain) {\n      const descriptors = Object.getOwnPropertyDescriptors(base);\n      delete descriptors[DRAFT_STATE];\n      let keys = Reflect.ownKeys(descriptors);\n      for (let i = 0; i < keys.length; i++) {\n        const key = keys[i];\n        const desc = descriptors[key];\n        if (desc.writable === false) {\n          desc.writable = true;\n          desc.configurable = true;\n        }\n        if (desc.get || desc.set)\n          descriptors[key] = {\n            configurable: true,\n            writable: true,\n            // could live with !!desc.set as well here...\n            enumerable: desc.enumerable,\n            value: base[key]\n          };\n      }\n      return Object.create(getPrototypeOf(base), descriptors);\n    } else {\n      const proto = getPrototypeOf(base);\n      if (proto !== null && isPlain) {\n        return { ...base };\n      }\n      const obj = Object.create(proto);\n      return Object.assign(obj, base);\n    }\n  }\n  function freeze(obj, deep = false) {\n    if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj))\n      return obj;\n    if (getArchtype(obj) > 1) {\n      Object.defineProperties(obj, {\n        set: dontMutateMethodOverride,\n        add: dontMutateMethodOverride,\n        clear: dontMutateMethodOverride,\n        delete: dontMutateMethodOverride\n      });\n    }\n    Object.freeze(obj);\n    if (deep)\n      Object.values(obj).forEach((value) => freeze(value, true));\n    return obj;\n  }\n  function dontMutateFrozenCollections() {\n    die(2);\n  }\n  var dontMutateMethodOverride = {\n    value: dontMutateFrozenCollections\n  };\n  function isFrozen(obj) {\n    if (obj === null || typeof obj !== "object")\n      return true;\n    return Object.isFrozen(obj);\n  }\n  var plugins = {};\n  function getPlugin(pluginKey) {\n    const plugin = plugins[pluginKey];\n    if (!plugin) {\n      die(0, pluginKey);\n    }\n    return plugin;\n  }\n  function loadPlugin(pluginKey, implementation) {\n    if (!plugins[pluginKey])\n      plugins[pluginKey] = implementation;\n  }\n  var currentScope;\n  function getCurrentScope() {\n    return currentScope;\n  }\n  function createScope(parent_, immer_) {\n    return {\n      drafts_: [],\n      parent_,\n      immer_,\n      // Whenever the modified draft contains a draft from another scope, we\n      // need to prevent auto-freezing so the unowned draft can be finalized.\n      canAutoFreeze_: true,\n      unfinalizedDrafts_: 0\n    };\n  }\n  function usePatchesInScope(scope, patchListener) {\n    if (patchListener) {\n      getPlugin("Patches");\n      scope.patches_ = [];\n      scope.inversePatches_ = [];\n      scope.patchListener_ = patchListener;\n    }\n  }\n  function revokeScope(scope) {\n    leaveScope(scope);\n    scope.drafts_.forEach(revokeDraft);\n    scope.drafts_ = null;\n  }\n  function leaveScope(scope) {\n    if (scope === currentScope) {\n      currentScope = scope.parent_;\n    }\n  }\n  function enterScope(immer2) {\n    return currentScope = createScope(currentScope, immer2);\n  }\n  function revokeDraft(draft) {\n    const state = draft[DRAFT_STATE];\n    if (state.type_ === 0 || state.type_ === 1)\n      state.revoke_();\n    else\n      state.revoked_ = true;\n  }\n  function processResult(result, scope) {\n    scope.unfinalizedDrafts_ = scope.drafts_.length;\n    const baseDraft = scope.drafts_[0];\n    const isReplaced = result !== void 0 && result !== baseDraft;\n    if (isReplaced) {\n      if (baseDraft[DRAFT_STATE].modified_) {\n        revokeScope(scope);\n        die(4);\n      }\n      if (isDraftable(result)) {\n        result = finalize(scope, result);\n        if (!scope.parent_)\n          maybeFreeze(scope, result);\n      }\n      if (scope.patches_) {\n        getPlugin("Patches").generateReplacementPatches_(\n          baseDraft[DRAFT_STATE].base_,\n          result,\n          scope.patches_,\n          scope.inversePatches_\n        );\n      }\n    } else {\n      result = finalize(scope, baseDraft, []);\n    }\n    revokeScope(scope);\n    if (scope.patches_) {\n      scope.patchListener_(scope.patches_, scope.inversePatches_);\n    }\n    return result !== NOTHING ? result : void 0;\n  }\n  function finalize(rootScope, value, path) {\n    if (isFrozen(value))\n      return value;\n    const useStrictIteration = rootScope.immer_.shouldUseStrictIteration();\n    const state = value[DRAFT_STATE];\n    if (!state) {\n      each(\n        value,\n        (key, childValue) => finalizeProperty(rootScope, state, value, key, childValue, path),\n        useStrictIteration\n      );\n      return value;\n    }\n    if (state.scope_ !== rootScope)\n      return value;\n    if (!state.modified_) {\n      maybeFreeze(rootScope, state.base_, true);\n      return state.base_;\n    }\n    if (!state.finalized_) {\n      state.finalized_ = true;\n      state.scope_.unfinalizedDrafts_--;\n      const result = state.copy_;\n      let resultEach = result;\n      let isSet2 = false;\n      if (state.type_ === 3) {\n        resultEach = new Set(result);\n        result.clear();\n        isSet2 = true;\n      }\n      each(\n        resultEach,\n        (key, childValue) => finalizeProperty(\n          rootScope,\n          state,\n          result,\n          key,\n          childValue,\n          path,\n          isSet2\n        ),\n        useStrictIteration\n      );\n      maybeFreeze(rootScope, result, false);\n      if (path && rootScope.patches_) {\n        getPlugin("Patches").generatePatches_(\n          state,\n          path,\n          rootScope.patches_,\n          rootScope.inversePatches_\n        );\n      }\n    }\n    return state.copy_;\n  }\n  function finalizeProperty(rootScope, parentState, targetObject, prop, childValue, rootPath, targetIsSet) {\n    if (childValue == null) {\n      return;\n    }\n    if (typeof childValue !== "object" && !targetIsSet) {\n      return;\n    }\n    const childIsFrozen = isFrozen(childValue);\n    if (childIsFrozen && !targetIsSet) {\n      return;\n    }\n    if (childValue === targetObject)\n      die(5);\n    if (isDraft(childValue)) {\n      const path = rootPath && parentState && parentState.type_ !== 3 && // Set objects are atomic since they have no keys.\n      !has(parentState.assigned_, prop) ? rootPath.concat(prop) : void 0;\n      const res = finalize(rootScope, childValue, path);\n      set(targetObject, prop, res);\n      if (isDraft(res)) {\n        rootScope.canAutoFreeze_ = false;\n      } else\n        return;\n    } else if (targetIsSet) {\n      targetObject.add(childValue);\n    }\n    if (isDraftable(childValue) && !childIsFrozen) {\n      if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {\n        return;\n      }\n      if (parentState && parentState.base_ && parentState.base_[prop] === childValue && childIsFrozen) {\n        return;\n      }\n      finalize(rootScope, childValue);\n      if ((!parentState || !parentState.scope_.parent_) && typeof prop !== "symbol" && (isMap(targetObject) ? targetObject.has(prop) : Object.prototype.propertyIsEnumerable.call(targetObject, prop)))\n        maybeFreeze(rootScope, childValue);\n    }\n  }\n  function maybeFreeze(scope, value, deep = false) {\n    if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {\n      freeze(value, deep);\n    }\n  }\n  function createProxyProxy(base, parent) {\n    const isArray = Array.isArray(base);\n    const state = {\n      type_: isArray ? 1 : 0,\n      // Track which produce call this is associated with.\n      scope_: parent ? parent.scope_ : getCurrentScope(),\n      // True for both shallow and deep changes.\n      modified_: false,\n      // Used during finalization.\n      finalized_: false,\n      // Track which properties have been assigned (true) or deleted (false).\n      assigned_: {},\n      // The parent draft state.\n      parent_: parent,\n      // The base state.\n      base_: base,\n      // The base proxy.\n      draft_: null,\n      // set below\n      // The base copy with any updated values.\n      copy_: null,\n      // Called by the `produce` function.\n      revoke_: null,\n      isManual_: false\n    };\n    let target = state;\n    let traps = objectTraps;\n    if (isArray) {\n      target = [state];\n      traps = arrayTraps;\n    }\n    const { revoke, proxy } = Proxy.revocable(target, traps);\n    state.draft_ = proxy;\n    state.revoke_ = revoke;\n    return proxy;\n  }\n  var objectTraps = {\n    get(state, prop) {\n      if (prop === DRAFT_STATE)\n        return state;\n      const source = latest(state);\n      if (!has(source, prop)) {\n        return readPropFromProto(state, source, prop);\n      }\n      const value = source[prop];\n      if (state.finalized_ || !isDraftable(value)) {\n        return value;\n      }\n      if (value === peek(state.base_, prop)) {\n        prepareCopy(state);\n        return state.copy_[prop] = createProxy(value, state);\n      }\n      return value;\n    },\n    has(state, prop) {\n      return prop in latest(state);\n    },\n    ownKeys(state) {\n      return Reflect.ownKeys(latest(state));\n    },\n    set(state, prop, value) {\n      const desc = getDescriptorFromProto(latest(state), prop);\n      if (desc?.set) {\n        desc.set.call(state.draft_, value);\n        return true;\n      }\n      if (!state.modified_) {\n        const current2 = peek(latest(state), prop);\n        const currentState = current2?.[DRAFT_STATE];\n        if (currentState && currentState.base_ === value) {\n          state.copy_[prop] = value;\n          state.assigned_[prop] = false;\n          return true;\n        }\n        if (is(value, current2) && (value !== void 0 || has(state.base_, prop)))\n          return true;\n        prepareCopy(state);\n        markChanged(state);\n      }\n      if (state.copy_[prop] === value && // special case: handle new props with value \'undefined\'\n      (value !== void 0 || prop in state.copy_) || // special case: NaN\n      Number.isNaN(value) && Number.isNaN(state.copy_[prop]))\n        return true;\n      state.copy_[prop] = value;\n      state.assigned_[prop] = true;\n      return true;\n    },\n    deleteProperty(state, prop) {\n      if (peek(state.base_, prop) !== void 0 || prop in state.base_) {\n        state.assigned_[prop] = false;\n        prepareCopy(state);\n        markChanged(state);\n      } else {\n        delete state.assigned_[prop];\n      }\n      if (state.copy_) {\n        delete state.copy_[prop];\n      }\n      return true;\n    },\n    // Note: We never coerce `desc.value` into an Immer draft, because we can\'t make\n    // the same guarantee in ES5 mode.\n    getOwnPropertyDescriptor(state, prop) {\n      const owner = latest(state);\n      const desc = Reflect.getOwnPropertyDescriptor(owner, prop);\n      if (!desc)\n        return desc;\n      return {\n        writable: true,\n        configurable: state.type_ !== 1 || prop !== "length",\n        enumerable: desc.enumerable,\n        value: owner[prop]\n      };\n    },\n    defineProperty() {\n      die(11);\n    },\n    getPrototypeOf(state) {\n      return getPrototypeOf(state.base_);\n    },\n    setPrototypeOf() {\n      die(12);\n    }\n  };\n  var arrayTraps = {};\n  each(objectTraps, (key, fn) => {\n    arrayTraps[key] = function() {\n      arguments[0] = arguments[0][0];\n      return fn.apply(this, arguments);\n    };\n  });\n  arrayTraps.deleteProperty = function(state, prop) {\n    if (isNaN(parseInt(prop)))\n      die(13);\n    return arrayTraps.set.call(this, state, prop, void 0);\n  };\n  arrayTraps.set = function(state, prop, value) {\n    if (prop !== "length" && isNaN(parseInt(prop)))\n      die(14);\n    return objectTraps.set.call(this, state[0], prop, value, state[0]);\n  };\n  function peek(draft, prop) {\n    const state = draft[DRAFT_STATE];\n    const source = state ? latest(state) : draft;\n    return source[prop];\n  }\n  function readPropFromProto(state, source, prop) {\n    const desc = getDescriptorFromProto(source, prop);\n    return desc ? `value` in desc ? desc.value : (\n      // This is a very special case, if the prop is a getter defined by the\n      // prototype, we should invoke it with the draft as context!\n      desc.get?.call(state.draft_)\n    ) : void 0;\n  }\n  function getDescriptorFromProto(source, prop) {\n    if (!(prop in source))\n      return void 0;\n    let proto = getPrototypeOf(source);\n    while (proto) {\n      const desc = Object.getOwnPropertyDescriptor(proto, prop);\n      if (desc)\n        return desc;\n      proto = getPrototypeOf(proto);\n    }\n    return void 0;\n  }\n  function markChanged(state) {\n    if (!state.modified_) {\n      state.modified_ = true;\n      if (state.parent_) {\n        markChanged(state.parent_);\n      }\n    }\n  }\n  function prepareCopy(state) {\n    if (!state.copy_) {\n      state.copy_ = shallowCopy(\n        state.base_,\n        state.scope_.immer_.useStrictShallowCopy_\n      );\n    }\n  }\n  var Immer2 = class {\n    constructor(config) {\n      this.autoFreeze_ = true;\n      this.useStrictShallowCopy_ = false;\n      this.useStrictIteration_ = true;\n      this.produce = (base, recipe, patchListener) => {\n        if (typeof base === "function" && typeof recipe !== "function") {\n          const defaultBase = recipe;\n          recipe = base;\n          const self = this;\n          return function curriedProduce(base2 = defaultBase, ...args) {\n            return self.produce(base2, (draft) => recipe.call(this, draft, ...args));\n          };\n        }\n        if (typeof recipe !== "function")\n          die(6);\n        if (patchListener !== void 0 && typeof patchListener !== "function")\n          die(7);\n        let result;\n        if (isDraftable(base)) {\n          const scope = enterScope(this);\n          const proxy = createProxy(base, void 0);\n          let hasError = true;\n          try {\n            result = recipe(proxy);\n            hasError = false;\n          } finally {\n            if (hasError)\n              revokeScope(scope);\n            else\n              leaveScope(scope);\n          }\n          usePatchesInScope(scope, patchListener);\n          return processResult(result, scope);\n        } else if (!base || typeof base !== "object") {\n          result = recipe(base);\n          if (result === void 0)\n            result = base;\n          if (result === NOTHING)\n            result = void 0;\n          if (this.autoFreeze_)\n            freeze(result, true);\n          if (patchListener) {\n            const p = [];\n            const ip = [];\n            getPlugin("Patches").generateReplacementPatches_(base, result, p, ip);\n            patchListener(p, ip);\n          }\n          return result;\n        } else\n          die(1, base);\n      };\n      this.produceWithPatches = (base, recipe) => {\n        if (typeof base === "function") {\n          return (state, ...args) => this.produceWithPatches(state, (draft) => base(draft, ...args));\n        }\n        let patches, inversePatches;\n        const result = this.produce(base, recipe, (p, ip) => {\n          patches = p;\n          inversePatches = ip;\n        });\n        return [result, patches, inversePatches];\n      };\n      if (typeof config?.autoFreeze === "boolean")\n        this.setAutoFreeze(config.autoFreeze);\n      if (typeof config?.useStrictShallowCopy === "boolean")\n        this.setUseStrictShallowCopy(config.useStrictShallowCopy);\n      if (typeof config?.useStrictIteration === "boolean")\n        this.setUseStrictIteration(config.useStrictIteration);\n    }\n    createDraft(base) {\n      if (!isDraftable(base))\n        die(8);\n      if (isDraft(base))\n        base = current(base);\n      const scope = enterScope(this);\n      const proxy = createProxy(base, void 0);\n      proxy[DRAFT_STATE].isManual_ = true;\n      leaveScope(scope);\n      return proxy;\n    }\n    finishDraft(draft, patchListener) {\n      const state = draft && draft[DRAFT_STATE];\n      if (!state || !state.isManual_)\n        die(9);\n      const { scope_: scope } = state;\n      usePatchesInScope(scope, patchListener);\n      return processResult(void 0, scope);\n    }\n    /**\n     * Pass true to automatically freeze all copies created by Immer.\n     *\n     * By default, auto-freezing is enabled.\n     */\n    setAutoFreeze(value) {\n      this.autoFreeze_ = value;\n    }\n    /**\n     * Pass true to enable strict shallow copy.\n     *\n     * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.\n     */\n    setUseStrictShallowCopy(value) {\n      this.useStrictShallowCopy_ = value;\n    }\n    /**\n     * Pass false to use faster iteration that skips non-enumerable properties\n     * but still handles symbols for compatibility.\n     *\n     * By default, strict iteration is enabled (includes all own properties).\n     */\n    setUseStrictIteration(value) {\n      this.useStrictIteration_ = value;\n    }\n    shouldUseStrictIteration() {\n      return this.useStrictIteration_;\n    }\n    applyPatches(base, patches) {\n      let i;\n      for (i = patches.length - 1; i >= 0; i--) {\n        const patch = patches[i];\n        if (patch.path.length === 0 && patch.op === "replace") {\n          base = patch.value;\n          break;\n        }\n      }\n      if (i > -1) {\n        patches = patches.slice(i + 1);\n      }\n      const applyPatchesImpl = getPlugin("Patches").applyPatches_;\n      if (isDraft(base)) {\n        return applyPatchesImpl(base, patches);\n      }\n      return this.produce(\n        base,\n        (draft) => applyPatchesImpl(draft, patches)\n      );\n    }\n  };\n  function createProxy(value, parent) {\n    const draft = isMap(value) ? getPlugin("MapSet").proxyMap_(value, parent) : isSet(value) ? getPlugin("MapSet").proxySet_(value, parent) : createProxyProxy(value, parent);\n    const scope = parent ? parent.scope_ : getCurrentScope();\n    scope.drafts_.push(draft);\n    return draft;\n  }\n  function current(value) {\n    if (!isDraft(value))\n      die(10, value);\n    return currentImpl(value);\n  }\n  function currentImpl(value) {\n    if (!isDraftable(value) || isFrozen(value))\n      return value;\n    const state = value[DRAFT_STATE];\n    let copy;\n    let strict = true;\n    if (state) {\n      if (!state.modified_)\n        return state.base_;\n      state.finalized_ = true;\n      copy = shallowCopy(value, state.scope_.immer_.useStrictShallowCopy_);\n      strict = state.scope_.immer_.shouldUseStrictIteration();\n    } else {\n      copy = shallowCopy(value, true);\n    }\n    each(\n      copy,\n      (key, childValue) => {\n        set(copy, key, currentImpl(childValue));\n      },\n      strict\n    );\n    if (state) {\n      state.finalized_ = false;\n    }\n    return copy;\n  }\n  function enablePatches() {\n    const errorOffset = 16;\n    if (true) {\n      errors.push(\n        \'Sets cannot have "replace" patches.\',\n        function(op) {\n          return "Unsupported patch operation: " + op;\n        },\n        function(path) {\n          return "Cannot apply patch, path doesn\'t resolve: " + path;\n        },\n        "Patching reserved attributes like __proto__, prototype and constructor is not allowed"\n      );\n    }\n    const REPLACE = "replace";\n    const ADD = "add";\n    const REMOVE = "remove";\n    function generatePatches_(state, basePath, patches, inversePatches) {\n      switch (state.type_) {\n        case 0:\n        case 2:\n          return generatePatchesFromAssigned(\n            state,\n            basePath,\n            patches,\n            inversePatches\n          );\n        case 1:\n          return generateArrayPatches(state, basePath, patches, inversePatches);\n        case 3:\n          return generateSetPatches(\n            state,\n            basePath,\n            patches,\n            inversePatches\n          );\n      }\n    }\n    function generateArrayPatches(state, basePath, patches, inversePatches) {\n      let { base_, assigned_ } = state;\n      let copy_ = state.copy_;\n      if (copy_.length < base_.length) {\n        ;\n        [base_, copy_] = [copy_, base_];\n        [patches, inversePatches] = [inversePatches, patches];\n      }\n      for (let i = 0; i < base_.length; i++) {\n        if (assigned_[i] && copy_[i] !== base_[i]) {\n          const path = basePath.concat([i]);\n          patches.push({\n            op: REPLACE,\n            path,\n            // Need to maybe clone it, as it can in fact be the original value\n            // due to the base/copy inversion at the start of this function\n            value: clonePatchValueIfNeeded(copy_[i])\n          });\n          inversePatches.push({\n            op: REPLACE,\n            path,\n            value: clonePatchValueIfNeeded(base_[i])\n          });\n        }\n      }\n      for (let i = base_.length; i < copy_.length; i++) {\n        const path = basePath.concat([i]);\n        patches.push({\n          op: ADD,\n          path,\n          // Need to maybe clone it, as it can in fact be the original value\n          // due to the base/copy inversion at the start of this function\n          value: clonePatchValueIfNeeded(copy_[i])\n        });\n      }\n      for (let i = copy_.length - 1; base_.length <= i; --i) {\n        const path = basePath.concat([i]);\n        inversePatches.push({\n          op: REMOVE,\n          path\n        });\n      }\n    }\n    function generatePatchesFromAssigned(state, basePath, patches, inversePatches) {\n      const { base_, copy_ } = state;\n      each(state.assigned_, (key, assignedValue) => {\n        const origValue = get(base_, key);\n        const value = get(copy_, key);\n        const op = !assignedValue ? REMOVE : has(base_, key) ? REPLACE : ADD;\n        if (origValue === value && op === REPLACE)\n          return;\n        const path = basePath.concat(key);\n        patches.push(op === REMOVE ? { op, path } : { op, path, value });\n        inversePatches.push(\n          op === ADD ? { op: REMOVE, path } : op === REMOVE ? { op: ADD, path, value: clonePatchValueIfNeeded(origValue) } : { op: REPLACE, path, value: clonePatchValueIfNeeded(origValue) }\n        );\n      });\n    }\n    function generateSetPatches(state, basePath, patches, inversePatches) {\n      let { base_, copy_ } = state;\n      let i = 0;\n      base_.forEach((value) => {\n        if (!copy_.has(value)) {\n          const path = basePath.concat([i]);\n          patches.push({\n            op: REMOVE,\n            path,\n            value\n          });\n          inversePatches.unshift({\n            op: ADD,\n            path,\n            value\n          });\n        }\n        i++;\n      });\n      i = 0;\n      copy_.forEach((value) => {\n        if (!base_.has(value)) {\n          const path = basePath.concat([i]);\n          patches.push({\n            op: ADD,\n            path,\n            value\n          });\n          inversePatches.unshift({\n            op: REMOVE,\n            path,\n            value\n          });\n        }\n        i++;\n      });\n    }\n    function generateReplacementPatches_(baseValue, replacement, patches, inversePatches) {\n      patches.push({\n        op: REPLACE,\n        path: [],\n        value: replacement === NOTHING ? void 0 : replacement\n      });\n      inversePatches.push({\n        op: REPLACE,\n        path: [],\n        value: baseValue\n      });\n    }\n    function applyPatches_(draft, patches) {\n      patches.forEach((patch) => {\n        const { path, op } = patch;\n        let base = draft;\n        for (let i = 0; i < path.length - 1; i++) {\n          const parentType = getArchtype(base);\n          let p = path[i];\n          if (typeof p !== "string" && typeof p !== "number") {\n            p = "" + p;\n          }\n          if ((parentType === 0 || parentType === 1) && (p === "__proto__" || p === "constructor"))\n            die(errorOffset + 3);\n          if (typeof base === "function" && p === "prototype")\n            die(errorOffset + 3);\n          base = get(base, p);\n          if (typeof base !== "object")\n            die(errorOffset + 2, path.join("/"));\n        }\n        const type = getArchtype(base);\n        const value = deepClonePatchValue(patch.value);\n        const key = path[path.length - 1];\n        switch (op) {\n          case REPLACE:\n            switch (type) {\n              case 2:\n                return base.set(key, value);\n              case 3:\n                die(errorOffset);\n              default:\n                return base[key] = value;\n            }\n          case ADD:\n            switch (type) {\n              case 1:\n                return key === "-" ? base.push(value) : base.splice(key, 0, value);\n              case 2:\n                return base.set(key, value);\n              case 3:\n                return base.add(value);\n              default:\n                return base[key] = value;\n            }\n          case REMOVE:\n            switch (type) {\n              case 1:\n                return base.splice(key, 1);\n              case 2:\n                return base.delete(key);\n              case 3:\n                return base.delete(patch.value);\n              default:\n                return delete base[key];\n            }\n          default:\n            die(errorOffset + 1, op);\n        }\n      });\n      return draft;\n    }\n    function deepClonePatchValue(obj) {\n      if (!isDraftable(obj))\n        return obj;\n      if (Array.isArray(obj))\n        return obj.map(deepClonePatchValue);\n      if (isMap(obj))\n        return new Map(\n          Array.from(obj.entries()).map(([k, v]) => [k, deepClonePatchValue(v)])\n        );\n      if (isSet(obj))\n        return new Set(Array.from(obj).map(deepClonePatchValue));\n      const cloned = Object.create(getPrototypeOf(obj));\n      for (const key in obj)\n        cloned[key] = deepClonePatchValue(obj[key]);\n      if (has(obj, DRAFTABLE))\n        cloned[DRAFTABLE] = obj[DRAFTABLE];\n      return cloned;\n    }\n    function clonePatchValueIfNeeded(obj) {\n      if (isDraft(obj)) {\n        return deepClonePatchValue(obj);\n      } else\n        return obj;\n    }\n    loadPlugin("Patches", {\n      applyPatches_,\n      generatePatches_,\n      generateReplacementPatches_\n    });\n  }\n  var immer = new Immer2();\n  var produce = immer.produce;\n  var produceWithPatches = /* @__PURE__ */ immer.produceWithPatches.bind(\n    immer\n  );\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/scene/SceneItemsApi.js\n  var __awaiter7 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  enablePatches();\n  var SceneItemsApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    getItems(filter) {\n      return __awaiter7(this, void 0, void 0, function* () {\n        if (Array.isArray(filter)) {\n          const { items } = yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_GET_ITEMS", { ids: filter });\n          return items;\n        } else if (filter) {\n          const { items } = yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_GET_ALL_ITEMS", {});\n          return items.filter(filter);\n        } else {\n          const { items } = yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_GET_ALL_ITEMS", {});\n          return items;\n        }\n      });\n    }\n    isItemArray(value) {\n      return Array.isArray(value) && value.every((item) => typeof item !== "string");\n    }\n    updateItems(filterOrItems, update) {\n      return __awaiter7(this, void 0, void 0, function* () {\n        let items;\n        if (this.isItemArray(filterOrItems)) {\n          items = filterOrItems;\n        } else {\n          items = yield this.getItems(filterOrItems);\n        }\n        const [nextState, patches] = produceWithPatches(items, update);\n        const nextUpdates = nextState.map((item) => ({\n          id: item.id,\n          type: item.type\n        }));\n        for (const patch of patches) {\n          const [index, key] = patch.path;\n          if (typeof index === "number" && typeof key === "string") {\n            nextUpdates[index][key] = nextState[index][key];\n          }\n        }\n        const updates = nextUpdates.filter(\n          // Ensure that there are updates besides the default ID and type\n          (update2) => Object.keys(update2).length > 2\n        );\n        if (updates.length === 0) {\n          return;\n        }\n        yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_UPDATE_ITEMS", {\n          updates\n        });\n      });\n    }\n    addItems(items) {\n      return __awaiter7(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_ADD_ITEMS", {\n          items\n        });\n      });\n    }\n    deleteItems(ids) {\n      return __awaiter7(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_DELETE_ITEMS", {\n          ids\n        });\n      });\n    }\n    getItemAttachments(ids) {\n      return __awaiter7(this, void 0, void 0, function* () {\n        const { items } = yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_GET_ITEM_ATTACHMENTS", { ids });\n        return items;\n      });\n    }\n    getItemBounds(ids) {\n      return __awaiter7(this, void 0, void 0, function* () {\n        const { bounds } = yield this.messageBus.sendAsync("OBR_SCENE_ITEMS_GET_ITEM_BOUNDS", { ids });\n        return bounds;\n      });\n    }\n    onChange(callback) {\n      const handleChange = (data) => {\n        callback(data.items);\n      };\n      this.messageBus.send("OBR_SCENE_ITEMS_SUBSCRIBE", {});\n      this.messageBus.on("OBR_SCENE_ITEMS_EVENT_CHANGE", handleChange);\n      return () => {\n        this.messageBus.send("OBR_SCENE_ITEMS_UNSUBSCRIBE", {});\n        this.messageBus.off("OBR_SCENE_ITEMS_EVENT_CHANGE", handleChange);\n      };\n    }\n  };\n  var SceneItemsApi_default = SceneItemsApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/scene/SceneLocalApi.js\n  var __awaiter8 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  enablePatches();\n  var SceneLocalApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    getItems(filter) {\n      return __awaiter8(this, void 0, void 0, function* () {\n        if (Array.isArray(filter)) {\n          const { items } = yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_GET_ITEMS", { ids: filter });\n          return items;\n        } else if (filter) {\n          const { items } = yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_GET_ALL_ITEMS", {});\n          return items.filter(filter);\n        } else {\n          const { items } = yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_GET_ALL_ITEMS", {});\n          return items;\n        }\n      });\n    }\n    isItemArray(value) {\n      return Array.isArray(value) && value.every((item) => typeof item !== "string");\n    }\n    updateItems(filterOrItems, update, fastUpdate) {\n      return __awaiter8(this, void 0, void 0, function* () {\n        let items;\n        if (this.isItemArray(filterOrItems)) {\n          items = filterOrItems;\n        } else {\n          items = yield this.getItems(filterOrItems);\n        }\n        const [nextState, patches] = produceWithPatches(items, update);\n        const nextUpdates = nextState.map((item) => ({\n          id: item.id,\n          type: item.type\n        }));\n        for (const patch of patches) {\n          const [index, key] = patch.path;\n          if (typeof index === "number" && typeof key === "string") {\n            nextUpdates[index][key] = nextState[index][key];\n          }\n        }\n        const updates = nextUpdates.filter(\n          // Ensure that there are updates besides the default ID and type\n          (update2) => Object.keys(update2).length > 2\n        );\n        if (updates.length === 0) {\n          return;\n        }\n        yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_UPDATE_ITEMS", {\n          updates,\n          fastUpdate\n        });\n      });\n    }\n    addItems(items) {\n      return __awaiter8(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_ADD_ITEMS", {\n          items\n        });\n      });\n    }\n    deleteItems(ids) {\n      return __awaiter8(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_DELETE_ITEMS", {\n          ids\n        });\n      });\n    }\n    getItemAttachments(ids) {\n      return __awaiter8(this, void 0, void 0, function* () {\n        const { items } = yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_GET_ITEM_ATTACHMENTS", { ids });\n        return items;\n      });\n    }\n    getItemBounds(ids) {\n      return __awaiter8(this, void 0, void 0, function* () {\n        const { bounds } = yield this.messageBus.sendAsync("OBR_SCENE_LOCAL_GET_ITEM_BOUNDS", { ids });\n        return bounds;\n      });\n    }\n    onChange(callback) {\n      const handleChange = (data) => {\n        callback(data.items);\n      };\n      this.messageBus.send("OBR_SCENE_LOCAL_SUBSCRIBE", {});\n      this.messageBus.on("OBR_SCENE_LOCAL_EVENT_CHANGE", handleChange);\n      return () => {\n        this.messageBus.send("OBR_SCENE_LOCAL_UNSUBSCRIBE", {});\n        this.messageBus.off("OBR_SCENE_LOCAL_EVENT_CHANGE", handleChange);\n      };\n    }\n  };\n  var SceneLocalApi_default = SceneLocalApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/scene/SceneApi.js\n  var __awaiter9 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var SceneApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n      this.grid = new SceneGridApi_default(messageBus2);\n      this.fog = new SceneFogApi_default(messageBus2);\n      this.history = new SceneHistoryApi_default(messageBus2);\n      this.items = new SceneItemsApi_default(messageBus2);\n      this.local = new SceneLocalApi_default(messageBus2);\n    }\n    isReady() {\n      return __awaiter9(this, void 0, void 0, function* () {\n        const { ready } = yield this.messageBus.sendAsync("OBR_SCENE_IS_READY", {});\n        return ready;\n      });\n    }\n    onReadyChange(callback) {\n      const handleChange = (data) => {\n        callback(data.ready);\n      };\n      this.messageBus.send("OBR_SCENE_READY_SUBSCRIBE", {});\n      this.messageBus.on("OBR_SCENE_EVENT_READY_CHANGE", handleChange);\n      return () => {\n        this.messageBus.send("OBR_SCENE_READY_UNSUBSCRIBE", {});\n        this.messageBus.off("OBR_SCENE_EVENT_READY_CHANGE", handleChange);\n      };\n    }\n    getMetadata() {\n      return __awaiter9(this, void 0, void 0, function* () {\n        const { metadata } = yield this.messageBus.sendAsync("OBR_SCENE_GET_METADATA", {});\n        return metadata;\n      });\n    }\n    setMetadata(update) {\n      return __awaiter9(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_SCENE_SET_METADATA", { update });\n      });\n    }\n    onMetadataChange(callback) {\n      const handleChange = (data) => {\n        callback(data.metadata);\n      };\n      this.messageBus.send("OBR_SCENE_METADATA_SUBSCRIBE", {});\n      this.messageBus.on("OBR_SCENE_METADATA_EVENT_CHANGE", handleChange);\n      return () => {\n        this.messageBus.send("OBR_SCENE_METADATA_UNSUBSCRIBE", {});\n        this.messageBus.off("OBR_SCENE_METADATA_EVENT_CHANGE", handleChange);\n      };\n    }\n  };\n  var SceneApi_default = SceneApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/common/normalize.js\n  function normalizeUrl(url) {\n    return url.startsWith("http") ? url : `${window.location.origin}${url}`;\n  }\n  function normalizeIconPaths(icons) {\n    return icons.map((base) => Object.assign(Object.assign({}, base), { icon: normalizeUrl(base.icon) }));\n  }\n  function normalizeUrlObject(urlObject) {\n    return Object.assign(Object.assign({}, urlObject), { url: normalizeUrl(urlObject.url) });\n  }\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/ContextMenuApi.js\n  var __awaiter10 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var ContextMenuApi = class {\n    constructor(messageBus2) {\n      this.contextMenus = {};\n      this.handleClick = (event) => {\n        var _a;\n        const menu = this.contextMenus[event.id];\n        if (menu) {\n          (_a = menu.onClick) === null || _a === void 0 ? void 0 : _a.call(menu, event.context, event.elementId);\n        }\n      };\n      this.messageBus = messageBus2;\n      messageBus2.on("OBR_CONTEXT_MENU_EVENT_CLICK", this.handleClick);\n    }\n    create(contextMenu) {\n      return __awaiter10(this, void 0, void 0, function* () {\n        this.messageBus.sendAsync("OBR_CONTEXT_MENU_CREATE", {\n          id: contextMenu.id,\n          shortcut: contextMenu.shortcut,\n          icons: normalizeIconPaths(contextMenu.icons),\n          embed: contextMenu.embed && normalizeUrlObject(contextMenu.embed)\n        });\n        this.contextMenus[contextMenu.id] = contextMenu;\n      });\n    }\n    remove(id) {\n      return __awaiter10(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_CONTEXT_MENU_REMOVE", { id });\n        delete this.contextMenus[id];\n      });\n    }\n  };\n  var ContextMenuApi_default = ContextMenuApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/ToolApi.js\n  var __awaiter11 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var ToolApi = class {\n    constructor(messageBus2) {\n      this.tools = {};\n      this.toolActions = {};\n      this.toolModes = {};\n      this.handleToolClick = (event) => {\n        const tool = this.tools[event.id];\n        if (tool) {\n          if (tool.onClick) {\n            const result = tool.onClick(event.context, event.elementId);\n            Promise.resolve(result).then((activate) => {\n              if (activate) {\n                this.messageBus.send("OBR_TOOL_ACTIVATE", {\n                  id: event.id\n                });\n              }\n            });\n          } else {\n            this.messageBus.send("OBR_TOOL_ACTIVATE", {\n              id: event.id\n            });\n          }\n        }\n      };\n      this.handleToolActionClick = (event) => {\n        var _a;\n        const action = this.toolActions[event.id];\n        if (action) {\n          (_a = action.onClick) === null || _a === void 0 ? void 0 : _a.call(action, event.context, event.elementId);\n        }\n      };\n      this.handleToolModeClick = (event) => {\n        const mode = this.toolModes[event.id];\n        if (mode) {\n          if (mode.onClick) {\n            const result = mode.onClick(event.context, event.elementId);\n            Promise.resolve(result).then((activate) => {\n              if (activate) {\n                this.messageBus.send("OBR_TOOL_MODE_ACTIVATE", {\n                  toolId: event.context.activeTool,\n                  modeId: event.id\n                });\n              }\n            });\n          } else {\n            this.messageBus.send("OBR_TOOL_MODE_ACTIVATE", {\n              toolId: event.context.activeTool,\n              modeId: event.id\n            });\n          }\n        }\n      };\n      this.handleToolModeToolClick = (event) => {\n        const mode = this.toolModes[event.id];\n        if (mode) {\n          if (mode.onToolClick) {\n            const result = mode.onToolClick(event.context, event.event);\n            Promise.resolve(result).then((select) => {\n              if (select && event.event.target && !event.event.target.locked) {\n                this.messageBus.sendAsync("OBR_PLAYER_SELECT", {\n                  items: [event.event.target.id]\n                });\n              }\n            });\n          } else {\n            if (event.event.target && !event.event.target.locked) {\n              this.messageBus.sendAsync("OBR_PLAYER_SELECT", {\n                items: [event.event.target.id]\n              });\n            }\n          }\n        }\n      };\n      this.handleToolModeToolDoubleClick = (event) => {\n        const mode = this.toolModes[event.id];\n        if (mode) {\n          if (mode.onToolDoubleClick) {\n            const result = mode.onToolDoubleClick(event.context, event.event);\n            Promise.resolve(result).then((select) => {\n              if (select && event.event.target) {\n                this.messageBus.sendAsync("OBR_PLAYER_SELECT", {\n                  items: [event.event.target.id]\n                });\n              }\n            });\n          } else {\n            if (event.event.target) {\n              this.messageBus.sendAsync("OBR_PLAYER_SELECT", {\n                items: [event.event.target.id]\n              });\n            }\n          }\n        }\n      };\n      this.handleToolModeToolDown = (event) => {\n        var _a;\n        const mode = this.toolModes[event.id];\n        if (mode) {\n          (_a = mode.onToolDown) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);\n        }\n      };\n      this.handleToolModeToolMove = (event) => {\n        var _a;\n        const mode = this.toolModes[event.id];\n        if (mode) {\n          (_a = mode.onToolMove) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);\n        }\n      };\n      this.handleToolModeToolUp = (event) => {\n        var _a;\n        const mode = this.toolModes[event.id];\n        if (mode) {\n          (_a = mode.onToolUp) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);\n        }\n      };\n      this.handleToolModeToolDragStart = (event) => {\n        var _a;\n        const mode = this.toolModes[event.id];\n        if (mode) {\n          (_a = mode.onToolDragStart) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);\n        }\n      };\n      this.handleToolModeToolDragMove = (event) => {\n        var _a;\n        const mode = this.toolModes[event.id];\n        if (mode) {\n          (_a = mode.onToolDragMove) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);\n        }\n      };\n      this.handleToolModeToolDragEnd = (event) => {\n        var _a;\n        const mode = this.toolModes[event.id];\n        if (mode) {\n          (_a = mode.onToolDragEnd) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);\n        }\n      };\n      this.handleToolModeToolDragCancel = (event) => {\n        var _a;\n        const mode = this.toolModes[event.id];\n        if (mode) {\n          (_a = mode.onToolDragCancel) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);\n        }\n      };\n      this.handleToolModeKeyDown = (event) => {\n        var _a;\n        const mode = this.toolModes[event.id];\n        if (mode) {\n          (_a = mode.onKeyDown) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);\n        }\n      };\n      this.handleToolModeKeyUp = (event) => {\n        var _a;\n        const mode = this.toolModes[event.id];\n        if (mode) {\n          (_a = mode.onKeyUp) === null || _a === void 0 ? void 0 : _a.call(mode, event.context, event.event);\n        }\n      };\n      this.handleToolModeActivate = (event) => {\n        var _a;\n        const mode = this.toolModes[event.id];\n        if (mode) {\n          (_a = mode.onActivate) === null || _a === void 0 ? void 0 : _a.call(mode, event.context);\n        }\n      };\n      this.handleToolModeDeactivate = (event) => {\n        var _a;\n        const mode = this.toolModes[event.id];\n        if (mode) {\n          (_a = mode.onDeactivate) === null || _a === void 0 ? void 0 : _a.call(mode, event.context);\n        }\n      };\n      this.messageBus = messageBus2;\n      messageBus2.on("OBR_TOOL_EVENT_CLICK", this.handleToolClick);\n      messageBus2.on("OBR_TOOL_ACTION_EVENT_CLICK", this.handleToolActionClick);\n      messageBus2.on("OBR_TOOL_MODE_EVENT_CLICK", this.handleToolModeClick);\n      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_CLICK", this.handleToolModeToolClick);\n      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_DOUBLE_CLICK", this.handleToolModeToolDoubleClick);\n      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_DOWN", this.handleToolModeToolDown);\n      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_MOVE", this.handleToolModeToolMove);\n      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_UP", this.handleToolModeToolUp);\n      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_DRAG_START", this.handleToolModeToolDragStart);\n      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_DRAG_MOVE", this.handleToolModeToolDragMove);\n      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_DRAG_END", this.handleToolModeToolDragEnd);\n      messageBus2.on("OBR_TOOL_MODE_EVENT_TOOL_DRAG_CANCEL", this.handleToolModeToolDragCancel);\n      messageBus2.on("OBR_TOOL_MODE_EVENT_KEY_DOWN", this.handleToolModeKeyDown);\n      messageBus2.on("OBR_TOOL_MODE_EVENT_KEY_UP", this.handleToolModeKeyUp);\n      messageBus2.on("OBR_TOOL_MODE_EVENT_ACTIVATE", this.handleToolModeActivate);\n      messageBus2.on("OBR_TOOL_MODE_EVENT_DEACTIVATE", this.handleToolModeDeactivate);\n    }\n    create(tool) {\n      return __awaiter11(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_TOOL_CREATE", {\n          id: tool.id,\n          shortcut: tool.shortcut,\n          defaultMode: tool.defaultMode,\n          defaultMetadata: tool.defaultMetadata,\n          icons: normalizeIconPaths(tool.icons),\n          disabled: tool.disabled\n        });\n        this.tools[tool.id] = tool;\n      });\n    }\n    remove(id) {\n      return __awaiter11(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_TOOL_REMOVE", { id });\n        delete this.tools[id];\n      });\n    }\n    activateTool(id) {\n      return __awaiter11(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_TOOL_ACTIVATE", { id });\n      });\n    }\n    getActiveTool() {\n      return __awaiter11(this, void 0, void 0, function* () {\n        const { id } = yield this.messageBus.sendAsync("OBR_TOOL_GET_ACTIVE", {});\n        return id;\n      });\n    }\n    onToolChange(callback) {\n      const handleChange = (data) => {\n        callback(data.id);\n      };\n      this.messageBus.send("OBR_TOOL_ACTIVE_SUBSCRIBE", {});\n      this.messageBus.on("OBR_TOOL_ACTIVE_EVENT_CHANGE", handleChange);\n      return () => {\n        this.messageBus.send("OBR_TOOL_ACTIVE_UNSUBSCRIBE", {});\n        this.messageBus.off("OBR_TOOL_ACTIVE_EVENT_CHANGE", handleChange);\n      };\n    }\n    getMetadata(id) {\n      return __awaiter11(this, void 0, void 0, function* () {\n        const { metadata } = yield this.messageBus.sendAsync("OBR_TOOL_GET_METADATA", { id });\n        return metadata;\n      });\n    }\n    setMetadata(toolId, update) {\n      return __awaiter11(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_TOOL_SET_METADATA", {\n          toolId,\n          update\n        });\n      });\n    }\n    createAction(action) {\n      return __awaiter11(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_TOOL_ACTION_CREATE", {\n          id: action.id,\n          shortcut: action.shortcut,\n          icons: normalizeIconPaths(action.icons),\n          disabled: action.disabled\n        });\n        this.toolActions[action.id] = action;\n      });\n    }\n    removeAction(id) {\n      return __awaiter11(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_TOOL_ACTION_REMOVE", { id });\n        delete this.tools[id];\n      });\n    }\n    createMode(mode) {\n      return __awaiter11(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_TOOL_MODE_CREATE", {\n          id: mode.id,\n          shortcut: mode.shortcut,\n          icons: normalizeIconPaths(mode.icons),\n          preventDrag: mode.preventDrag,\n          disabled: mode.disabled,\n          cursors: mode.cursors\n        });\n        this.toolModes[mode.id] = mode;\n      });\n    }\n    removeMode(id) {\n      return __awaiter11(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_TOOL_MODE_REMOVE", { id });\n        delete this.tools[id];\n      });\n    }\n    activateMode(toolId, modeId) {\n      return __awaiter11(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_TOOL_MODE_ACTIVATE", {\n          toolId,\n          modeId\n        });\n      });\n    }\n    getActiveToolMode() {\n      return __awaiter11(this, void 0, void 0, function* () {\n        const { id } = yield this.messageBus.sendAsync("OBR_TOOL_MODE_GET_ACTIVE", {});\n        return id;\n      });\n    }\n    onToolModeChange(callback) {\n      const handleChange = (data) => {\n        callback(data.id);\n      };\n      this.messageBus.send("OBR_TOOL_MODE_ACTIVE_SUBSCRIBE", {});\n      this.messageBus.on("OBR_TOOL_MODE_ACTIVE_EVENT_CHANGE", handleChange);\n      return () => {\n        this.messageBus.send("OBR_TOOL_MODE_ACTIVE_UNSUBSCRIBE", {});\n        this.messageBus.off("OBR_TOOL_MODE_ACTIVE_EVENT_CHANGE", handleChange);\n      };\n    }\n  };\n  var ToolApi_default = ToolApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/PopoverApi.js\n  var __awaiter12 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var PopoverApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    open(popover) {\n      return __awaiter12(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_POPOVER_OPEN", Object.assign({}, normalizeUrlObject(popover)));\n      });\n    }\n    close(id) {\n      return __awaiter12(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_POPOVER_CLOSE", { id });\n      });\n    }\n    getWidth(id) {\n      return __awaiter12(this, void 0, void 0, function* () {\n        const { width } = yield this.messageBus.sendAsync("OBR_POPOVER_GET_WIDTH", { id });\n        return width;\n      });\n    }\n    setWidth(id, width) {\n      return __awaiter12(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_POPOVER_SET_WIDTH", { id, width });\n      });\n    }\n    getHeight(id) {\n      return __awaiter12(this, void 0, void 0, function* () {\n        const { height } = yield this.messageBus.sendAsync("OBR_POPOVER_GET_HEIGHT", { id });\n        return height;\n      });\n    }\n    setHeight(id, height) {\n      return __awaiter12(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_POPOVER_SET_HEIGHT", { id, height });\n      });\n    }\n  };\n  var PopoverApi_default = PopoverApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/ModalApi.js\n  var __awaiter13 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var ModalApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    open(modal) {\n      return __awaiter13(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_MODAL_OPEN", Object.assign({}, normalizeUrlObject(modal)));\n      });\n    }\n    close(id) {\n      return __awaiter13(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_MODAL_CLOSE", { id });\n      });\n    }\n  };\n  var ModalApi_default = ModalApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/ActionApi.js\n  var __awaiter14 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var ActionApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    getWidth() {\n      return __awaiter14(this, void 0, void 0, function* () {\n        const { width } = yield this.messageBus.sendAsync("OBR_ACTION_GET_WIDTH", {});\n        return width;\n      });\n    }\n    setWidth(width) {\n      return __awaiter14(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_ACTION_SET_WIDTH", { width });\n      });\n    }\n    getHeight() {\n      return __awaiter14(this, void 0, void 0, function* () {\n        const { height } = yield this.messageBus.sendAsync("OBR_ACTION_GET_HEIGHT", {});\n        return height;\n      });\n    }\n    setHeight(height) {\n      return __awaiter14(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_ACTION_SET_HEIGHT", { height });\n      });\n    }\n    getBadgeText() {\n      return __awaiter14(this, void 0, void 0, function* () {\n        const { badgeText } = yield this.messageBus.sendAsync("OBR_ACTION_GET_BADGE_TEXT", {});\n        return badgeText;\n      });\n    }\n    setBadgeText(badgeText) {\n      return __awaiter14(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_ACTION_SET_BADGE_TEXT", { badgeText });\n      });\n    }\n    getBadgeBackgroundColor() {\n      return __awaiter14(this, void 0, void 0, function* () {\n        const { badgeBackgroundColor } = yield this.messageBus.sendAsync("OBR_ACTION_GET_BADGE_BACKGROUND_COLOR", {});\n        return badgeBackgroundColor;\n      });\n    }\n    setBadgeBackgroundColor(badgeBackgroundColor) {\n      return __awaiter14(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_ACTION_SET_BADGE_BACKGROUND_COLOR", {\n          badgeBackgroundColor\n        });\n      });\n    }\n    getIcon() {\n      return __awaiter14(this, void 0, void 0, function* () {\n        const { icon } = yield this.messageBus.sendAsync("OBR_ACTION_GET_ICON", {});\n        return icon;\n      });\n    }\n    setIcon(icon) {\n      return __awaiter14(this, void 0, void 0, function* () {\n        const data = normalizeIconPaths([{ icon }]);\n        yield this.messageBus.sendAsync("OBR_ACTION_SET_ICON", {\n          icon: data[0].icon\n        });\n      });\n    }\n    getTitle() {\n      return __awaiter14(this, void 0, void 0, function* () {\n        const { title } = yield this.messageBus.sendAsync("OBR_ACTION_GET_TITLE", {});\n        return title;\n      });\n    }\n    setTitle(title) {\n      return __awaiter14(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_ACTION_SET_TITLE", { title });\n      });\n    }\n    isOpen() {\n      return __awaiter14(this, void 0, void 0, function* () {\n        const { isOpen } = yield this.messageBus.sendAsync("OBR_ACTION_GET_IS_OPEN", {});\n        return isOpen;\n      });\n    }\n    open() {\n      return __awaiter14(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_ACTION_OPEN", {});\n      });\n    }\n    close() {\n      return __awaiter14(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_ACTION_CLOSE", {});\n      });\n    }\n    onOpenChange(callback) {\n      const handleChange = (data) => {\n        callback(data.isOpen);\n      };\n      this.messageBus.send("OBR_ACTION_IS_OPEN_SUBSCRIBE", {});\n      this.messageBus.on("OBR_ACTION_IS_OPEN_EVENT_CHANGE", handleChange);\n      return () => {\n        this.messageBus.send("OBR_IS_OPEN_ACTION_UNSUBSCRIBE", {});\n        this.messageBus.off("OBR_ACTION_IS_OPEN_EVENT_CHANGE", handleChange);\n      };\n    }\n  };\n  var ActionApi_default = ActionApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/InteractionApi.js\n  var __awaiter15 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  enablePatches();\n  var InteractionApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    startItemInteraction(baseState) {\n      return __awaiter15(this, void 0, void 0, function* () {\n        const { id } = yield this.messageBus.sendAsync("OBR_INTERACTION_START_ITEM_INTERACTION", { baseState });\n        let prev = baseState;\n        const dispatcher = (update) => {\n          const [next, patches] = produceWithPatches(prev, update);\n          prev = next;\n          this.messageBus.send("OBR_INTERACTION_UPDATE_ITEM_INTERACTION", {\n            id,\n            patches\n          });\n          return next;\n        };\n        const stop = () => {\n          this.messageBus.send("OBR_INTERACTION_STOP_ITEM_INTERACTION", { id });\n        };\n        return [dispatcher, stop];\n      });\n    }\n  };\n  var InteractionApi_default = InteractionApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/PartyApi.js\n  var __awaiter16 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var PartyApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    getPlayers() {\n      return __awaiter16(this, void 0, void 0, function* () {\n        const { players } = yield this.messageBus.sendAsync("OBR_PARTY_GET_PLAYERS", {});\n        return players;\n      });\n    }\n    onChange(callback) {\n      const handleChange = (data) => {\n        callback(data.players);\n      };\n      this.messageBus.send("OBR_PARTY_SUBSCRIBE", {});\n      this.messageBus.on("OBR_PARTY_EVENT_CHANGE", handleChange);\n      return () => {\n        this.messageBus.send("OBR_PARTY_UNSUBSCRIBE", {});\n        this.messageBus.off("OBR_PARTY_EVENT_CHANGE", handleChange);\n      };\n    }\n  };\n  var PartyApi_default = PartyApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/RoomApi.js\n  var __awaiter17 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var RoomApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    get id() {\n      return this.messageBus.roomId;\n    }\n    getPermissions() {\n      return __awaiter17(this, void 0, void 0, function* () {\n        const { permissions } = yield this.messageBus.sendAsync("OBR_ROOM_GET_PERMISSIONS", {});\n        return permissions;\n      });\n    }\n    getMetadata() {\n      return __awaiter17(this, void 0, void 0, function* () {\n        const { metadata } = yield this.messageBus.sendAsync("OBR_ROOM_GET_METADATA", {});\n        return metadata;\n      });\n    }\n    setMetadata(update) {\n      return __awaiter17(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_ROOM_SET_METADATA", { update });\n      });\n    }\n    onMetadataChange(callback) {\n      const handleChange = (data) => {\n        callback(data.metadata);\n      };\n      this.messageBus.send("OBR_ROOM_METADATA_SUBSCRIBE", {});\n      this.messageBus.on("OBR_ROOM_METADATA_EVENT_CHANGE", handleChange);\n      return () => {\n        this.messageBus.send("OBR_METADATA_ROOM_UNSUBSCRIBE", {});\n        this.messageBus.off("OBR_ROOM_METADATA_EVENT_CHANGE", handleChange);\n      };\n    }\n    onPermissionsChange(callback) {\n      const handleChange = (data) => {\n        callback(data.permissions);\n      };\n      this.messageBus.send("OBR_ROOM_PERMISSIONS_SUBSCRIBE", {});\n      this.messageBus.on("OBR_ROOM_PERMISSIONS_EVENT_CHANGE", handleChange);\n      return () => {\n        this.messageBus.send("OBR_PERMISSIONS_ROOM_UNSUBSCRIBE", {});\n        this.messageBus.off("OBR_ROOM_PERMISSIONS_EVENT_CHANGE", handleChange);\n      };\n    }\n  };\n  var RoomApi_default = RoomApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/ThemeApi.js\n  var __awaiter18 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var ThemeApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    getTheme() {\n      return __awaiter18(this, void 0, void 0, function* () {\n        const { theme } = yield this.messageBus.sendAsync("OBR_THEME_GET_THEME", {});\n        return theme;\n      });\n    }\n    onChange(callback) {\n      const handleChange = (data) => {\n        callback(data.theme);\n      };\n      this.messageBus.send("OBR_THEME_SUBSCRIBE", {});\n      this.messageBus.on("OBR_THEME_EVENT_CHANGE", handleChange);\n      return () => {\n        this.messageBus.send("OBR_THEME_UNSUBSCRIBE", {});\n        this.messageBus.off("OBR_THEME_EVENT_CHANGE", handleChange);\n      };\n    }\n  };\n  var ThemeApi_default = ThemeApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/AssetsApi.js\n  var __awaiter19 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var AssetsApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    uploadImages(images, typeHint) {\n      return __awaiter19(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_ASSETS_UPLOAD_IMAGES", {\n          images,\n          typeHint\n        });\n      });\n    }\n    uploadScenes(scenes, disableShowScenes) {\n      return __awaiter19(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_ASSETS_UPLOAD_SCENES", {\n          scenes,\n          disableShowScenes\n        });\n      });\n    }\n    downloadImages(multiple, defaultSearch, typeHint) {\n      return __awaiter19(this, void 0, void 0, function* () {\n        const { images } = yield this.messageBus.sendAsync("OBR_ASSETS_DOWNLOAD_IMAGES", { multiple, defaultSearch, typeHint }, -1);\n        return images;\n      });\n    }\n    downloadScenes(multiple, defaultSearch) {\n      return __awaiter19(this, void 0, void 0, function* () {\n        const { scenes } = yield this.messageBus.sendAsync("OBR_ASSETS_DOWNLOAD_SCENES", { multiple, defaultSearch }, -1);\n        return scenes;\n      });\n    }\n  };\n  var AssetsApi_default = AssetsApi;\n\n  // node_modules/@owlbear-rodeo/sdk/lib/api/BroadcastApi.js\n  var __awaiter20 = function(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n      return value instanceof P ? value : new P(function(resolve) {\n        resolve(value);\n      });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n      function fulfilled(value) {\n        try {\n          step(generator.next(value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function rejected(value) {\n        try {\n          step(generator["throw"](value));\n        } catch (e) {\n          reject(e);\n        }\n      }\n      function step(result) {\n        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n      }\n      step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n  };\n  var BroadcastApi = class {\n    constructor(messageBus2) {\n      this.messageBus = messageBus2;\n    }\n    sendMessage(channel, data, options) {\n      return __awaiter20(this, void 0, void 0, function* () {\n        yield this.messageBus.sendAsync("OBR_BROADCAST_SEND_MESSAGE", {\n          channel,\n          data,\n          options\n        });\n      });\n    }\n    onMessage(channel, callback) {\n      this.messageBus.send("OBR_BROADCAST_SUBSCRIBE", { channel });\n      this.messageBus.on(`OBR_BROADCAST_MESSAGE_${channel}`, callback);\n      return () => {\n        this.messageBus.send("OBR_BROADCAST_UNSUBSCRIBE", { channel });\n        this.messageBus.off(`OBR_BROADCAST_MESSAGE_${channel}`, callback);\n      };\n    }\n  };\n  var BroadcastApi_default = BroadcastApi;\n\n  // node_modules/js-base64/base64.mjs\n  var _TD = typeof TextDecoder === "function" ? new TextDecoder("utf-8", { ignoreBOM: true }) : void 0;\n  var _TE = typeof TextEncoder === "function" ? new TextEncoder() : void 0;\n  var b64ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";\n  var b64chs = Array.prototype.slice.call(b64ch);\n  var b64tab = ((a) => {\n    let tab = {};\n    a.forEach((c, i) => tab[c] = i);\n    return tab;\n  })(b64chs);\n  var b64re = /^(?:[A-Za-z\\d+\\/]{4})*?(?:[A-Za-z\\d+\\/]{2}(?:==)?|[A-Za-z\\d+\\/]{3}=?)?$/;\n  var _fromCC = String.fromCharCode.bind(String);\n  var _U8Afrom = typeof Uint8Array.from === "function" ? Uint8Array.from.bind(Uint8Array) : (it) => new Uint8Array(Array.prototype.slice.call(it, 0));\n  var _tidyB64 = (s) => s.replace(/[^A-Za-z0-9\\+\\/]/g, "");\n  var btoaPolyfill = (bin) => {\n    let u32, c0, c1, c2, asc = "";\n    const pad = bin.length % 3;\n    for (let i = 0; i < bin.length; ) {\n      if ((c0 = bin.charCodeAt(i++)) > 255 || (c1 = bin.charCodeAt(i++)) > 255 || (c2 = bin.charCodeAt(i++)) > 255)\n        throw new TypeError("invalid character found");\n      u32 = c0 << 16 | c1 << 8 | c2;\n      asc += b64chs[u32 >> 18 & 63] + b64chs[u32 >> 12 & 63] + b64chs[u32 >> 6 & 63] + b64chs[u32 & 63];\n    }\n    return pad ? asc.slice(0, pad - 3) + "===".substring(pad) : asc;\n  };\n  var _btoa = typeof btoa === "function" ? (bin) => btoa(bin) : btoaPolyfill;\n  var _fromUint8Array = typeof Uint8Array.prototype.toBase64 === "function" ? Function.prototype.call.bind(Uint8Array.prototype.toBase64) : (u8a) => {\n    const maxargs = 4096;\n    let strs = [];\n    for (let i = 0, l = u8a.length; i < l; i += maxargs) {\n      strs.push(_fromCC.apply(null, u8a.subarray(i, i + maxargs)));\n    }\n    return _btoa(strs.join(""));\n  };\n  var re_btou = /[\\xC0-\\xDF][\\x80-\\xBF]|[\\xE0-\\xEF][\\x80-\\xBF]{2}|[\\xF0-\\xF7][\\x80-\\xBF]{3}/g;\n  var cb_btou = (cccc) => {\n    switch (cccc.length) {\n      case 4:\n        var cp = (7 & cccc.charCodeAt(0)) << 18 | (63 & cccc.charCodeAt(1)) << 12 | (63 & cccc.charCodeAt(2)) << 6 | 63 & cccc.charCodeAt(3), offset = cp - 65536;\n        return _fromCC((offset >>> 10) + 55296) + _fromCC((offset & 1023) + 56320);\n      case 3:\n        return _fromCC((15 & cccc.charCodeAt(0)) << 12 | (63 & cccc.charCodeAt(1)) << 6 | 63 & cccc.charCodeAt(2));\n      default:\n        return _fromCC((31 & cccc.charCodeAt(0)) << 6 | 63 & cccc.charCodeAt(1));\n    }\n  };\n  var btou = (b) => b.replace(re_btou, cb_btou);\n  var atobPolyfill = (asc) => {\n    asc = asc.replace(/\\s+/g, "");\n    if (!b64re.test(asc))\n      throw new TypeError("malformed base64.");\n    asc += "==".slice(2 - (asc.length & 3));\n    let u24, r1, r2;\n    let binArray = [];\n    for (let i = 0; i < asc.length; ) {\n      u24 = b64tab[asc.charAt(i++)] << 18 | b64tab[asc.charAt(i++)] << 12 | (r1 = b64tab[asc.charAt(i++)]) << 6 | (r2 = b64tab[asc.charAt(i++)]);\n      if (r1 === 64) {\n        binArray.push(_fromCC(u24 >> 16 & 255));\n      } else if (r2 === 64) {\n        binArray.push(_fromCC(u24 >> 16 & 255, u24 >> 8 & 255));\n      } else {\n        binArray.push(_fromCC(u24 >> 16 & 255, u24 >> 8 & 255, u24 & 255));\n      }\n    }\n    return binArray.join("");\n  };\n  var _atob = typeof atob === "function" ? (asc) => atob(_tidyB64(asc)) : atobPolyfill;\n  var _toUint8Array = typeof Uint8Array.fromBase64 === "function" ? (a) => Uint8Array.fromBase64(a) : (a) => _U8Afrom(_atob(a).split("").map((c) => c.charCodeAt(0)));\n  var _decode = _TD ? (a) => _TD.decode(_toUint8Array(a)) : (a) => btou(_atob(a));\n  var _unURI = (a) => _tidyB64(a.replace(/[-_]/g, (m0) => m0 == "-" ? "+" : "/"));\n  var decode = (src) => _decode(_unURI(src));\n\n  // node_modules/@owlbear-rodeo/sdk/lib/common/getDetails.js\n  function getDetails() {\n    const urlSearchParams = new URLSearchParams(window.location.search);\n    const ref = urlSearchParams.get("obrref");\n    let origin = "";\n    let roomId = "";\n    if (ref) {\n      const decodedRef = decode(ref);\n      const parts = decodedRef.split(" ");\n      if (parts.length === 2) {\n        origin = parts[0];\n        roomId = parts[1];\n      }\n    }\n    return { origin, roomId };\n  }\n\n  // node_modules/@owlbear-rodeo/sdk/lib/types/items/Image.js\n  function isImage(item) {\n    return item.type === "IMAGE";\n  }\n\n  // node_modules/@owlbear-rodeo/sdk/lib/types/items/Path.js\n  var Command;\n  (function(Command2) {\n    Command2[Command2["MOVE"] = 0] = "MOVE";\n    Command2[Command2["LINE"] = 1] = "LINE";\n    Command2[Command2["QUAD"] = 2] = "QUAD";\n    Command2[Command2["CONIC"] = 3] = "CONIC";\n    Command2[Command2["CUBIC"] = 4] = "CUBIC";\n    Command2[Command2["CLOSE"] = 5] = "CLOSE";\n  })(Command || (Command = {}));\n\n  // node_modules/@owlbear-rodeo/sdk/lib/index.js\n  var details = getDetails();\n  var messageBus = new MessageBus_default(details.origin, details.roomId);\n  var viewportApi = new ViewportApi_default(messageBus);\n  var playerApi = new PlayerApi_default(messageBus);\n  var partyApi = new PartyApi_default(messageBus);\n  var notificationApi = new NotificationApi_default(messageBus);\n  var sceneApi = new SceneApi_default(messageBus);\n  var contextMenuApi = new ContextMenuApi_default(messageBus);\n  var toolApi = new ToolApi_default(messageBus);\n  var popoverApi = new PopoverApi_default(messageBus);\n  var modalApi = new ModalApi_default(messageBus);\n  var actionApi = new ActionApi_default(messageBus);\n  var interactionApi = new InteractionApi_default(messageBus);\n  var roomApi = new RoomApi_default(messageBus);\n  var themeApi = new ThemeApi_default(messageBus);\n  var assetsApi = new AssetsApi_default(messageBus);\n  var broadcastApi = new BroadcastApi_default(messageBus);\n  var OBR = {\n    onReady: (callback) => {\n      if (messageBus.ready) {\n        callback();\n      } else {\n        messageBus.once("OBR_READY", () => callback());\n      }\n    },\n    get isReady() {\n      return messageBus.ready;\n    },\n    viewport: viewportApi,\n    player: playerApi,\n    party: partyApi,\n    notification: notificationApi,\n    scene: sceneApi,\n    contextMenu: contextMenuApi,\n    tool: toolApi,\n    popover: popoverApi,\n    modal: modalApi,\n    action: actionApi,\n    interaction: interactionApi,\n    room: roomApi,\n    theme: themeApi,\n    assets: assetsApi,\n    broadcast: broadcastApi,\n    /** True if the current site is embedded in an instance of Owlbear Rodeo */\n    isAvailable: Boolean(details.origin)\n  };\n  var lib_default = OBR;\n\n  // shared.ts\n  var BRIDGE_PORT = 27190;\n  var LOCAL_BASE = `http://127.0.0.1:${BRIDGE_PORT}/ext/`;\n  var EXTENSION_ORIGINS = [\n    "https://gizmo73.github.io",\n    `http://127.0.0.1:${BRIDGE_PORT}`,\n    `http://localhost:${BRIDGE_PORT}`\n  ];\n  var OWLBEAR_ORIGINS = ["https://www.owlbear.rodeo", "https://owlbear.rodeo"];\n  var MSG_KEY = "__obsidianBridge";\n  function stripTokenSuffix(name) {\n    return name.trim().replace(/\\s+(?:#?\\d+|\\(\\d+\\)|[A-Z]\\d*)$/, "").trim();\n  }\n\n  // extension/src/app.ts\n  var variant = location.origin === "https://gizmo73.github.io" ? "GitHub Pages copy" : "Obsidian-served copy";\n  var rows = {\n    sdk: { status: "pending", detail: "waiting for Owlbear\\u2026" },\n    http: { status: "pending", detail: "trying\\u2026" },\n    websocket: { status: "pending", detail: "trying\\u2026" },\n    inject: { status: "pending", detail: "waiting for Obsidian to reach in\\u2026" },\n    link: { status: "idle", detail: "press the button below, then check the Creature pane" },\n    creature: { status: "idle", detail: "select a token named after a creature" }\n  };\n  var labels = {\n    sdk: "Owlbear SDK",\n    http: "A1 \\xB7 HTTP to Obsidian",\n    websocket: "A2 \\xB7 WebSocket to Obsidian",\n    inject: "B \\xB7 Obsidian web viewer injection",\n    link: "C \\xB7 obsidian:// link",\n    creature: "Creature pane"\n  };\n  var log = [];\n  function addLog(line) {\n    const stamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();\n    log.unshift(`${stamp}  ${line}`);\n    log.length = Math.min(log.length, 40);\n    render();\n  }\n  function set2(key, status, detail) {\n    rows[key] = { status, detail };\n    render();\n  }\n  function render() {\n    const icon = (s) => ({ pending: "\\u2026", ok: "\\u2714", fail: "\\u2716", idle: "\\u2013" })[s];\n    const table = document.getElementById("rows");\n    if (table) {\n      table.innerHTML = Object.keys(rows).map(\n        (k) => `<div class="row ${rows[k].status}"><span class="icon">${icon(rows[k].status)}</span><span class="label">${labels[k]}</span><span class="detail">${escapeHtml(rows[k].detail)}</span></div>`\n      ).join("");\n    }\n    const logEl = document.getElementById("log");\n    if (logEl) logEl.textContent = log.join("\\n");\n    const summary = document.getElementById("summary");\n    if (summary) summary.value = summaryText();\n  }\n  function summaryText() {\n    const lines = [\n      `Variant: ${variant} (${location.origin})`,\n      `User agent: ${navigator.userAgent}`,\n      ...Object.keys(rows).map((k) => `${labels[k]}: ${rows[k].status.toUpperCase()} - ${rows[k].detail}`)\n    ];\n    return lines.join("\\n");\n  }\n  function escapeHtml(s) {\n    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", \'"\': "&quot;" })[c]);\n  }\n  var ws = null;\n  var injectLive = false;\n  var role = "unknown";\n  var lastCreatureGuess = "Goblin";\n  var playerName = "unknown";\n  function send(msg) {\n    if (ws && ws.readyState === WebSocket.OPEN) {\n      ws.send(JSON.stringify({ ...msg, route: "websocket" }));\n    }\n    postUp({ [MSG_KEY]: true, ...msg, route: "inject" });\n  }\n  function postUp(data) {\n    window.parent.postMessage(data, "*");\n    if (window.top && window.top !== window.parent) window.top.postMessage(data, "*");\n  }\n  function handle(msg) {\n    switch (msg.type) {\n      case "welcome": {\n        const detail = `connected to vault "${msg.vaultName}"; Fantasy Statblocks ${msg.statblocks ? `found (${msg.creatures} creatures)` : "NOT found"}`;\n        if (msg.route === "inject") {\n          injectLive = true;\n          set2("inject", "ok", detail);\n        } else {\n          set2("websocket", "ok", detail);\n        }\n        addLog(`welcome via ${msg.route}`);\n        break;\n      }\n      case "pong": {\n        const ms = Date.now() - msg.t;\n        addLog(`round trip via ${msg.route}: ${ms} ms`);\n        break;\n      }\n      case "shown": {\n        if (msg.creature) {\n          lastCreatureGuess = msg.creature;\n          set2("creature", "ok", `showing "${msg.creature}" (via ${msg.route})`);\n        } else set2("creature", "fail", `no bestiary match for: ${msg.tried.join(", ") || "(nothing)"}`);\n        break;\n      }\n      default:\n        break;\n    }\n  }\n  window.addEventListener("message", (event) => {\n    if (event.source !== window.parent && event.source !== window.top) return;\n    if (!OWLBEAR_ORIGINS.includes(event.origin)) return;\n    const data = event.data;\n    if (!data || typeof data !== "object" || !data[MSG_KEY]) return;\n    handle(data);\n  });\n  async function tryHttp() {\n    const ctrl = new AbortController();\n    const timer = setTimeout(() => ctrl.abort(), 4e3);\n    const started = Date.now();\n    try {\n      const res = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/ping`, {\n        cache: "no-store",\n        signal: ctrl.signal\n      });\n      const body = await res.json();\n      set2("http", "ok", `HTTP ${res.status} in ${Date.now() - started} ms, plugin ${body.plugin}`);\n    } catch (err) {\n      set2("http", "fail", `${err.name}: ${err.message}`);\n    } finally {\n      clearTimeout(timer);\n    }\n  }\n  var wsAttempts = 0;\n  function connectWs() {\n    wsAttempts++;\n    let opened = false;\n    try {\n      ws = new WebSocket(`ws://127.0.0.1:${BRIDGE_PORT}/ws`);\n    } catch (err) {\n      set2("websocket", "fail", `could not create socket: ${err.message}`);\n      setTimeout(connectWs, 5e3);\n      return;\n    }\n    ws.onopen = () => {\n      opened = true;\n      addLog("websocket open");\n      send({ type: "hello", variant, role, player: playerName });\n    };\n    ws.onmessage = (e) => {\n      try {\n        handle(JSON.parse(String(e.data)));\n      } catch {\n      }\n    };\n    ws.onclose = (e) => {\n      if (!opened) {\n        set2(\n          "websocket",\n          "fail",\n          `could not connect (attempt ${wsAttempts}, close code ${e.code}); retrying every 5 s`\n        );\n      } else {\n        set2("websocket", "fail", `connection closed (code ${e.code}); retrying`);\n      }\n      ws = null;\n      setTimeout(connectWs, 5e3);\n    };\n  }\n  function tokenInfo(item) {\n    const label = isImage(item) ? item.text?.plainText ?? "" : "";\n    return { name: item.name ?? "", label };\n  }\n  async function startOwlbear() {\n    if (!lib_default.isAvailable) {\n      set2("sdk", "fail", "not running inside Owlbear Rodeo");\n      return;\n    }\n    lib_default.onReady(async () => {\n      role = await lib_default.player.getRole();\n      playerName = await lib_default.player.getName();\n      set2("sdk", "ok", `ready; you are ${role} "${playerName}"`);\n      send({ type: "hello", variant, role, player: playerName });\n      let lastKey = "";\n      const onSelection = async (ids) => {\n        const key = (ids ?? []).join(",");\n        if (key === lastKey) return;\n        lastKey = key;\n        if (!ids || ids.length === 0) return;\n        const items = await lib_default.scene.items.getItems(ids);\n        const tokens = items.map(tokenInfo);\n        addLog(`selected: ${tokens.map((t) => t.label || t.name).join(", ")}`);\n        lastCreatureGuess = stripTokenSuffix(tokens[0].label || tokens[0].name || lastCreatureGuess);\n        send({ type: "selection", tokens });\n      };\n      lib_default.player.onChange((player) => void onSelection(player.selection));\n      void onSelection(await lib_default.player.getSelection());\n    });\n  }\n  document.addEventListener("DOMContentLoaded", () => {\n    document.getElementById("variant").textContent = `${variant} \\xB7 ${location.origin}`;\n    document.getElementById("retry").addEventListener("click", () => {\n      set2("http", "pending", "trying\\u2026");\n      void tryHttp();\n      send({ type: "hello", variant, role, player: playerName });\n    });\n    document.getElementById("link").addEventListener("click", () => {\n      const url = `obsidian://creature-pane?creature=${encodeURIComponent(lastCreatureGuess)}`;\n      const a = document.createElement("a");\n      a.href = url;\n      a.target = "_blank";\n      a.rel = "noopener";\n      document.body.appendChild(a);\n      a.click();\n      a.remove();\n      set2("link", "pending", `opened ${url} - did the Creature pane show ${lastCreatureGuess}? (tell Claude)`);\n    });\n    render();\n    void tryHttp();\n    connectWs();\n    void startOwlbear();\n    const helloTimer = setInterval(() => {\n      if (injectLive) clearInterval(helloTimer);\n      else postUp({ [MSG_KEY]: true, type: "hello", route: "inject", variant, role, player: playerName });\n    }, 2e3);\n    setInterval(() => send({ type: "ping", t: Date.now() }), 1e4);\n    setTimeout(() => {\n      if (!injectLive) set2("inject", "fail", "no answer from Obsidian after 20 s (still listening)");\n    }, 2e4);\n  });\n})();\n' }, "icon.svg": { "type": "image/svg+xml", "body": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>\n' } };

// plugin/src/main.ts
var OwlbearBridgeSpike = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "server", null);
    __publicField(this, "relay", null);
    __publicField(this, "statusEl");
    __publicField(this, "log", []);
    __publicField(this, "state", {
      server: "starting",
      wsClients: 0,
      httpOk: false,
      relay: "looking for web viewer",
      injectOk: false,
      lastShown: ""
    });
  }
  async onload() {
    this.statusEl = this.addStatusBarItem();
    this.renderStatus();
    this.server = startBridgeServer({
      port: BRIDGE_PORT,
      allowedOrigins: EXTENSION_ORIGINS,
      files: EXTENSION_FILES,
      version: this.manifest.version,
      onMessage: (msg, reply) => void this.handle(msg, reply),
      onLog: (line) => {
        if (line.startsWith("HTTP /ping")) this.state.httpOk = true;
        this.addLog(`[A] ${line}`);
      },
      onClientsChanged: (n) => {
        this.state.wsClients = n;
        this.renderStatus();
      }
    });
    this.server.listening.then(
      () => {
        this.state.server = "listening";
        this.renderStatus();
        new import_obsidian.Notice(`Owlbear bridge test listening on 127.0.0.1:${BRIDGE_PORT}`);
      },
      (err) => {
        this.state.server = "failed";
        this.renderStatus();
        new import_obsidian.Notice(`Owlbear bridge test could not start: ${err.message}`);
      }
    );
    let lastRelay = "";
    this.relay = new WebviewRelay({
      extensionOrigins: EXTENSION_ORIGINS,
      msgKey: MSG_KEY,
      findWebviews: () => this.findWebviews(),
      onMessage: (msg, reply) => {
        this.state.injectOk = true;
        void this.handle(msg, reply);
      },
      onStatus: (s) => {
        const text = describeRelay(s);
        if (text !== lastRelay) {
          lastRelay = text;
          this.state.relay = text;
          this.addLog(`[B] ${text}`);
        }
      }
    });
    this.app.workspace.onLayoutReady(() => this.relay?.start());
    this.addCommand({
      id: "show-log",
      name: "Show connection test log",
      callback: () => new LogModal(this.app, this).open()
    });
    this.addCommand({
      id: "diagnose-web-viewer",
      name: "Diagnose web viewer (logs what Obsidian is showing Owlbear in)",
      callback: () => {
        this.app.workspace.iterateAllLeaves((leaf) => {
          const el = leaf.view.containerEl;
          const webviews = Array.from(el.querySelectorAll("webview"));
          const iframes = Array.from(el.querySelectorAll("iframe")).map((f) => f.src).filter(Boolean);
          if (!webviews.length && !iframes.length) return;
          const urls = webviews.map((w) => {
            try {
              return w.getURL();
            } catch (e) {
              return `(getURL failed: ${e.message})`;
            }
          });
          this.addLog(
            `[diag] view "${leaf.view.getViewType()}": ${webviews.length} webview(s) ${JSON.stringify(urls)}, ${iframes.length} iframe(s) ${JSON.stringify(iframes)}`
          );
        });
        void this.relay?.tick();
        new LogModal(this.app, this).open();
      }
    });
    this.addCommand({
      id: "show-test-creature",
      name: "Show a creature in the Creature pane (self-test)",
      callback: async () => {
        const names = window.FantasyStatblocks?.getBestiaryNames() ?? [];
        const pick = names.includes("Goblin") ? "Goblin" : names[0];
        const result = await this.showCreature([{ name: pick ?? "", label: "" }]);
        new import_obsidian.Notice(result.creature ? `Showing ${result.creature}` : "Fantasy Statblocks not found");
      }
    });
  }
  async onunload() {
    this.relay?.stop();
    await this.server?.close();
  }
  // ------------------------------------------------------------ messages
  async handle(msg, reply) {
    const route = msg.route === "inject" ? "inject" : "websocket";
    const tag = route === "inject" ? "[B]" : "[A]";
    switch (msg.type) {
      case "hello": {
        this.addLog(`${tag} hello from ${msg.variant} (${msg.role} "${msg.player}")`);
        const names = window.FantasyStatblocks?.getBestiaryNames() ?? [];
        reply({
          type: "welcome",
          route,
          vaultName: this.app.vault.getName(),
          statblocks: !!window.FantasyStatblocks,
          creatures: names.length
        });
        break;
      }
      case "ping":
        reply({ type: "pong", route, t: msg.t });
        break;
      case "selection": {
        const tokens = msg.tokens ?? [];
        this.addLog(`${tag} selection: ${tokens.map((t) => t.label || t.name).join(", ")}`);
        const shown = await this.showCreature(tokens);
        reply({ type: "shown", route, ...shown });
        break;
      }
      default:
        break;
    }
    this.renderStatus();
  }
  // ------------------------------------------------------------ Creature pane
  /** Mirrors Fantasy Statblocks' own obsidian://creature-pane handler. */
  async showCreature(tokens) {
    const api = window.FantasyStatblocks;
    const tried = [];
    if (!api) return { creature: null, tried };
    const byKey = new Map(api.getBestiaryNames().map((n) => [matchKey(n), n]));
    const first = tokens[0];
    if (!first) return { creature: null, tried };
    for (const candidate of nameCandidates(first)) {
      tried.push(candidate);
      const match = byKey.get(matchKey(candidate));
      if (!match) continue;
      const creature = api.getBestiary?.().get(match) ?? await api.getCreature?.(match);
      const fs = this.app.plugins.getPlugin(
        "obsidian-5e-statblocks"
      );
      if (fs?.creature_view) await fs.creature_view.render(creature);
      else if (fs?.openCreatureView) await (await fs.openCreatureView()).render(creature);
      this.state.lastShown = match;
      this.addLog(`showing ${match} in the Creature pane`);
      return { creature: match, tried };
    }
    this.addLog(`no bestiary match (tried ${tried.join(", ")})`);
    return { creature: null, tried };
  }
  // ------------------------------------------------------------ helpers
  findWebviews() {
    const found = /* @__PURE__ */ new Set();
    this.app.workspace.iterateAllLeaves((leaf) => {
      leaf.view.containerEl.querySelectorAll("webview").forEach((el) => found.add(el));
    });
    return [...found];
  }
  addLog(line) {
    const stamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    this.log.unshift(`${stamp}  ${line}`);
    this.log.length = Math.min(this.log.length, 200);
    console.log(`[owlbear-bridge-spike] ${line}`);
    this.renderStatus();
  }
  renderStatus() {
    const s = this.state;
    const a = s.server === "failed" ? "A \u2716" : s.wsClients > 0 ? `A \u2714 (${s.wsClients})` : s.httpOk ? "A ~" : "A \u2026";
    const b = s.injectOk ? "B \u2714" : "B \u2026";
    this.statusEl?.setText(`Owlbear test: ${a} \xB7 ${b}${s.lastShown ? ` \xB7 ${s.lastShown}` : ""}`);
  }
  summary() {
    const s = this.state;
    return [
      `Server: ${s.server} on 127.0.0.1:${BRIDGE_PORT}`,
      `Route A: HTTP ping ${s.httpOk ? "received" : "not seen"}; websocket clients ${s.wsClients}`,
      `Route B: ${s.injectOk ? "messages relayed" : "no messages yet"}; ${s.relay}`,
      `Last creature shown: ${s.lastShown || "none"}`,
      `Electron ${process.versions.electron ?? "?"}, Chromium ${process.versions.chrome ?? "?"}`,
      `User agent: ${navigator.userAgent}`
    ].join("\n");
  }
};
function describeRelay(s) {
  if (s.error) return `web viewer found but injection failed: ${s.error}`;
  if (s.webviews === 0) return "no web viewer <webview> found";
  if (s.owlbear === 0) return `${s.webviews} web viewer(s), none on owlbear.rodeo`;
  return `Owlbear open in ${s.owlbear} web viewer(s); our extension frames: ${s.frames.length}`;
}
var LogModal = class extends import_obsidian.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  onOpen() {
    this.titleEl.setText("Owlbear bridge test");
    const text = `${this.plugin.summary()}

${this.plugin.log.join("\n")}`;
    const area = this.contentEl.createEl("textarea", { text });
    area.style.width = "100%";
    area.style.height = "320px";
    area.style.fontFamily = "var(--font-monospace)";
    area.readOnly = true;
    const btn = this.contentEl.createEl("button", { text: "Copy" });
    btn.style.marginTop = "8px";
    btn.onclick = async () => {
      await navigator.clipboard.writeText(text);
      new import_obsidian.Notice("Copied");
    };
  }
  onClose() {
    this.contentEl.empty();
  }
};
