// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?\{ ?[^}]* ?\}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    code = Pointer_stringify(code);
    if (code[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (code.indexOf('"', 1) === code.length-1) {
        code = code.substr(1, code.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + code + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + code + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    return rawList ? list : ret + flushList();
  }
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 816;


/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });







/* memory initializer */ allocate([2,0,0,0,4,0,0,0,0,0,0,0,0,0,240,63,1,0,0,0,0,0,0,0,154,153,153,153,153,153,201,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,63,0,0,0,0,0,0,0,0,0,1,1,0,1,0,1,1,0,1,1,0,0,1,1,1,0,0,0,1,1,1,0,1,0,1,1,0,1,0,0,0,0,0,0,1,1,1,0,1,1,0,0,1,0,0,0,0,0,1,0,0,1,1,0,0,0,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1,0,0,0,1,1,0,0,0,0,1,0,1,1,0,0,1,1,1,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,0,0,0,0,1,0,1,0,1,0,1,0,0,1,0,0,1,0,1,1,1,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0,1,0,1,0,1,0,0,1,1,0,1,0,0,0,0,0,0,1,0,0,0,0,1,1,1,1,0,1,1,0,0,1,1,0,0,1,1,0,1,1,0,0,0,1,1,1,1,0,1,0,0,0,0,1,0,1,1,1,0,0,0,1,0,1,1,0,0,1,1,1,0,1,0,0,1,1,0,0,1,1,1,0,0,1,1,1,0,0,0,0,1,0,1,0,1,0,1,0,1,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);



var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}




  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;



  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  var _sqrt=Math_sqrt;

  var _fabs=Math_abs;

  function _abort() {
      Module['abort']();
    }



  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }function ___errno_location() {
      return ___errno_state;
    }

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }


  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }






  Module["_strlen"] = _strlen;




  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};

  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};

  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};

  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);

          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);

            var src = populate ? remote : local;
            var dst = populate ? local : remote;

            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }

        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;

          var fileStore;

          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }

          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;

          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};

        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };

        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));

        while (check.length) {
          var path = check.pop();
          var stat;

          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }

          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }

          entries[path] = { timestamp: stat.mtime };
        }

        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};

        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);

          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };

          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');

          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;

            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }

            entries[cursor.primaryKey] = { timestamp: cursor.key };

            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;

        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }

        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }

          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }

        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);

          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }

        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;

        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });

        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });

        if (!total) {
          return callback(null);
        }

        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);

        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };

        transaction.onerror = function() { done(this.error); };

        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });

        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};

  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }

          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }

          stream.position = position;
          return position;
        }}};

  var _stdin=allocate(1, "i32*", ALLOC_STATIC);

  var _stdout=allocate(1, "i32*", ALLOC_STATIC);

  var _stderr=allocate(1, "i32*", ALLOC_STATIC);

  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};

        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }

        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }

        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);

        // start at the root
        var current = FS.root;
        var current_path = '/';

        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }

          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);

          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }

          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);

              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;

              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }

        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;


        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };

          FS.FSNode.prototype = {};

          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;

          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }

        var node = new FS.FSNode(parent, name, mode, rdev);

        FS.hashAddNode(node);

        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];

        while (check.length) {
          var m = check.pop();

          mounts.push(m);

          check.push.apply(check, m.mounts);
        }

        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }

        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;

        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };

        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;

        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });

          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;

          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }

          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }

        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };

        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;

        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;

          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }

        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });

        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }

        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);

        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];

          while (current) {
            var next = current.name_next;

            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }

            current = next;
          }
        });

        // no longer a mountpoint
        node.mounted = null;

        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);

        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops

        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }

        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');

        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');

        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();

        FS.nameTable = new Array(4096);

        FS.mount(MEMFS, {}, '/');

        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;

        FS.ensureErrnoError();

        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];

        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes

              if (!hasByteServing) chunkSize = datalength;

              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");

                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);

                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }

                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });

              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }

          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });

          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }

        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};var Browser={mainLoop:{scheduler:null,method:"",shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers

        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;

        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }

        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).

        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);

        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);

        // Canvas event setup

        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);

        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }

        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);

        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };

            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }


            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";

          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;

        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }

        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }

        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        return Math.max(-1, Math.min(1, event.type === 'DOMMouseScroll' ? event.detail : -event.wheelDelta));
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }

          // check if SDL is available
          if (typeof SDL != "undefined") {
		Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
		Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
		// just add the mouse delta to the current absolut mouse position
		// FIXME: ideally this should be clamped against the canvas size and zero
		Browser.mouseX += Browser.mouseMovementX;
		Browser.mouseY += Browser.mouseMovementY;
          }
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;

          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (scrollX + rect.left);
              y = t.pageY - (scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (scrollX + rect.left);
            y = event.pageY - (scrollY + rect.top);
          }

          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);

          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available
        if (typeof SDL != "undefined") {
		var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
		flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
		HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available
        if (typeof SDL != "undefined") {
		var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
		flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
		HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");


var Math_min = Math.min;
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vdi(index,a1,a2) {
  try {
    Module["dynCall_vdi"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=+env.NaN;var n=+env.Infinity;var o=0;var p=0;var q=0;var r=0;var s=0,t=0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0.0;var B=0;var C=0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=global.Math.floor;var M=global.Math.abs;var N=global.Math.sqrt;var O=global.Math.pow;var P=global.Math.cos;var Q=global.Math.sin;var R=global.Math.tan;var S=global.Math.acos;var T=global.Math.asin;var U=global.Math.atan;var V=global.Math.atan2;var W=global.Math.exp;var X=global.Math.log;var Y=global.Math.ceil;var Z=global.Math.imul;var _=env.abort;var $=env.assert;var aa=env.asmPrintInt;var ba=env.asmPrintFloat;var ca=env.min;var da=env.invoke_vi;var ea=env.invoke_ii;var fa=env.invoke_v;var ga=env.invoke_vdi;var ha=env.invoke_iii;var ia=env._sysconf;var ja=env._sbrk;var ka=env._fabs;var la=env.___setErrNo;var ma=env.___errno_location;var na=env._sqrt;var oa=env._abort;var pa=env._time;var qa=env._emscripten_memcpy_big;var ra=env._fflush;var sa=0.0;
// EMSCRIPTEN_START_FUNCS
function ya(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function za(){return i|0}function Aa(a){a=a|0;i=a}function Ba(a,b){a=a|0;b=b|0;if((o|0)==0){o=a;p=b}}function Ca(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function Da(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function Ea(a){a=a|0;B=a}function Fa(a){a=a|0;C=a}function Ga(a){a=a|0;D=a}function Ha(a){a=a|0;E=a}function Ia(a){a=a|0;F=a}function Ja(a){a=a|0;G=a}function Ka(a){a=a|0;H=a}function La(a){a=a|0;I=a}function Ma(a){a=a|0;J=a}function Na(a){a=a|0;K=a}function Oa(){}function Pa(){var a=0,b=0,d=0,e=0,f=0,g=0,h=0;a=i;b=0;d=0;e=Yb(36)|0;b=e;do{if((e|0)!=0){bc(b|0,0,36)|0;f=Yb(100)|0;d=f;if((f|0)==0){break}bc(d|0,0,100)|0;c[b+32>>2]=d;g=b;h=g;i=a;return h|0}}while(0);Zb(b);Zb(d);g=0;h=g;i=a;return h|0}function Qa(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=a;if((d|0)==0){e=d;f=e;Zb(f);i=b;return}if((c[d+32>>2]|0)!=0){Zb(c[(c[d+32>>2]|0)+4>>2]|0);Zb(c[(c[d+32>>2]|0)+8>>2]|0);Zb(c[(c[d+32>>2]|0)+20>>2]|0);Zb(c[(c[d+32>>2]|0)+28>>2]|0);Ra((c[d+32>>2]|0)+32|0);Ra((c[d+32>>2]|0)+64|0)}Zb(c[d+32>>2]|0);e=d;f=e;Zb(f);i=b;return}function Ra(a){a=a|0;var b=0,d=0;b=i;d=a;Zb(c[d+4>>2]|0);Zb(c[d+8>>2]|0);Zb(c[d+16>>2]|0);Zb(c[d+20>>2]|0);Zb(c[d+24>>2]|0);Zb(c[d+28>>2]|0);i=b;return}function Sa(a){a=a|0;var b=0,d=0,e=0;b=i;d=a;a=d;while(1){if((a|0)!=0){d=c[a+20>>2]|0;c[a+20>>2]=0;e=1}else{e=0}if((e|0)==0){break}Qa(a);a=d}i=b;return}function Ta(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;e=a;a=b;bc(e|0,0,32)|0;c[e>>2]=a;b=Yb(a<<2)|0;c[e+4>>2]=b;do{if((b|0)!=0){f=Yb(a*48|0)|0;c[e+8>>2]=f;if((f|0)==0){break}f=Yb(a<<4)|0;c[e+16>>2]=f;if((f|0)==0){break}f=Yb(a<<3)|0;c[e+20>>2]=f;if((f|0)==0){break}f=Yb(a<<3)|0;c[e+24>>2]=f;if((f|0)==0){break}f=Yb(a<<3)|0;c[e+28>>2]=f;if((f|0)==0){break}g=0;h=g;i=d;return h|0}}while(0);Zb(c[e+4>>2]|0);Zb(c[e+8>>2]|0);Zb(c[e+16>>2]|0);Zb(c[e+20>>2]|0);Zb(c[e+24>>2]|0);Zb(c[e+28>>2]|0);g=1;h=g;i=d;return h|0}function Ua(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[a>>2]=c[d>>2];c[a+4>>2]=c[d+4>>2];c[a+8>>2]=c[d+8>>2];i=i;return}function Va(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0.0,j=0.0,k=0,l=0,m=0,n=0;e=i;f=a;a=b;b=d;g=0.0;j=0.0;if((c[b>>2]|0)!=0){g=0.0;k=f;while(1){if((k|0)==0){break}g=g+ +(c[c[k+32>>2]>>2]|0);k=c[k+20>>2]|0}j=0.0}k=f;while(1){if((k|0)==0){l=28;break}if((Wa(c[k+32>>2]|0)|0)!=0){l=10;break}if((Xa(c[k+32>>2]|0)|0)!=0){l=12;break}if((Ya(c[k+32>>2]|0)|0)!=0){l=14;break}if((Za(c[k+32>>2]|0)|0)!=0){l=16;break}if((c[k+4>>2]|0)==45){_a((c[k+32>>2]|0)+32|0)}$a((c[k+32>>2]|0)+32|0,+h[a+8>>3]);if((c[a+16>>2]|0)!=0){if((ab(c[k+32>>2]|0,+h[a+24>>3])|0)!=0){l=21;break}c[(c[k+32>>2]|0)+96>>2]=(c[k+32>>2]|0)+64}else{c[(c[k+32>>2]|0)+96>>2]=(c[k+32>>2]|0)+32}Ua(c[(c[k+32>>2]|0)+96>>2]|0,k+8|0);if((c[b>>2]|0)!=0){j=j+ +(c[c[k+32>>2]>>2]|0);bb(j/g,b)}k=c[k+20>>2]|0}if((l|0)!=10)if((l|0)!=12)if((l|0)!=14)if((l|0)!=16)if((l|0)!=21)if((l|0)==28){bb(1.0,b);m=0;n=m;i=e;return n|0}m=1;n=m;i=e;return n|0}function Wa(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,k=0,l=0.0;b=i;d=a;a=c[d>>2]|0;e=Yb(((c[d>>2]|0)+1|0)*40|0)|0;c[d+20>>2]=e;if((e|0)==0){f=1;g=f;i=b;return g|0}c[d+12>>2]=c[c[d+4>>2]>>2];c[d+16>>2]=c[(c[d+4>>2]|0)+4>>2];h[(c[d+20>>2]|0)+8>>3]=0.0;h[c[d+20>>2]>>3]=0.0;h[(c[d+20>>2]|0)+32>>3]=0.0;h[(c[d+20>>2]|0)+24>>3]=0.0;h[(c[d+20>>2]|0)+16>>3]=0.0;e=0;while(1){if((e|0)>=(a|0)){break}j=(c[(c[d+4>>2]|0)+(e<<3)>>2]|0)-(c[d+12>>2]|0)|0;k=(c[(c[d+4>>2]|0)+(e<<3)+4>>2]|0)-(c[d+16>>2]|0)|0;h[(c[d+20>>2]|0)+((e+1|0)*40|0)>>3]=+h[(c[d+20>>2]|0)+(e*40|0)>>3]+ +(j|0);h[(c[d+20>>2]|0)+((e+1|0)*40|0)+8>>3]=+h[(c[d+20>>2]|0)+(e*40|0)+8>>3]+ +(k|0);l=+h[(c[d+20>>2]|0)+(e*40|0)+16>>3]+ +(Z(j,j)|0);h[(c[d+20>>2]|0)+((e+1|0)*40|0)+16>>3]=l;l=+h[(c[d+20>>2]|0)+(e*40|0)+24>>3]+ +(Z(j,k)|0);h[(c[d+20>>2]|0)+((e+1|0)*40|0)+24>>3]=l;l=+h[(c[d+20>>2]|0)+(e*40|0)+32>>3]+ +(Z(k,k)|0);h[(c[d+20>>2]|0)+((e+1|0)*40|0)+32>>3]=l;e=e+1|0}f=0;g=f;i=b;return g|0}function Xa(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;b=i;i=i+56|0;d=b|0;e=b+16|0;f=b+32|0;g=b+40|0;h=b+48|0;j=a;a=c[j+4>>2]|0;k=c[j>>2]|0;l=0;m=0;n=Yb(k<<2)|0;l=n;do{if((n|0)!=0){o=Yb(k<<2)|0;m=o;if((o|0)==0){break}o=0;p=k-1|0;while(1){if((p|0)<0){break}do{if((c[a+(p<<3)>>2]|0)!=(c[a+(o<<3)>>2]|0)){if((c[a+(p<<3)+4>>2]|0)==(c[a+(o<<3)+4>>2]|0)){break}o=p+1|0}}while(0);c[m+(p<<2)>>2]=o;p=p-1|0}q=Yb(k<<2)|0;c[j+8>>2]=q;if((q|0)==0){break}p=k-1|0;while(1){if((p|0)<0){break}c[d+12>>2]=0;c[d+8>>2]=0;c[d+4>>2]=0;c[d>>2]=0;q=c[a+((db(p+1|0,k)|0)<<3)>>2]|0;r=((q-(c[a+(p<<3)>>2]|0)|0)*3|0)+3|0;q=c[a+((db(p+1|0,k)|0)<<3)+4>>2]|0;s=(r+(q-(c[a+(p<<3)+4>>2]|0))|0)/2|0;q=d+(s<<2)|0;c[q>>2]=(c[q>>2]|0)+1;c[e>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;o=c[m+(p<<2)>>2]|0;q=p;a:while(1){if(((c[a+(o<<3)>>2]|0)-(c[a+(q<<3)>>2]|0)|0)>0){t=1}else{t=((c[a+(o<<3)>>2]|0)-(c[a+(q<<3)>>2]|0)|0)<0?-1:0}if(((c[a+(o<<3)+4>>2]|0)-(c[a+(q<<3)+4>>2]|0)|0)>0){u=1}else{u=((c[a+(o<<3)+4>>2]|0)-(c[a+(q<<3)+4>>2]|0)|0)<0?-1:0}s=((t*3|0)+3+u|0)/2|0;r=d+(s<<2)|0;c[r>>2]=(c[r>>2]|0)+1;do{if((c[d>>2]|0)!=0){if((c[d+4>>2]|0)==0){break}if((c[d+8>>2]|0)==0){break}if((c[d+12>>2]|0)!=0){v=27;break a}}}while(0);c[f>>2]=(c[a+(o<<3)>>2]|0)-(c[a+(p<<3)>>2]|0);c[f+4>>2]=(c[a+(o<<3)+4>>2]|0)-(c[a+(p<<3)+4>>2]|0);if((rb(e|0,f)|0)<0){v=30;break}if((rb(e+8|0,f)|0)>0){v=30;break}if((c[f>>2]|0)>0){w=c[f>>2]|0}else{w=-(c[f>>2]|0)|0}do{if((w|0)<=1){if((c[f+4>>2]|0)>0){x=c[f+4>>2]|0}else{x=-(c[f+4>>2]|0)|0}if((x|0)>1){v=40;break}}else{v=40}}while(0);if((v|0)==40){v=0;r=c[f>>2]|0;if((c[f+4>>2]|0)>=0){if((c[f+4>>2]|0)>0){y=1}else{y=(c[f>>2]|0)<0}z=y}else{z=0}c[g>>2]=r+(z?1:-1);r=c[f+4>>2]|0;if((c[f>>2]|0)<=0){if((c[f>>2]|0)<0){A=1}else{A=(c[f+4>>2]|0)<0}B=A}else{B=0}c[g+4>>2]=r+(B?1:-1);if((rb(e|0,g)|0)>=0){r=e|0;C=g;c[r>>2]=c[C>>2];c[r+4>>2]=c[C+4>>2]}C=c[f>>2]|0;if((c[f+4>>2]|0)<=0){if((c[f+4>>2]|0)<0){D=1}else{D=(c[f>>2]|0)<0}E=D}else{E=0}c[g>>2]=C+(E?1:-1);C=c[f+4>>2]|0;if((c[f>>2]|0)>=0){if((c[f>>2]|0)>0){F=1}else{F=(c[f+4>>2]|0)<0}G=F}else{G=0}c[g+4>>2]=C+(G?1:-1);if((rb(e+8|0,g)|0)<=0){C=e+8|0;r=g;c[C>>2]=c[r>>2];c[C+4>>2]=c[r+4>>2]}}q=o;o=c[m+(q<<2)>>2]|0;if((sb(o,p,q)|0)==0){v=62;break}}if((v|0)==27){v=0;c[l+(p<<2)>>2]=q}else if((v|0)==30){v=0;v=65}else if((v|0)==62){v=0;v=65}if((v|0)==65){v=0;if(((c[a+(o<<3)>>2]|0)-(c[a+(q<<3)>>2]|0)|0)>0){H=1}else{H=((c[a+(o<<3)>>2]|0)-(c[a+(q<<3)>>2]|0)|0)<0?-1:0}c[h>>2]=H;if(((c[a+(o<<3)+4>>2]|0)-(c[a+(q<<3)+4>>2]|0)|0)>0){I=1}else{I=((c[a+(o<<3)+4>>2]|0)-(c[a+(q<<3)+4>>2]|0)|0)<0?-1:0}c[h+4>>2]=I;c[f>>2]=(c[a+(q<<3)>>2]|0)-(c[a+(p<<3)>>2]|0);c[f+4>>2]=(c[a+(q<<3)+4>>2]|0)-(c[a+(p<<3)+4>>2]|0);s=rb(e|0,f)|0;r=rb(e|0,h)|0;C=rb(e+8|0,f)|0;J=rb(e+8|0,h)|0;K=1e7;if((r|0)<0){K=tb(s,-r|0)|0}if((J|0)>0){if((K|0)<(tb(-C|0,J)|0)){L=K}else{L=tb(-C|0,J)|0}K=L}c[l+(p<<2)>>2]=db(q+K|0,k)|0}p=p-1|0}K=c[l+(k-1<<2)>>2]|0;c[(c[j+8>>2]|0)+(k-1<<2)>>2]=K;p=k-2|0;while(1){if((p|0)<0){break}if((sb(p+1|0,c[l+(p<<2)>>2]|0,K)|0)!=0){K=c[l+(p<<2)>>2]|0}c[(c[j+8>>2]|0)+(p<<2)>>2]=K;p=p-1|0}p=k-1|0;while(1){o=db(p+1|0,k)|0;if((sb(o,K,c[(c[j+8>>2]|0)+(p<<2)>>2]|0)|0)==0){break}c[(c[j+8>>2]|0)+(p<<2)>>2]=K;p=p-1|0}Zb(l);Zb(m);M=0;N=M;i=b;return N|0}}while(0);Zb(l);Zb(m);M=1;N=M;i=b;return N|0}function Ya(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0,s=0.0,t=0.0,u=0,v=0,w=0;b=i;d=a;a=c[d>>2]|0;e=0;f=0;g=0;j=0;k=0;l=0;m=Yb(a+1<<3)|0;e=m;do{if((m|0)!=0){n=Yb(a+1<<2)|0;f=n;if((n|0)==0){break}n=Yb(a<<2)|0;g=n;if((n|0)==0){break}n=Yb(a+1<<2)|0;j=n;if((n|0)==0){break}n=Yb(a+1<<2)|0;k=n;if((n|0)==0){break}n=Yb(a+1<<2)|0;l=n;if((n|0)==0){break}n=0;while(1){if((n|0)>=(a|0)){break}o=db(n-1|0,a)|0;p=db((c[(c[d+8>>2]|0)+(o<<2)>>2]|0)-1|0,a)|0;if((p|0)==(n|0)){p=db(n+1|0,a)|0}if((p|0)<(n|0)){c[g+(n<<2)>>2]=a}else{c[g+(n<<2)>>2]=p}n=n+1|0}p=1;n=0;while(1){if((n|0)>=(a|0)){break}while(1){if((p|0)>(c[g+(n<<2)>>2]|0)){break}c[j+(p<<2)>>2]=n;p=p+1|0}n=n+1|0}n=0;p=0;while(1){if((n|0)>=(a|0)){break}c[k+(p<<2)>>2]=n;n=c[g+(n<<2)>>2]|0;p=p+1|0}c[k+(p<<2)>>2]=a;o=p;n=a;p=o;while(1){if((p|0)<=0){break}c[l+(p<<2)>>2]=n;n=c[j+(n<<2)>>2]|0;p=p-1|0}c[l>>2]=0;h[e>>3]=0.0;p=1;while(1){if((p|0)>(o|0)){break}n=c[l+(p<<2)>>2]|0;while(1){if((n|0)>(c[k+(p<<2)>>2]|0)){break}q=-1.0;r=c[k+(p-1<<2)>>2]|0;while(1){if((r|0)<(c[j+(n<<2)>>2]|0)){break}s=+qb(d,r,n);t=s+ +h[e+(r<<3)>>3];if(q<0.0){u=45}else{if(t<q){u=45}}if((u|0)==45){u=0;c[f+(n<<2)>>2]=r;q=t}r=r-1|0}h[e+(n<<3)>>3]=q;n=n+1|0}p=p+1|0}c[d+24>>2]=o;r=Yb(o<<2)|0;c[d+28>>2]=r;if((r|0)==0){break}n=a;p=o-1|0;while(1){if((n|0)<=0){break}n=c[f+(n<<2)>>2]|0;c[(c[d+28>>2]|0)+(p<<2)>>2]=n;p=p-1|0}Zb(e);Zb(f);Zb(g);Zb(j);Zb(k);Zb(l);v=0;w=v;i=b;return w|0}}while(0);Zb(e);Zb(f);Zb(g);Zb(j);Zb(k);Zb(l);v=1;w=v;i=b;return w|0}function Za(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0.0,x=0,y=0,z=0.0,A=0.0,B=0.0,C=0,D=0.0,E=0.0,F=0.0,G=0,H=0.0,I=0,J=0;b=i;i=i+128|0;d=b|0;e=b+24|0;f=b+40|0;g=b+112|0;j=a;a=c[j+24>>2]|0;k=c[j+28>>2]|0;l=c[j>>2]|0;m=c[j+4>>2]|0;n=c[j+12>>2]|0;o=c[j+16>>2]|0;p=0;q=0;r=0;s=Yb(a<<4)|0;p=s;do{if((s|0)!=0){t=Yb(a<<4)|0;q=t;if((t|0)==0){break}t=Yb(a*72|0)|0;r=t;if((t|0)==0){break}if((Ta(j+32|0,a)|0)!=0){break}t=0;while(1){if((t|0)>=(a|0)){break}u=c[k+((db(t+1|0,a)|0)<<2)>>2]|0;v=db(u-(c[k+(t<<2)>>2]|0)|0,l)|0;u=v+(c[k+(t<<2)>>2]|0)|0;ob(j,c[k+(t<<2)>>2]|0,u,p+(t<<4)|0,q+(t<<4)|0);t=t+1|0}t=0;while(1){if((t|0)>=(a|0)){break}w=+h[q+(t<<4)>>3]*+h[q+(t<<4)>>3]+ +h[q+(t<<4)+8>>3]*+h[q+(t<<4)+8>>3];if(w==0.0){u=0;while(1){if((u|0)>=3){break}x=0;while(1){if((x|0)>=3){break}h[r+(t*72|0)+(u*24|0)+(x<<3)>>3]=0.0;x=x+1|0}u=u+1|0}}else{h[d>>3]=+h[q+(t<<4)+8>>3];h[d+8>>3]=-0.0- +h[q+(t<<4)>>3];h[d+16>>3]=(-0.0- +h[d+8>>3])*+h[p+(t<<4)+8>>3]- +h[d>>3]*+h[p+(t<<4)>>3];y=0;while(1){if((y|0)>=3){break}x=0;while(1){if((x|0)>=3){break}h[r+(t*72|0)+(y*24|0)+(x<<3)>>3]=+h[d+(y<<3)>>3]*+h[d+(x<<3)>>3]/w;x=x+1|0}y=y+1|0}}t=t+1|0}t=0;while(1){if((t|0)>=(a|0)){break}h[e>>3]=+((c[m+(c[k+(t<<2)>>2]<<3)>>2]|0)-n|0);h[e+8>>3]=+((c[m+(c[k+(t<<2)>>2]<<3)+4>>2]|0)-o|0);u=db(t-1|0,a)|0;y=0;while(1){if((y|0)>=3){break}x=0;while(1){if((x|0)>=3){break}h[f+(y*24|0)+(x<<3)>>3]=+h[r+(u*72|0)+(y*24|0)+(x<<3)>>3]+ +h[r+(t*72|0)+(y*24|0)+(x<<3)>>3];x=x+1|0}y=y+1|0}while(1){Zb(0);z=+h[f>>3]*+h[f+32>>3]- +h[f+8>>3]*+h[f+24>>3];if(z!=0.0){break}if(+h[f>>3]>+h[f+32>>3]){h[d>>3]=-0.0- +h[f+8>>3];h[d+8>>3]=+h[f>>3]}else{if(+h[f+32>>3]!=0.0){h[d>>3]=-0.0- +h[f+32>>3];h[d+8>>3]=+h[f+24>>3]}else{h[d>>3]=1.0;h[d+8>>3]=0.0}}w=+h[d>>3]*+h[d>>3]+ +h[d+8>>3]*+h[d+8>>3];h[d+16>>3]=(-0.0- +h[d+8>>3])*+h[e+8>>3]- +h[d>>3]*+h[e>>3];y=0;while(1){if((y|0)>=3){break}x=0;while(1){if((x|0)>=3){break}v=f+(y*24|0)+(x<<3)|0;h[v>>3]=+h[v>>3]+ +h[d+(y<<3)>>3]*+h[d+(x<<3)>>3]/w;x=x+1|0}y=y+1|0}}h[g>>3]=((-0.0- +h[f+16>>3])*+h[f+32>>3]+ +h[f+40>>3]*+h[f+8>>3])/z;h[g+8>>3]=(+h[f+16>>3]*+h[f+24>>3]- +h[f+40>>3]*+h[f>>3])/z;A=+M(+(+h[g>>3]- +h[e>>3]));B=+M(+(+h[g+8>>3]- +h[e+8>>3]));do{if(A<=.5){if(!(B<=.5)){C=67;break}h[(c[j+48>>2]|0)+(t<<4)>>3]=+h[g>>3]+ +(n|0);h[(c[j+48>>2]|0)+(t<<4)+8>>3]=+h[g+8>>3]+ +(o|0)}else{C=67}}while(0);if((C|0)==67){C=0;D=+pb(f|0,e);E=+h[e>>3];F=+h[e+8>>3];if(!(+h[f>>3]==0.0)){G=0;while(1){if((G|0)>=2){break}h[g+8>>3]=+h[e+8>>3]-.5+ +(G|0);h[g>>3]=(-0.0-(+h[f+8>>3]*+h[g+8>>3]+ +h[f+16>>3]))/+h[f>>3];A=+M(+(+h[g>>3]- +h[e>>3]));H=+pb(f|0,g);do{if(A<=.5){if(!(H<D)){break}D=H;E=+h[g>>3];F=+h[g+8>>3]}}while(0);G=G+1|0}}if(!(+h[f+32>>3]==0.0)){G=0;while(1){if((G|0)>=2){break}h[g>>3]=+h[e>>3]-.5+ +(G|0);h[g+8>>3]=(-0.0-(+h[f+24>>3]*+h[g>>3]+ +h[f+40>>3]))/+h[f+32>>3];B=+M(+(+h[g+8>>3]- +h[e+8>>3]));H=+pb(f|0,g);do{if(B<=.5){if(!(H<D)){break}D=H;E=+h[g>>3];F=+h[g+8>>3]}}while(0);G=G+1|0}}y=0;while(1){if((y|0)>=2){break}x=0;while(1){if((x|0)>=2){break}h[g>>3]=+h[e>>3]-.5+ +(y|0);h[g+8>>3]=+h[e+8>>3]-.5+ +(x|0);H=+pb(f|0,g);if(H<D){D=H;E=+h[g>>3];F=+h[g+8>>3]}x=x+1|0}y=y+1|0}h[(c[j+48>>2]|0)+(t<<4)>>3]=E+ +(n|0);h[(c[j+48>>2]|0)+(t<<4)+8>>3]=F+ +(o|0)}t=t+1|0}Zb(p);Zb(q);Zb(r);I=0;J=I;i=b;return J|0}}while(0);Zb(p);Zb(q);Zb(r);I=1;J=I;i=b;return J|0}function _a(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+16|0;d=b|0;e=a;a=0;f=(c[e>>2]|0)-1|0;while(1){if((a|0)>=(f|0)){break}g=d;h=(c[e+16>>2]|0)+(a<<4)|0;c[g>>2]=c[h>>2];c[g+4>>2]=c[h+4>>2];c[g+8>>2]=c[h+8>>2];c[g+12>>2]=c[h+12>>2];h=(c[e+16>>2]|0)+(a<<4)|0;g=(c[e+16>>2]|0)+(f<<4)|0;c[h>>2]=c[g>>2];c[h+4>>2]=c[g+4>>2];c[h+8>>2]=c[g+8>>2];c[h+12>>2]=c[g+12>>2];g=(c[e+16>>2]|0)+(f<<4)|0;h=d;c[g>>2]=c[h>>2];c[g+4>>2]=c[h+4>>2];c[g+8>>2]=c[h+8>>2];c[g+12>>2]=c[h+12>>2];a=a+1|0;f=f-1|0}i=b;return}function $a(a,b){a=a|0;b=+b;var d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0.0,o=0,p=0,q=0,r=0,s=0,t=0.0,u=0.0,v=0.0;d=i;i=i+96|0;e=d|0;f=d+16|0;g=d+32|0;j=d+48|0;k=d+64|0;l=d+80|0;m=a;n=b;a=c[m>>2]|0;o=0;while(1){if((o|0)>=(a|0)){break}p=db(o+1|0,a)|0;q=db(o+2|0,a)|0;fb(j,.5,(c[m+16>>2]|0)+(q<<4)|0,(c[m+16>>2]|0)+(p<<4)|0);r=g;s=j;c[r>>2]=c[s>>2];c[r+4>>2]=c[s+4>>2];c[r+8>>2]=c[s+8>>2];c[r+12>>2]=c[s+12>>2];b=+mb((c[m+16>>2]|0)+(o<<4)|0,(c[m+16>>2]|0)+(q<<4)|0);if(b!=0.0){t=+cb((c[m+16>>2]|0)+(o<<4)|0,(c[m+16>>2]|0)+(p<<4)|0,(c[m+16>>2]|0)+(q<<4)|0)/b;t=+M(+t);if(t>1.0){u=1.0-1.0/t}else{u=0.0}v=u;v=v/.75}else{v=1.3333333333333333}h[(c[m+24>>2]|0)+(p<<3)>>3]=v;if(v>=n){c[(c[m+4>>2]|0)+(p<<2)>>2]=2;s=(c[m+8>>2]|0)+(p*48|0)+16|0;r=(c[m+16>>2]|0)+(p<<4)|0;c[s>>2]=c[r>>2];c[s+4>>2]=c[r+4>>2];c[s+8>>2]=c[r+8>>2];c[s+12>>2]=c[r+12>>2];r=(c[m+8>>2]|0)+(p*48|0)+32|0;s=g;c[r>>2]=c[s>>2];c[r+4>>2]=c[s+4>>2];c[r+8>>2]=c[s+8>>2];c[r+12>>2]=c[s+12>>2]}else{if(v<.55){v=.55}else{if(v>1.0){v=1.0}}fb(k,.5*v+.5,(c[m+16>>2]|0)+(o<<4)|0,(c[m+16>>2]|0)+(p<<4)|0);s=e;r=k;c[s>>2]=c[r>>2];c[s+4>>2]=c[r+4>>2];c[s+8>>2]=c[r+8>>2];c[s+12>>2]=c[r+12>>2];fb(l,.5*v+.5,(c[m+16>>2]|0)+(q<<4)|0,(c[m+16>>2]|0)+(p<<4)|0);q=f;r=l;c[q>>2]=c[r>>2];c[q+4>>2]=c[r+4>>2];c[q+8>>2]=c[r+8>>2];c[q+12>>2]=c[r+12>>2];c[(c[m+4>>2]|0)+(p<<2)>>2]=1;r=(c[m+8>>2]|0)+(p*48|0)|0;q=e;c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];q=(c[m+8>>2]|0)+(p*48|0)+16|0;r=f;c[q>>2]=c[r>>2];c[q+4>>2]=c[r+4>>2];c[q+8>>2]=c[r+8>>2];c[q+12>>2]=c[r+12>>2];r=(c[m+8>>2]|0)+(p*48|0)+32|0;q=g;c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2]}h[(c[m+20>>2]|0)+(p<<3)>>3]=v;h[(c[m+28>>2]|0)+(p<<3)>>3]=.5;o=o+1|0}c[m+12>>2]=1;i=d;return}function ab(a,b){a=a|0;b=+b;var d=0,e=0,f=0,g=0,j=0,k=0.0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0.0,C=0,D=0,E=0,F=0,G=0;d=i;i=i+96|0;e=d|0;f=d+64|0;g=d+80|0;j=a;k=b;a=c[j+32>>2]|0;l=0;m=0;n=0;o=0;p=0;q=0;r=0;s=0;t=Yb(a+1<<2)|0;l=t;do{if((t|0)!=0){u=Yb(a+1<<3)|0;m=u;if((u|0)==0){break}u=Yb(a+1<<2)|0;n=u;if((u|0)==0){break}u=Yb(a+1<<6)|0;o=u;if((u|0)==0){break}u=Yb(a<<2)|0;r=u;if((u|0)==0){break}u=Yb(a+1<<3)|0;s=u;if((u|0)==0){break}u=0;while(1){if((u|0)>=(a|0)){break}if((c[(c[j+36>>2]|0)+(u<<2)>>2]|0)==1){v=db(u-1|0,a)|0;w=(c[j+48>>2]|0)+(v<<4)|0;v=(c[j+48>>2]|0)+(u<<4)|0;x=db(u+1|0,a)|0;if(+cb(w,v,(c[j+48>>2]|0)+(x<<4)|0)>0.0){y=1}else{x=db(u-1|0,a)|0;v=(c[j+48>>2]|0)+(x<<4)|0;x=(c[j+48>>2]|0)+(u<<4)|0;w=db(u+1|0,a)|0;z=+cb(v,x,(c[j+48>>2]|0)+(w<<4)|0)<0.0;y=z?-1:0}c[r+(u<<2)>>2]=y}else{c[r+(u<<2)>>2]=0}u=u+1|0}b=0.0;h[s>>3]=0.0;z=f;w=c[j+48>>2]|0;c[z>>2]=c[w>>2];c[z+4>>2]=c[w+4>>2];c[z+8>>2]=c[w+8>>2];c[z+12>>2]=c[w+12>>2];u=0;while(1){if((u|0)>=(a|0)){break}A=db(u+1|0,a)|0;if((c[(c[j+36>>2]|0)+(A<<2)>>2]|0)==1){B=+h[(c[j+52>>2]|0)+(A<<3)>>3];b=b+.3*B*(4.0-B)*+cb((c[j+40>>2]|0)+(u*48|0)+32|0,(c[j+48>>2]|0)+(A<<4)|0,(c[j+40>>2]|0)+(A*48|0)+32|0)/2.0;b=b+ +cb(f,(c[j+40>>2]|0)+(u*48|0)+32|0,(c[j+40>>2]|0)+(A*48|0)+32|0)/2.0}h[s+(u+1<<3)>>3]=b;u=u+1|0}c[l>>2]=-1;h[m>>3]=0.0;c[n>>2]=0;w=1;while(1){if((w|0)>(a|0)){break}c[l+(w<<2)>>2]=w-1;h[m+(w<<3)>>3]=+h[m+(w-1<<3)>>3];c[n+(w<<2)>>2]=(c[n+(w-1<<2)>>2]|0)+1;u=w-2|0;while(1){if((u|0)<0){break}C=eb(j,u,db(w,a)|0,e,k,r,s)|0;if((C|0)!=0){D=34;break}do{if((c[n+(w<<2)>>2]|0)>((c[n+(u<<2)>>2]|0)+1|0)){D=38}else{if((c[n+(w<<2)>>2]|0)!=((c[n+(u<<2)>>2]|0)+1|0)){break}if(+h[m+(w<<3)>>3]>+h[m+(u<<3)>>3]+ +h[e>>3]){D=38}}}while(0);if((D|0)==38){D=0;c[l+(w<<2)>>2]=u;h[m+(w<<3)>>3]=+h[m+(u<<3)>>3]+ +h[e>>3];c[n+(w<<2)>>2]=(c[n+(u<<2)>>2]|0)+1;cc(o+(w<<6)|0,e|0,64)|0}u=u-1|0}if((D|0)==34){D=0}w=w+1|0}z=c[n+(a<<2)>>2]|0;C=Ta(j+64|0,z)|0;if((C|0)!=0){break}x=Yb(z<<3)|0;p=x;if((x|0)==0){break}x=Yb(z<<3)|0;q=x;if((x|0)==0){break}w=a;u=z-1|0;while(1){if((u|0)<0){break}if((c[l+(w<<2)>>2]|0)==(w-1|0)){x=db(w,a)|0;c[(c[j+68>>2]|0)+(u<<2)>>2]=c[(c[j+36>>2]|0)+(x<<2)>>2];x=(c[j+72>>2]|0)+(u*48|0)|0;v=db(w,a)|0;E=x;x=(c[j+40>>2]|0)+(v*48|0)|0;c[E>>2]=c[x>>2];c[E+4>>2]=c[x+4>>2];c[E+8>>2]=c[x+8>>2];c[E+12>>2]=c[x+12>>2];x=(c[j+72>>2]|0)+(u*48|0)+16|0;E=db(w,a)|0;v=x;x=(c[j+40>>2]|0)+(E*48|0)+16|0;c[v>>2]=c[x>>2];c[v+4>>2]=c[x+4>>2];c[v+8>>2]=c[x+8>>2];c[v+12>>2]=c[x+12>>2];x=(c[j+72>>2]|0)+(u*48|0)+32|0;v=db(w,a)|0;E=x;x=(c[j+40>>2]|0)+(v*48|0)+32|0;c[E>>2]=c[x>>2];c[E+4>>2]=c[x+4>>2];c[E+8>>2]=c[x+8>>2];c[E+12>>2]=c[x+12>>2];x=(c[j+80>>2]|0)+(u<<4)|0;E=db(w,a)|0;v=x;x=(c[j+48>>2]|0)+(E<<4)|0;c[v>>2]=c[x>>2];c[v+4>>2]=c[x+4>>2];c[v+8>>2]=c[x+8>>2];c[v+12>>2]=c[x+12>>2];x=db(w,a)|0;h[(c[j+84>>2]|0)+(u<<3)>>3]=+h[(c[j+52>>2]|0)+(x<<3)>>3];x=db(w,a)|0;h[(c[j+88>>2]|0)+(u<<3)>>3]=+h[(c[j+56>>2]|0)+(x<<3)>>3];x=db(w,a)|0;h[(c[j+92>>2]|0)+(u<<3)>>3]=+h[(c[j+60>>2]|0)+(x<<3)>>3];h[q+(u<<3)>>3]=1.0;h[p+(u<<3)>>3]=1.0}else{c[(c[j+68>>2]|0)+(u<<2)>>2]=1;x=(c[j+72>>2]|0)+(u*48|0)|0;v=o+(w<<6)+8|0;c[x>>2]=c[v>>2];c[x+4>>2]=c[v+4>>2];c[x+8>>2]=c[v+8>>2];c[x+12>>2]=c[v+12>>2];v=(c[j+72>>2]|0)+(u*48|0)+16|0;x=o+(w<<6)+24|0;c[v>>2]=c[x>>2];c[v+4>>2]=c[x+4>>2];c[v+8>>2]=c[x+8>>2];c[v+12>>2]=c[x+12>>2];x=(c[j+72>>2]|0)+(u*48|0)+32|0;v=db(w,a)|0;E=x;x=(c[j+40>>2]|0)+(v*48|0)+32|0;c[E>>2]=c[x>>2];c[E+4>>2]=c[x+4>>2];c[E+8>>2]=c[x+8>>2];c[E+12>>2]=c[x+12>>2];x=(c[j+80>>2]|0)+(u<<4)|0;b=+h[o+(w<<6)+48>>3];E=db(w,a)|0;v=(c[j+40>>2]|0)+(E*48|0)+32|0;E=db(w,a)|0;fb(g,b,v,(c[j+48>>2]|0)+(E<<4)|0);E=x;x=g;c[E>>2]=c[x>>2];c[E+4>>2]=c[x+4>>2];c[E+8>>2]=c[x+8>>2];c[E+12>>2]=c[x+12>>2];h[(c[j+84>>2]|0)+(u<<3)>>3]=+h[o+(w<<6)+56>>3];h[(c[j+88>>2]|0)+(u<<3)>>3]=+h[o+(w<<6)+56>>3];h[p+(u<<3)>>3]=+h[o+(w<<6)+48>>3];h[q+(u<<3)>>3]=+h[o+(w<<6)+40>>3]}w=c[l+(w<<2)>>2]|0;u=u-1|0}u=0;while(1){if((u|0)>=(z|0)){break}A=db(u+1|0,z)|0;h[(c[j+92>>2]|0)+(u<<3)>>3]=+h[p+(u<<3)>>3]/(+h[p+(u<<3)>>3]+ +h[q+(A<<3)>>3]);u=u+1|0}c[j+76>>2]=1;Zb(l);Zb(m);Zb(n);Zb(o);Zb(p);Zb(q);Zb(r);Zb(s);F=0;G=F;i=d;return G|0}}while(0);Zb(l);Zb(m);Zb(n);Zb(o);Zb(p);Zb(q);Zb(r);Zb(s);F=1;G=F;i=d;return G|0}function bb(a,b){a=+a;b=b|0;var d=0,e=0.0,f=0,g=0;d=i;e=a;f=b;if((f|0)==0){i=d;return}if((c[f>>2]|0)==0){i=d;return}a=+h[f+8>>3]*(1.0-e)+ +h[f+16>>3]*e;if(e==1.0){g=5}else{if(a>=+h[f+40>>3]+ +h[f+24>>3]){g=5}}if((g|0)==5){wa[c[f>>2]&1](+h[f+8>>3]*(1.0-e)+ +h[f+16>>3]*e,c[f+4>>2]|0);h[f+40>>3]=a}i=d;return}function cb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;f=a;a=i;i=i+16|0;c[a>>2]=c[f>>2];c[a+4>>2]=c[f+4>>2];c[a+8>>2]=c[f+8>>2];c[a+12>>2]=c[f+12>>2];f=b;b=i;i=i+16|0;c[b>>2]=c[f>>2];c[b+4>>2]=c[f+4>>2];c[b+8>>2]=c[f+8>>2];c[b+12>>2]=c[f+12>>2];f=d;d=i;i=i+16|0;c[d>>2]=c[f>>2];c[d+4>>2]=c[f+4>>2];c[d+8>>2]=c[f+8>>2];c[d+12>>2]=c[f+12>>2];i=e;return+((+h[b>>3]- +h[a>>3])*(+h[d+8>>3]- +h[a+8>>3])-(+h[d>>3]- +h[a>>3])*(+h[b+8>>3]- +h[a+8>>3]))}function db(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=i;d=a;a=b;if((d|0)>=(a|0)){e=(d|0)%(a|0)|0;i=c;return e|0}if((d|0)>=0){f=d}else{f=a-1-((-1-d|0)%(a|0)|0)|0}e=f;i=c;return e|0}function eb(a,b,d,e,f,g,j){a=a|0;b=b|0;d=d|0;e=e|0;f=+f;g=g|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0;k=i;i=i+144|0;l=k|0;m=k+16|0;n=k+32|0;o=k+48|0;p=k+64|0;q=k+80|0;r=k+96|0;s=k+112|0;t=k+128|0;u=a;a=b;b=d;d=e;v=f;e=g;g=j;j=c[u+32>>2]|0;if((a|0)==(b|0)){w=1;x=w;i=k;return x|0}y=a;z=db(a+1|0,j)|0;A=db(y+1|0,j)|0;B=c[e+(A<<2)>>2]|0;if((B|0)==0){w=1;x=w;i=k;return x|0}f=+gb((c[u+48>>2]|0)+(a<<4)|0,(c[u+48>>2]|0)+(z<<4)|0);y=A;while(1){if((y|0)==(b|0)){C=18;break}A=db(y+1|0,j)|0;D=db(y+2|0,j)|0;if((c[e+(A<<2)>>2]|0)!=(B|0)){C=8;break}if(+hb((c[u+48>>2]|0)+(a<<4)|0,(c[u+48>>2]|0)+(z<<4)|0,(c[u+48>>2]|0)+(A<<4)|0,(c[u+48>>2]|0)+(D<<4)|0)>0.0){E=1}else{F=+hb((c[u+48>>2]|0)+(a<<4)|0,(c[u+48>>2]|0)+(z<<4)|0,(c[u+48>>2]|0)+(A<<4)|0,(c[u+48>>2]|0)+(D<<4)|0)<0.0;E=F?-1:0}if((E|0)!=(B|0)){C=13;break}G=+ib((c[u+48>>2]|0)+(a<<4)|0,(c[u+48>>2]|0)+(z<<4)|0,(c[u+48>>2]|0)+(A<<4)|0,(c[u+48>>2]|0)+(D<<4)|0);if(G<f*+gb((c[u+48>>2]|0)+(A<<4)|0,(c[u+48>>2]|0)+(D<<4)|0)*-.999847695156){C=15;break}y=A}if((C|0)==8){w=1;x=w;i=k;return x|0}else if((C|0)==13){w=1;x=w;i=k;return x|0}else if((C|0)==15){w=1;x=w;i=k;return x|0}else if((C|0)==18){z=db(a,j)|0;B=l;E=(c[u+40>>2]|0)+(z*48|0)+32|0;c[B>>2]=c[E>>2];c[B+4>>2]=c[E+4>>2];c[B+8>>2]=c[E+8>>2];c[B+12>>2]=c[E+12>>2];E=db(a+1|0,j)|0;B=m;z=(c[u+48>>2]|0)+(E<<4)|0;c[B>>2]=c[z>>2];c[B+4>>2]=c[z+4>>2];c[B+8>>2]=c[z+8>>2];c[B+12>>2]=c[z+12>>2];z=db(b,j)|0;B=n;E=(c[u+48>>2]|0)+(z<<4)|0;c[B>>2]=c[E>>2];c[B+4>>2]=c[E+4>>2];c[B+8>>2]=c[E+8>>2];c[B+12>>2]=c[E+12>>2];E=db(b,j)|0;B=o;z=(c[u+40>>2]|0)+(E*48|0)+32|0;c[B>>2]=c[z>>2];c[B+4>>2]=c[z+4>>2];c[B+8>>2]=c[z+8>>2];c[B+12>>2]=c[z+12>>2];G=+h[g+(b<<3)>>3]- +h[g+(a<<3)>>3];G=G- +cb(c[u+48>>2]|0,(c[u+40>>2]|0)+(a*48|0)+32|0,(c[u+40>>2]|0)+(b*48|0)+32|0)/2.0;if((a|0)>=(b|0)){G=G+ +h[g+(j<<3)>>3]}H=+cb(l,m,n);I=+cb(l,m,o);J=+cb(l,n,o);if(I==H){w=1;x=w;i=k;return x|0}K=J/(J-(H+J-I));J=I/(I-H);H=I*K/2.0;if(H==0.0){w=1;x=w;i=k;return x|0}I=2.0- +N(4.0-G/H/.3);fb(q,K*I,l,m);g=d+8|0;z=q;c[g>>2]=c[z>>2];c[g+4>>2]=c[z+4>>2];c[g+8>>2]=c[z+8>>2];c[g+12>>2]=c[z+12>>2];fb(r,J*I,o,n);z=d+24|0;g=r;c[z>>2]=c[g>>2];c[z+4>>2]=c[g+4>>2];c[z+8>>2]=c[g+8>>2];c[z+12>>2]=c[g+12>>2];h[d+56>>3]=I;h[d+40>>3]=K;h[d+48>>3]=J;g=m;z=d+8|0;c[g>>2]=c[z>>2];c[g+4>>2]=c[z+4>>2];c[g+8>>2]=c[z+8>>2];c[g+12>>2]=c[z+12>>2];z=n;g=d+24|0;c[z>>2]=c[g>>2];c[z+4>>2]=c[g+4>>2];c[z+8>>2]=c[g+8>>2];c[z+12>>2]=c[g+12>>2];h[d>>3]=0.0;y=db(a+1|0,j)|0;while(1){if((y|0)==(b|0)){C=37;break}A=db(y+1|0,j)|0;K=+jb(l,m,n,o,(c[u+48>>2]|0)+(y<<4)|0,(c[u+48>>2]|0)+(A<<4)|0);if(K<-.5){C=27;break}kb(s,K,l,m,n,o);g=p;z=s;c[g>>2]=c[z>>2];c[g+4>>2]=c[z+4>>2];c[g+8>>2]=c[z+8>>2];c[g+12>>2]=c[z+12>>2];f=+gb((c[u+48>>2]|0)+(y<<4)|0,(c[u+48>>2]|0)+(A<<4)|0);if(f==0.0){C=29;break}L=+cb((c[u+48>>2]|0)+(y<<4)|0,(c[u+48>>2]|0)+(A<<4)|0,p)/f;if(+M(+L)>v){C=31;break}if(+lb((c[u+48>>2]|0)+(y<<4)|0,(c[u+48>>2]|0)+(A<<4)|0,p)<0.0){C=34;break}if(+lb((c[u+48>>2]|0)+(A<<4)|0,(c[u+48>>2]|0)+(y<<4)|0,p)<0.0){C=34;break}z=d|0;h[z>>3]=+h[z>>3]+L*L;y=A}if((C|0)==27){w=1;x=w;i=k;return x|0}else if((C|0)==29){w=1;x=w;i=k;return x|0}else if((C|0)==31){w=1;x=w;i=k;return x|0}else if((C|0)==34){w=1;x=w;i=k;return x|0}else if((C|0)==37){y=a;while(1){if((y|0)==(b|0)){C=51;break}A=db(y+1|0,j)|0;K=+jb(l,m,n,o,(c[u+40>>2]|0)+(y*48|0)+32|0,(c[u+40>>2]|0)+(A*48|0)+32|0);if(K<-.5){C=40;break}kb(t,K,l,m,n,o);a=p;s=t;c[a>>2]=c[s>>2];c[a+4>>2]=c[s+4>>2];c[a+8>>2]=c[s+8>>2];c[a+12>>2]=c[s+12>>2];f=+gb((c[u+40>>2]|0)+(y*48|0)+32|0,(c[u+40>>2]|0)+(A*48|0)+32|0);if(f==0.0){C=42;break}L=+cb((c[u+40>>2]|0)+(y*48|0)+32|0,(c[u+40>>2]|0)+(A*48|0)+32|0,p)/f;J=+cb((c[u+40>>2]|0)+(y*48|0)+32|0,(c[u+40>>2]|0)+(A*48|0)+32|0,(c[u+48>>2]|0)+(A<<4)|0)/f;J=J*+h[(c[u+52>>2]|0)+(A<<3)>>3]*.75;if(J<0.0){L=-0.0-L;J=-0.0-J}if(L<J-v){C=46;break}if(L<J){s=d|0;h[s>>3]=+h[s>>3]+(L-J)*(L-J)}y=A}if((C|0)==40){w=1;x=w;i=k;return x|0}else if((C|0)==42){w=1;x=w;i=k;return x|0}else if((C|0)==46){w=1;x=w;i=k;return x|0}else if((C|0)==51){w=0;x=w;i=k;return x|0}}}return 0}function fb(a,b,d,e){a=a|0;b=+b;d=d|0;e=e|0;var f=0,g=0,j=0.0;f=i;i=i+16|0;g=d;d=i;i=i+16|0;c[d>>2]=c[g>>2];c[d+4>>2]=c[g+4>>2];c[d+8>>2]=c[g+8>>2];c[d+12>>2]=c[g+12>>2];g=e;e=i;i=i+16|0;c[e>>2]=c[g>>2];c[e+4>>2]=c[g+4>>2];c[e+8>>2]=c[g+8>>2];c[e+12>>2]=c[g+12>>2];g=f|0;j=b;h[g>>3]=+h[d>>3]+j*(+h[e>>3]- +h[d>>3]);h[g+8>>3]=+h[d+8>>3]+j*(+h[e+8>>3]- +h[d+8>>3]);d=a;a=g;c[d>>2]=c[a>>2];c[d+4>>2]=c[a+4>>2];c[d+8>>2]=c[a+8>>2];c[d+12>>2]=c[a+12>>2];i=f;return}function gb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0.0;d=i;e=a;a=i;i=i+16|0;c[a>>2]=c[e>>2];c[a+4>>2]=c[e+4>>2];c[a+8>>2]=c[e+8>>2];c[a+12>>2]=c[e+12>>2];e=b;b=i;i=i+16|0;c[b>>2]=c[e>>2];c[b+4>>2]=c[e+4>>2];c[b+8>>2]=c[e+8>>2];c[b+12>>2]=c[e+12>>2];f=+N((+h[a>>3]- +h[b>>3])*(+h[a>>3]- +h[b>>3])+(+h[a+8>>3]- +h[b+8>>3])*(+h[a+8>>3]- +h[b+8>>3]));i=d;return+f}function hb(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;g=a;a=i;i=i+16|0;c[a>>2]=c[g>>2];c[a+4>>2]=c[g+4>>2];c[a+8>>2]=c[g+8>>2];c[a+12>>2]=c[g+12>>2];g=b;b=i;i=i+16|0;c[b>>2]=c[g>>2];c[b+4>>2]=c[g+4>>2];c[b+8>>2]=c[g+8>>2];c[b+12>>2]=c[g+12>>2];g=d;d=i;i=i+16|0;c[d>>2]=c[g>>2];c[d+4>>2]=c[g+4>>2];c[d+8>>2]=c[g+8>>2];c[d+12>>2]=c[g+12>>2];g=e;e=i;i=i+16|0;c[e>>2]=c[g>>2];c[e+4>>2]=c[g+4>>2];c[e+8>>2]=c[g+8>>2];c[e+12>>2]=c[g+12>>2];i=f;return+((+h[b>>3]- +h[a>>3])*(+h[e+8>>3]- +h[d+8>>3])-(+h[e>>3]- +h[d>>3])*(+h[b+8>>3]- +h[a+8>>3]))}function ib(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;g=a;a=i;i=i+16|0;c[a>>2]=c[g>>2];c[a+4>>2]=c[g+4>>2];c[a+8>>2]=c[g+8>>2];c[a+12>>2]=c[g+12>>2];g=b;b=i;i=i+16|0;c[b>>2]=c[g>>2];c[b+4>>2]=c[g+4>>2];c[b+8>>2]=c[g+8>>2];c[b+12>>2]=c[g+12>>2];g=d;d=i;i=i+16|0;c[d>>2]=c[g>>2];c[d+4>>2]=c[g+4>>2];c[d+8>>2]=c[g+8>>2];c[d+12>>2]=c[g+12>>2];g=e;e=i;i=i+16|0;c[e>>2]=c[g>>2];c[e+4>>2]=c[g+4>>2];c[e+8>>2]=c[g+8>>2];c[e+12>>2]=c[g+12>>2];i=f;return+((+h[b>>3]- +h[a>>3])*(+h[e>>3]- +h[d>>3])+(+h[b+8>>3]- +h[a+8>>3])*(+h[e+8>>3]- +h[d+8>>3]))}function jb(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0;h=i;j=a;a=i;i=i+16|0;c[a>>2]=c[j>>2];c[a+4>>2]=c[j+4>>2];c[a+8>>2]=c[j+8>>2];c[a+12>>2]=c[j+12>>2];j=b;b=i;i=i+16|0;c[b>>2]=c[j>>2];c[b+4>>2]=c[j+4>>2];c[b+8>>2]=c[j+8>>2];c[b+12>>2]=c[j+12>>2];j=d;d=i;i=i+16|0;c[d>>2]=c[j>>2];c[d+4>>2]=c[j+4>>2];c[d+8>>2]=c[j+8>>2];c[d+12>>2]=c[j+12>>2];j=e;e=i;i=i+16|0;c[e>>2]=c[j>>2];c[e+4>>2]=c[j+4>>2];c[e+8>>2]=c[j+8>>2];c[e+12>>2]=c[j+12>>2];j=f;f=i;i=i+16|0;c[f>>2]=c[j>>2];c[f+4>>2]=c[j+4>>2];c[f+8>>2]=c[j+8>>2];c[f+12>>2]=c[j+12>>2];j=g;g=i;i=i+16|0;c[g>>2]=c[j>>2];c[g+4>>2]=c[j+4>>2];c[g+8>>2]=c[j+8>>2];c[g+12>>2]=c[j+12>>2];k=+hb(a,b,f,g);l=+hb(b,d,f,g);m=k-2.0*l+ +hb(d,e,f,g);n=-2.0*k+2.0*l;l=n*n-4.0*m*k;do{if(!(m==0.0)){if(l<0.0){break}k=+N(l);o=(-0.0-n+k)/(2.0*m);p=(-0.0-n-k)/(2.0*m);do{if(o>=0.0){if(!(o<=1.0)){break}q=o;r=q;i=h;return+r}}while(0);do{if(p>=0.0){if(!(p<=1.0)){break}q=p;r=q;i=h;return+r}}while(0);q=-1.0;r=q;i=h;return+r}}while(0);q=-1.0;r=q;i=h;return+r}function kb(a,b,d,e,f,g){a=a|0;b=+b;d=d|0;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0;j=i;i=i+16|0;k=d;d=i;i=i+16|0;c[d>>2]=c[k>>2];c[d+4>>2]=c[k+4>>2];c[d+8>>2]=c[k+8>>2];c[d+12>>2]=c[k+12>>2];k=e;e=i;i=i+16|0;c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];c[e+8>>2]=c[k+8>>2];c[e+12>>2]=c[k+12>>2];k=f;f=i;i=i+16|0;c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];c[f+8>>2]=c[k+8>>2];c[f+12>>2]=c[k+12>>2];k=g;g=i;i=i+16|0;c[g>>2]=c[k>>2];c[g+4>>2]=c[k+4>>2];c[g+8>>2]=c[k+8>>2];c[g+12>>2]=c[k+12>>2];k=j|0;l=b;b=1.0-l;h[k>>3]=b*b*b*+h[d>>3]+b*b*l*3.0*+h[e>>3]+l*l*b*3.0*+h[f>>3]+l*l*l*+h[g>>3];h[k+8>>3]=b*b*b*+h[d+8>>3]+b*b*l*3.0*+h[e+8>>3]+l*l*b*3.0*+h[f+8>>3]+l*l*l*+h[g+8>>3];g=a;a=k;c[g>>2]=c[a>>2];c[g+4>>2]=c[a+4>>2];c[g+8>>2]=c[a+8>>2];c[g+12>>2]=c[a+12>>2];i=j;return}function lb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;f=a;a=i;i=i+16|0;c[a>>2]=c[f>>2];c[a+4>>2]=c[f+4>>2];c[a+8>>2]=c[f+8>>2];c[a+12>>2]=c[f+12>>2];f=b;b=i;i=i+16|0;c[b>>2]=c[f>>2];c[b+4>>2]=c[f+4>>2];c[b+8>>2]=c[f+8>>2];c[b+12>>2]=c[f+12>>2];f=d;d=i;i=i+16|0;c[d>>2]=c[f>>2];c[d+4>>2]=c[f+4>>2];c[d+8>>2]=c[f+8>>2];c[d+12>>2]=c[f+12>>2];i=e;return+((+h[b>>3]- +h[a>>3])*(+h[d>>3]- +h[a>>3])+(+h[b+8>>3]- +h[a+8>>3])*(+h[d+8>>3]- +h[a+8>>3]))}function mb(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;i=i+8|0;e=a;a=i;i=i+16|0;c[a>>2]=c[e>>2];c[a+4>>2]=c[e+4>>2];c[a+8>>2]=c[e+8>>2];c[a+12>>2]=c[e+12>>2];e=b;b=i;i=i+16|0;c[b>>2]=c[e>>2];c[b+4>>2]=c[e+4>>2];c[b+8>>2]=c[e+8>>2];c[b+12>>2]=c[e+12>>2];e=d|0;nb(e,a,b);i=d;return+(+(c[e+4>>2]|0)*(+h[b>>3]- +h[a>>3])- +(c[e>>2]|0)*(+h[b+8>>3]- +h[a+8>>3]))}function nb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,j=0;e=i;i=i+8|0;f=b;b=i;i=i+16|0;c[b>>2]=c[f>>2];c[b+4>>2]=c[f+4>>2];c[b+8>>2]=c[f+8>>2];c[b+12>>2]=c[f+12>>2];f=d;d=i;i=i+16|0;c[d>>2]=c[f>>2];c[d+4>>2]=c[f+4>>2];c[d+8>>2]=c[f+8>>2];c[d+12>>2]=c[f+12>>2];f=e|0;if(+h[d>>3]- +h[b>>3]>0.0){g=1}else{g=+h[d>>3]- +h[b>>3]<0.0?-1:0}c[f+4>>2]=g;if(+h[d+8>>3]- +h[b+8>>3]>0.0){j=1}else{j=+h[d+8>>3]- +h[b+8>>3]<0.0?-1:0}c[f>>2]=-j;j=a;a=f;c[j>>2]=c[a>>2];c[j+4>>2]=c[a+4>>2];i=e;return}function ob(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0;g=i;j=a;a=b;b=d;d=e;e=f;f=c[j>>2]|0;k=c[j+20>>2]|0;j=0;while(1){if((b|0)<(f|0)){break}b=b-f|0;j=j+1|0}while(1){if((a|0)<(f|0)){break}a=a-f|0;j=j-1|0}while(1){if((b|0)>=0){break}b=b+f|0;j=j-1|0}while(1){if((a|0)>=0){break}a=a+f|0;j=j+1|0}l=+h[k+((b+1|0)*40|0)>>3]- +h[k+(a*40|0)>>3]+ +(j|0)*+h[k+(f*40|0)>>3];m=+h[k+((b+1|0)*40|0)+8>>3]- +h[k+(a*40|0)+8>>3]+ +(j|0)*+h[k+(f*40|0)+8>>3];n=+h[k+((b+1|0)*40|0)+16>>3]- +h[k+(a*40|0)+16>>3]+ +(j|0)*+h[k+(f*40|0)+16>>3];o=+h[k+((b+1|0)*40|0)+24>>3]- +h[k+(a*40|0)+24>>3]+ +(j|0)*+h[k+(f*40|0)+24>>3];p=+h[k+((b+1|0)*40|0)+32>>3]- +h[k+(a*40|0)+32>>3]+ +(j|0)*+h[k+(f*40|0)+32>>3];q=+(b+1-a+(Z(j,f)|0)|0);h[d>>3]=l/q;h[d+8>>3]=m/q;r=(n-l*l/q)/q;n=(o-l*m/q)/q;l=(p-m*m/q)/q;q=(r+l+ +N((r-l)*(r-l)+4.0*n*n))/2.0;r=r-q;l=l-q;if(+M(+r)>=+M(+l)){s=+N(r*r+n*n);if(s!=0.0){h[e>>3]=(-0.0-n)/s;h[e+8>>3]=r/s}}else{s=+N(l*l+n*n);if(s!=0.0){h[e>>3]=(-0.0-l)/s;h[e+8>>3]=n/s}}if(!(s==0.0)){i=g;return}h[e+8>>3]=0.0;h[e>>3]=0.0;i=g;return}function pb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0.0;d=i;i=i+24|0;e=b;b=i;i=i+16|0;c[b>>2]=c[e>>2];c[b+4>>2]=c[e+4>>2];c[b+8>>2]=c[e+8>>2];c[b+12>>2]=c[e+12>>2];e=d|0;f=a;h[e>>3]=+h[b>>3];h[e+8>>3]=+h[b+8>>3];h[e+16>>3]=1.0;g=0.0;b=0;while(1){if((b|0)>=3){break}a=0;while(1){if((a|0)>=3){break}g=g+ +h[e+(b<<3)>>3]*+h[f+(b*24|0)+(a<<3)>>3]*+h[e+(a<<3)>>3];a=a+1|0}b=b+1|0}i=d;return+g}function qb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0;e=a;a=b;b=d;d=c[e>>2]|0;f=c[e+4>>2]|0;g=c[e+20>>2]|0;e=0;if((b|0)>=(d|0)){b=b-d|0;e=1}if((e|0)==0){j=+h[g+((b+1|0)*40|0)>>3]- +h[g+(a*40|0)>>3];k=+h[g+((b+1|0)*40|0)+8>>3]- +h[g+(a*40|0)+8>>3];l=+h[g+((b+1|0)*40|0)+16>>3]- +h[g+(a*40|0)+16>>3];m=+h[g+((b+1|0)*40|0)+24>>3]- +h[g+(a*40|0)+24>>3];n=+h[g+((b+1|0)*40|0)+32>>3]- +h[g+(a*40|0)+32>>3];o=+(b+1-a|0)}else{j=+h[g+((b+1|0)*40|0)>>3]- +h[g+(a*40|0)>>3]+ +h[g+(d*40|0)>>3];k=+h[g+((b+1|0)*40|0)+8>>3]- +h[g+(a*40|0)+8>>3]+ +h[g+(d*40|0)+8>>3];l=+h[g+((b+1|0)*40|0)+16>>3]- +h[g+(a*40|0)+16>>3]+ +h[g+(d*40|0)+16>>3];m=+h[g+((b+1|0)*40|0)+24>>3]- +h[g+(a*40|0)+24>>3]+ +h[g+(d*40|0)+24>>3];n=+h[g+((b+1|0)*40|0)+32>>3]- +h[g+(a*40|0)+32>>3]+ +h[g+(d*40|0)+32>>3];o=+(b+1-a+d|0)}p=+((c[f+(a<<3)>>2]|0)+(c[f+(b<<3)>>2]|0)|0)/2.0- +(c[f>>2]|0);q=+((c[f+(a<<3)+4>>2]|0)+(c[f+(b<<3)+4>>2]|0)|0)/2.0- +(c[f+4>>2]|0);r=+((c[f+(b<<3)>>2]|0)-(c[f+(a<<3)>>2]|0)|0);s=+(-((c[f+(b<<3)+4>>2]|0)-(c[f+(a<<3)+4>>2]|0)|0)|0);t=+N(s*s*((l-2.0*j*p)/o+p*p)+2.0*s*r*((m-j*q-k*p)/o+p*q)+r*r*((n-2.0*k*q)/o+q*q));i=i;return+t}function rb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=a;a=i;i=i+8|0;c[a>>2]=c[e>>2];c[a+4>>2]=c[e+4>>2];e=b;b=i;i=i+8|0;c[b>>2]=c[e>>2];c[b+4>>2]=c[e+4>>2];e=Z(c[a>>2]|0,c[b+4>>2]|0)|0;f=e-(Z(c[a+4>>2]|0,c[b>>2]|0)|0)|0;i=d;return f|0}function sb(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;e=a;a=b;b=c;if((e|0)<=(b|0)){if((e|0)<=(a|0)){f=(a|0)<(b|0)}else{f=0}g=f&1;h=g;i=d;return h|0}else{if((e|0)<=(a|0)){j=1}else{j=(a|0)<(b|0)}g=j&1;h=g;i=d;return h|0}return 0}function tb(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;c=i;d=a;a=b;if((d|0)>=0){e=(d|0)/(a|0)|0;i=c;return e|0}else{e=-1-((-1-d|0)/(a|0)|0)|0;i=c;return e|0}return 0}function ub(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=i;i=i+24|0;g=f|0;h=f+8|0;j=f+16|0;k=a;a=b;b=d;d=e;c[j>>2]=0;e=j;l=0;l=vb(k)|0;do{if((l|0)!=0){wb(l);c[g>>2]=0;c[h>>2]=(c[l+4>>2]|0)-1;while(1){if((xb(l,g,h)|0)!=0){break}do{if((c[g>>2]|0)>=0){if((c[g>>2]|0)>=(c[k>>2]|0)){m=10;break}if((c[h>>2]|0)<0){m=10;break}if((c[h>>2]|0)>=(c[k+4>>2]|0)){m=10;break}n=c[(c[k+12>>2]|0)+((Z(c[h>>2]|0,c[k+8>>2]|0)|0)<<2)+(((c[g>>2]|0)/32|0)<<2)>>2]|0;o=(n&-2147483648>>>((c[g>>2]&31)>>>0)|0)!=0|0}else{m=10}}while(0);if((m|0)==10){m=0;o=0}p=yb(l,c[g>>2]|0,(c[h>>2]|0)+1|0,(o|0)!=0?43:45,c[b+4>>2]|0)|0;if((p|0)==0){m=12;break}zb(l,p);if((c[p>>2]|0)<=(c[b>>2]|0)){Qa(p)}else{c[p+20>>2]=c[e>>2];c[e>>2]=p;e=p+20|0}if((c[l+4>>2]|0)>0){Ab(1.0- +(c[h>>2]|0)/+(c[l+4>>2]|0),d)}}if((m|0)==12){break}Bb(c[j>>2]|0,l);Cb(l);c[a>>2]=c[j>>2];Ab(1.0,d);q=0;r=q;i=f;return r|0}}while(0);Cb(l);p=c[j>>2]|0;while(1){if((p|0)!=0){c[j>>2]=c[p+20>>2];c[p+20>>2]=0;s=1}else{s=0}if((s|0)==0){break}Qa(p);p=c[j>>2]|0}q=-1;r=q;i=f;return r|0}function vb(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=a;a=Jb(c[d>>2]|0,c[d+4>>2]|0)|0;if((a|0)!=0){cc(c[a+12>>2]|0,c[d+12>>2]|0,(Z(c[d+8>>2]|0,c[d+4>>2]|0)|0)<<2)|0;e=a;f=e;i=b;return f|0}else{e=0;f=e;i=b;return f|0}return 0}function wb(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=a;if(((c[d>>2]|0)%32|0|0)==0){i=b;return}a=-1<<32-((c[d>>2]|0)%32|0);e=0;while(1){if((e|0)>=(c[d+4>>2]|0)){break}f=(c[d+12>>2]|0)+((Z(e,c[d+8>>2]|0)|0)<<2)+(((c[d>>2]|0)/32|0)<<2)|0;c[f>>2]=c[f>>2]&a;e=e+1|0}i=b;return}function xb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;f=a;a=b;b=d;d=c[a>>2]&-32;g=c[b>>2]|0;a:while(1){if((g|0)<0){h=20;break}j=d;while(1){if((j|0)>=(c[f>>2]|0)){break}if((c[(c[f+12>>2]|0)+((Z(g,c[f+8>>2]|0)|0)<<2)+(((j|0)/32|0)<<2)>>2]|0)!=0){break a}j=j+32|0}d=0;g=g-1|0}if((h|0)==20){k=1;l=k;i=e;return l|0}while(1){do{if((j|0)>=0){if((j|0)>=(c[f>>2]|0)){h=12;break}if((g|0)<0){h=12;break}if((g|0)>=(c[f+4>>2]|0)){h=12;break}m=(c[(c[f+12>>2]|0)+((Z(g,c[f+8>>2]|0)|0)<<2)+(((j|0)/32|0)<<2)>>2]&-2147483648>>>((j&31)>>>0)|0)!=0|0}else{h=12}}while(0);if((h|0)==12){h=0;m=0}if(!((m|0)!=0^1)){break}j=j+1|0}c[a>>2]=j;c[b>>2]=g;k=0;l=k;i=e;return l|0}function yb(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;h=a;a=b;b=d;d=e;e=f;f=0;j=a;k=b;l=0;m=-1;n=0;o=0;p=0;q=0;while(1){if((o|0)>=(n|0)){n=n+100|0;n=~~(1.3*+(n|0));r=_b(p,n<<3)|0;if((r|0)==0){s=4;break}p=r}c[p+(o<<3)>>2]=j;c[p+(o<<3)+4>>2]=k;o=o+1|0;j=j+l|0;k=k+m|0;q=q+(Z(j,m)|0)|0;if((j|0)==(a|0)){if((k|0)==(b|0)){s=8;break}}do{if((j+((l+m-1|0)/2|0)|0)>=0){if((j+((l+m-1|0)/2|0)|0)>=(c[h>>2]|0)){s=14;break}if((k+((m-l-1|0)/2|0)|0)<0){s=14;break}if((k+((m-l-1|0)/2|0)|0)>=(c[h+4>>2]|0)){s=14;break}t=(c[(c[h+12>>2]|0)+((Z(k+((m-l-1|0)/2|0)|0,c[h+8>>2]|0)|0)<<2)+(((j+((l+m-1|0)/2|0)|0)/32|0)<<2)>>2]&-2147483648>>>((j+((l+m-1|0)/2|0)&31)>>>0)|0)!=0|0}else{s=14}}while(0);if((s|0)==14){s=0;t=0}r=t;do{if((j+((l-m-1|0)/2|0)|0)>=0){if((j+((l-m-1|0)/2|0)|0)>=(c[h>>2]|0)){s=20;break}if((k+((m+l-1|0)/2|0)|0)<0){s=20;break}if((k+((m+l-1|0)/2|0)|0)>=(c[h+4>>2]|0)){s=20;break}u=(c[(c[h+12>>2]|0)+((Z(k+((m+l-1|0)/2|0)|0,c[h+8>>2]|0)|0)<<2)+(((j+((l-m-1|0)/2|0)|0)/32|0)<<2)>>2]&-2147483648>>>((j+((l-m-1|0)/2|0)&31)>>>0)|0)!=0|0}else{s=20}}while(0);if((s|0)==20){s=0;u=0}v=u;do{if((r|0)!=0){if((v|0)!=0){s=37;break}do{if((e|0)==3){s=34}else{if((e|0)==0){if((d|0)==43){s=34;break}}if((e|0)==1){if((d|0)==45){s=34;break}}if((e|0)==6){if((Hb(j,k)|0)!=0){s=34;break}}if((e|0)==5){if((Ib(h,j,k)|0)!=0){s=34;break}}if((e|0)==4){if((Ib(h,j,k)|0)==0){s=34;break}}w=l;l=-m|0;m=w}}while(0);if((s|0)==34){s=0;w=l;l=m;m=-w|0}}else{s=37}}while(0);if((s|0)==37){s=0;if((r|0)!=0){w=l;l=m;m=-w|0}else{if((v|0)==0){w=l;l=-m|0;m=w}}}}do{if((s|0)!=4)if((s|0)==8){f=Pa()|0;if((f|0)==0){break}c[(c[f+32>>2]|0)+4>>2]=p;c[c[f+32>>2]>>2]=o;c[f>>2]=q;c[f+4>>2]=d;x=f;y=x;i=g;return y|0}}while(0);Zb(p);x=0;y=x;i=g;return y|0}function zb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;e=a;a=b;if((c[c[a+32>>2]>>2]|0)<=0){i=d;return}b=c[(c[(c[a+32>>2]|0)+4>>2]|0)+((c[c[a+32>>2]>>2]|0)-1<<3)+4>>2]|0;f=c[c[(c[a+32>>2]|0)+4>>2]>>2]&-32;g=0;while(1){if((g|0)>=(c[c[a+32>>2]>>2]|0)){break}h=c[(c[(c[a+32>>2]|0)+4>>2]|0)+(g<<3)+4>>2]|0;if((h|0)!=(b|0)){if((h|0)<(b|0)){j=h}else{j=b}Gb(e,c[(c[(c[a+32>>2]|0)+4>>2]|0)+(g<<3)>>2]|0,j,f);b=h}g=g+1|0}i=d;return}function Ab(a,b){a=+a;b=b|0;var d=0,e=0.0,f=0,g=0;d=i;e=a;f=b;if((f|0)==0){i=d;return}if((c[f>>2]|0)==0){i=d;return}a=+h[f+8>>3]*(1.0-e)+ +h[f+16>>3]*e;if(e==1.0){g=5}else{if(a>=+h[f+40>>3]+ +h[f+24>>3]){g=5}}if((g|0)==5){wa[c[f>>2]&1](+h[f+8>>3]*(1.0-e)+ +h[f+16>>3]*e,c[f+4>>2]|0);h[f+40>>3]=a}i=d;return}function Bb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=i;i=i+32|0;e=d|0;f=d+8|0;g=d+16|0;c[e>>2]=a;a=b;Db(a,0);b=c[e>>2]|0;while(1){if((b|0)==0){break}c[b+28>>2]=c[b+20>>2];c[b+24>>2]=0;b=c[b+20>>2]|0}h=c[e>>2]|0;while(1){if((h|0)==0){break}j=h;h=c[h+24>>2]|0;c[j+24>>2]=0;k=j;j=c[j+20>>2]|0;c[k+20>>2]=0;zb(a,k);Eb(g,k);l=k+24|0;m=k+20|0;b=j;while(1){if((b|0)!=0){j=c[b+20>>2]|0;c[b+20>>2]=0;n=1}else{n=0}if((n|0)==0){break}if((c[(c[(c[b+32>>2]|0)+4>>2]|0)+4>>2]|0)<=(c[g+8>>2]|0)){o=13;break}do{if((c[c[(c[b+32>>2]|0)+4>>2]>>2]|0)>=0){if((c[c[(c[b+32>>2]|0)+4>>2]>>2]|0)>=(c[a>>2]|0)){o=21;break}if(((c[(c[(c[b+32>>2]|0)+4>>2]|0)+4>>2]|0)-1|0)<0){o=21;break}if(((c[(c[(c[b+32>>2]|0)+4>>2]|0)+4>>2]|0)-1|0)>=(c[a+4>>2]|0)){o=21;break}p=c[(c[a+12>>2]|0)+((Z((c[(c[(c[b+32>>2]|0)+4>>2]|0)+4>>2]|0)-1|0,c[a+8>>2]|0)|0)<<2)+(((c[c[(c[b+32>>2]|0)+4>>2]>>2]|0)/32|0)<<2)>>2]|0;if((p&-2147483648>>>((c[c[(c[b+32>>2]|0)+4>>2]>>2]&31)>>>0)|0)!=0){o=22}else{o=25}}else{o=21}}while(0);if((o|0)==21){o=0;if(0){o=22}else{o=25}}if((o|0)==22){o=0;c[b+20>>2]=c[l>>2];c[l>>2]=b;l=b+20|0}else if((o|0)==25){o=0;c[b+20>>2]=c[m>>2];c[m>>2]=b;m=b+20|0}b=j}if((o|0)==13){o=0;c[b+20>>2]=c[m>>2];c[m>>2]=b;m=b+20|0;c[m>>2]=j}Fb(a,g);if((c[k+20>>2]|0)!=0){c[(c[k+20>>2]|0)+24>>2]=h;h=c[k+20>>2]|0}if((c[k+24>>2]|0)!=0){c[(c[k+24>>2]|0)+24>>2]=h;h=c[k+24>>2]|0}}b=c[e>>2]|0;while(1){if((b|0)==0){break}q=c[b+28>>2]|0;c[b+28>>2]=c[b+20>>2];b=q}h=c[e>>2]|0;if((h|0)!=0){c[h+20>>2]=0}c[e>>2]=0;g=e;while(1){if((h|0)==0){break}c[f>>2]=c[h+20>>2];b=h;while(1){if((b|0)==0){break}c[b+20>>2]=c[g>>2];c[g>>2]=b;g=b+20|0;q=c[b+24>>2]|0;while(1){if((q|0)==0){break}c[q+20>>2]=c[g>>2];c[g>>2]=q;g=q+20|0;if((c[q+24>>2]|0)!=0){e=f;while(1){if((c[e>>2]|0)==0){break}e=(c[e>>2]|0)+20|0}c[(c[q+24>>2]|0)+20>>2]=c[e>>2];c[e>>2]=c[q+24>>2]}q=c[q+28>>2]|0}b=c[b+28>>2]|0}h=c[f>>2]|0}i=d;return}function Cb(a){a=a|0;var b=0,d=0;b=i;d=a;if((d|0)!=0){Zb(c[d+12>>2]|0)}Zb(d);i=b;return}function Db(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;bc(c[e+12>>2]|0,((b|0)!=0?-1:0)&255|0,(Z(c[e+8>>2]|0,c[e+4>>2]|0)|0)<<2|0)|0;i=d;return}function Eb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;e=a;a=b;c[e+8>>2]=2147483647;c[e+12>>2]=0;c[e>>2]=2147483647;c[e+4>>2]=0;b=0;while(1){if((b|0)>=(c[c[a+32>>2]>>2]|0)){break}f=c[(c[(c[a+32>>2]|0)+4>>2]|0)+(b<<3)>>2]|0;g=c[(c[(c[a+32>>2]|0)+4>>2]|0)+(b<<3)+4>>2]|0;if((f|0)<(c[e>>2]|0)){c[e>>2]=f}if((f|0)>(c[e+4>>2]|0)){c[e+4>>2]=f}if((g|0)<(c[e+8>>2]|0)){c[e+8>>2]=g}if((g|0)>(c[e+12>>2]|0)){c[e+12>>2]=g}b=b+1|0}i=d;return}function Fb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;e=a;a=b;b=(c[a>>2]|0)/32|0;f=((c[a+4>>2]|0)+32-1|0)/32|0;g=c[a+8>>2]|0;while(1){if((g|0)>=(c[a+12>>2]|0)){break}h=b;while(1){if((h|0)>=(f|0)){break}c[(c[e+12>>2]|0)+((Z(g,c[e+8>>2]|0)|0)<<2)+(h<<2)>>2]=0;h=h+1|0}g=g+1|0}i=d;return}function Gb(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;g=a;a=b;b=d;d=e;e=a&-32;h=a&31;if((e|0)<(d|0)){j=e;while(1){if((j|0)>=(d|0)){break}a=(c[g+12>>2]|0)+((Z(b,c[g+8>>2]|0)|0)<<2)+(((j|0)/32|0)<<2)|0;c[a>>2]=~c[a>>2];j=j+32|0}}else{j=d;while(1){if((j|0)>=(e|0)){break}d=(c[g+12>>2]|0)+((Z(b,c[g+8>>2]|0)|0)<<2)+(((j|0)/32|0)<<2)|0;c[d>>2]=~c[d>>2];j=j+32|0}}if((h|0)==0){i=f;return}j=(c[g+12>>2]|0)+((Z(b,c[g+8>>2]|0)|0)<<2)+(((e|0)/32|0)<<2)|0;c[j>>2]=c[j>>2]^-1<<32-h;i=f;return}function Hb(a,b){a=a|0;b=b|0;var c=0;c=Z((Z(a,78898037)|0)^b,94957459)|0;c=(d[72+(c&255)|0]|0)^(d[72+(c>>>8&255)|0]|0)^(d[72+(c>>>16&255)|0]|0)^(d[72+(c>>>24&255)|0]|0);i=i;return c|0}function Ib(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;f=a;a=b;b=d;d=2;while(1){if((d|0)>=5){g=38;break}h=0;j=(-d|0)+1|0;while(1){if((j|0)>(d-1|0)){break}do{if((a+j|0)>=0){if((a+j|0)>=(c[f>>2]|0)){g=10;break}if((b+d-1|0)<0){g=10;break}if((b+d-1|0)>=(c[f+4>>2]|0)){g=10;break}k=(c[(c[f+12>>2]|0)+((Z(b+d-1|0,c[f+8>>2]|0)|0)<<2)+(((a+j|0)/32|0)<<2)>>2]&-2147483648>>>((a+j&31)>>>0)|0)!=0|0}else{g=10}}while(0);if((g|0)==10){g=0;k=0}h=h+((k|0)!=0?1:-1)|0;do{if((a+d-1|0)>=0){if((a+d-1|0)>=(c[f>>2]|0)){g=16;break}if((b+j-1|0)<0){g=16;break}if((b+j-1|0)>=(c[f+4>>2]|0)){g=16;break}l=(c[(c[f+12>>2]|0)+((Z(b+j-1|0,c[f+8>>2]|0)|0)<<2)+(((a+d-1|0)/32|0)<<2)>>2]&-2147483648>>>((a+d-1&31)>>>0)|0)!=0|0}else{g=16}}while(0);if((g|0)==16){g=0;l=0}h=h+((l|0)!=0?1:-1)|0;do{if((a+j-1|0)>=0){if((a+j-1|0)>=(c[f>>2]|0)){g=22;break}if((b-d|0)<0){g=22;break}if((b-d|0)>=(c[f+4>>2]|0)){g=22;break}m=(c[(c[f+12>>2]|0)+((Z(b-d|0,c[f+8>>2]|0)|0)<<2)+(((a+j-1|0)/32|0)<<2)>>2]&-2147483648>>>((a+j-1&31)>>>0)|0)!=0|0}else{g=22}}while(0);if((g|0)==22){g=0;m=0}h=h+((m|0)!=0?1:-1)|0;do{if((a-d|0)>=0){if((a-d|0)>=(c[f>>2]|0)){g=28;break}if((b+j|0)<0){g=28;break}if((b+j|0)>=(c[f+4>>2]|0)){g=28;break}n=(c[(c[f+12>>2]|0)+((Z(b+j|0,c[f+8>>2]|0)|0)<<2)+(((a-d|0)/32|0)<<2)>>2]&-2147483648>>>((a-d&31)>>>0)|0)!=0|0}else{g=28}}while(0);if((g|0)==28){g=0;n=0}h=h+((n|0)!=0?1:-1)|0;j=j+1|0}if((h|0)>0){g=32;break}if((h|0)<0){g=34;break}d=d+1|0}if((g|0)==32){o=1;p=o;i=e;return p|0}else if((g|0)==34){o=0;p=o;i=e;return p|0}else if((g|0)==38){o=0;p=o;i=e;return p|0}return 0}function Jb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;e=a;a=b;b=(e+32-1|0)/32|0;f=Yb(16)|0;if((f|0)==0){g=0;h=g;i=d;return h|0}c[f>>2]=e;c[f+4>>2]=a;c[f+8>>2]=b;c[f+12>>2]=Yb((Z(b,a)|0)<<2)|0;if((c[f+12>>2]|0)!=0){g=f;h=g;i=d;return h|0}else{Zb(f);g=0;h=g;i=d;return h|0}return 0}function Kb(){var a=0,b=0,c=0;a=i;b=Yb(64)|0;if((b|0)!=0){cc(b|0,8,64)|0;c=b}else{c=0}i=a;return c|0}function Lb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0;d=i;i=i+104|0;e=d|0;f=d+8|0;g=d+56|0;j=a;c[e>>2]=0;c[f>>2]=c[j+32>>2];c[f+4>>2]=c[j+36>>2];h[f+8>>3]=+h[j+40>>3];h[f+16>>3]=+h[j+48>>3];h[f+24>>3]=+h[j+56>>3];h[f+40>>3]=+h[j+40>>3];a=Yb(12)|0;if((a|0)==0){k=0;l=k;i=d;return l|0}Mb(0.0,.1,f,g);m=ub(b,e,j,g)|0;if((m|0)!=0){Zb(a);k=0;l=k;i=d;return l|0}c[a>>2]=0;c[a+4>>2]=c[e>>2];c[a+8>>2]=0;Nb(f,g);Mb(.1,1.0,f,g);m=Va(c[e>>2]|0,j,g)|0;if((m|0)!=0){c[a>>2]=1}Nb(f,g);k=a;l=k;i=d;return l|0}function Mb(a,b,d,e){a=+a;b=+b;d=d|0;e=e|0;var f=0,g=0.0,j=0,k=0.0;f=i;g=a;a=b;j=d;d=e;do{if((j|0)!=0){if((c[j>>2]|0)==0){break}b=+h[j+8>>3]*(1.0-g)+ +h[j+16>>3]*g;k=+h[j+8>>3]*(1.0-a)+ +h[j+16>>3]*a;if(k-b<+h[j+24>>3]){c[d>>2]=0;h[d+32>>3]=a;i=f;return}else{c[d>>2]=c[j>>2];c[d+4>>2]=c[j+4>>2];h[d+24>>3]=+h[j+24>>3];h[d+8>>3]=b;h[d+16>>3]=k;h[d+40>>3]=+h[j+40>>3];i=f;return}}}while(0);c[d>>2]=0;i=f;return}function Nb(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;a=b;if((e|0)==0){i=d;return}if((c[e>>2]|0)==0){i=d;return}if((c[a>>2]|0)==0){Qb(+h[a+32>>3],e)}else{h[e+40>>3]=+h[a+40>>3]}i=d;return}function Ob(a){a=a|0;var b=0,d=0;b=i;d=a;Sa(c[d+4>>2]|0);Zb(d);i=b;return}function Pb(a){a=a|0;var b=0;b=i;Zb(a);i=b;return}function Qb(a,b){a=+a;b=b|0;var d=0,e=0.0,f=0,g=0;d=i;e=a;f=b;if((f|0)==0){i=d;return}if((c[f>>2]|0)==0){i=d;return}a=+h[f+8>>3]*(1.0-e)+ +h[f+16>>3]*e;if(e==1.0){g=5}else{if(a>=+h[f+40>>3]+ +h[f+24>>3]){g=5}}if((g|0)==5){wa[c[f>>2]&1](+h[f+8>>3]*(1.0-e)+ +h[f+16>>3]*e,c[f+4>>2]|0);h[f+40>>3]=a}i=d;return}function Rb(a,b){a=a|0;b=b|0;var c=0,d=0;c=i;d=Sb(a,b)|0;i=c;return d|0}function Sb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;e=a;a=b;b=(e+32-1|0)/32|0;f=Yb(16)|0;if((f|0)==0){g=0;h=g;i=d;return h|0}c[f>>2]=e;c[f+4>>2]=a;c[f+8>>2]=b;c[f+12>>2]=Yb((Z(b,a)|0)<<2)|0;if((c[f+12>>2]|0)!=0){g=f;h=g;i=d;return h|0}else{Zb(f);g=0;h=g;i=d;return h|0}return 0}function Tb(a){a=a|0;var b=0;b=i;Ub(a);i=b;return}function Ub(a){a=a|0;var b=0,d=0;b=i;d=a;if((d|0)!=0){Zb(c[d+12>>2]|0)}Zb(d);i=b;return}function Vb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;d=Kb()|0;c[d>>2]=0;h[d+8>>3]=1.0;e=Lb(d,a)|0;do{if((e|0)!=0){if((c[e>>2]|0)!=0){break}Pb(d);f=e;g=f;i=b;return g|0}}while(0);f=0;g=f;i=b;return g|0}function Wb(a){a=a|0;var b=0;b=i;Ob(a);i=b;return}function Xb(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;g=a;a=b;b=d;if((e|0)!=0){e=(c[g+12>>2]|0)+((Z(b,c[g+8>>2]|0)|0)<<2)+(((a|0)/32|0)<<2)|0;c[e>>2]=c[e>>2]|-2147483648>>>((a&31)>>>0);h=e;i=f;return}else{e=(c[g+12>>2]|0)+((Z(b,c[g+8>>2]|0)|0)<<2)+(((a|0)/32|0)<<2)|0;c[e>>2]=c[e>>2]&~(-2147483648>>>((a&31)>>>0));h=e;i=f;return}}function Yb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ka=0,la=0,na=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[88]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=392+(h<<2)|0;j=392+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[88]=e&~(1<<g)}else{if(l>>>0<(c[92]|0)>>>0){oa();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{oa();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(!(b>>>0>(c[90]|0)>>>0)){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=392+(p<<2)|0;m=392+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[88]=e&~(1<<r)}else{if(l>>>0<(c[92]|0)>>>0){oa();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{oa();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[90]|0;if((l|0)!=0){q=c[93]|0;d=l>>>3;l=d<<1;f=392+(l<<2)|0;k=c[88]|0;h=1<<d;do{if((k&h|0)==0){c[88]=k|h;s=f;t=392+(l+2<<2)|0}else{d=392+(l+2<<2)|0;g=c[d>>2]|0;if(!(g>>>0<(c[92]|0)>>>0)){s=g;t=d;break}oa();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[90]=m;c[93]=e;n=i;return n|0}l=c[89]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[656+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[92]|0;if(r>>>0<i>>>0){oa();return 0}e=r+b|0;m=e;if(!(r>>>0<e>>>0)){oa();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){oa();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){oa();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){oa();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{oa();return 0}}}while(0);a:do{if((e|0)!=0){f=c[d+28>>2]|0;i=656+(f<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[89]=c[89]&~(1<<f);break a}else{if(e>>>0<(c[92]|0)>>>0){oa();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break a}}}while(0);if(v>>>0<(c[92]|0)>>>0){oa();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[92]|0)>>>0){oa();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[92]|0)>>>0){oa();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[90]|0;if((f|0)!=0){e=c[93]|0;i=f>>>3;f=i<<1;q=392+(f<<2)|0;k=c[88]|0;g=1<<i;do{if((k&g|0)==0){c[88]=k|g;y=q;z=392+(f+2<<2)|0}else{i=392+(f+2<<2)|0;l=c[i>>2]|0;if(!(l>>>0<(c[92]|0)>>>0)){y=l;z=i;break}oa();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[90]=p;c[93]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[89]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[656+(A<<2)>>2]|0;b:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break b}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[656+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(!(J>>>0<((c[90]|0)-g|0)>>>0)){o=g;break}q=K;m=c[92]|0;if(q>>>0<m>>>0){oa();return 0}p=q+g|0;k=p;if(!(q>>>0<p>>>0)){oa();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){oa();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){oa();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){oa();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{oa();return 0}}}while(0);c:do{if((e|0)!=0){i=c[K+28>>2]|0;m=656+(i<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[89]=c[89]&~(1<<i);break c}else{if(e>>>0<(c[92]|0)>>>0){oa();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break c}}}while(0);if(L>>>0<(c[92]|0)>>>0){oa();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[92]|0)>>>0){oa();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[92]|0)>>>0){oa();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=392+(e<<2)|0;r=c[88]|0;j=1<<i;do{if((r&j|0)==0){c[88]=r|j;O=m;P=392+(e+2<<2)|0}else{i=392+(e+2<<2)|0;d=c[i>>2]|0;if(!(d>>>0<(c[92]|0)>>>0)){O=d;P=i;break}oa();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=656+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[89]|0;l=1<<Q;if((m&l|0)==0){c[89]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=151;break}else{l=l<<1;m=j}}if((T|0)==151){if(S>>>0<(c[92]|0)>>>0){oa();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[92]|0;if(m>>>0<i>>>0){oa();return 0}if(j>>>0<i>>>0){oa();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[90]|0;if(!(o>>>0>K>>>0)){S=K-o|0;J=c[93]|0;if(S>>>0>15>>>0){R=J;c[93]=R+o;c[90]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[90]=0;c[93]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[91]|0;if(o>>>0<J>>>0){S=J-o|0;c[91]=S;J=c[94]|0;K=J;c[94]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[82]|0)==0){J=ia(30)|0;if((J-1&J|0)==0){c[84]=J;c[83]=J;c[85]=-1;c[86]=-1;c[87]=0;c[199]=0;c[82]=(pa(0)|0)&-16^1431655768;break}else{oa();return 0}}}while(0);J=o+48|0;S=c[84]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(!(S>>>0>o>>>0)){n=0;return n|0}O=c[198]|0;do{if((O|0)!=0){P=c[196]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);d:do{if((c[199]&4|0)==0){O=c[94]|0;e:do{if((O|0)==0){T=181}else{L=O;P=800;while(1){U=P|0;M=c[U>>2]|0;if(!(M>>>0>L>>>0)){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=181;break e}else{P=M}}if((P|0)==0){T=181;break}L=R-(c[91]|0)&Q;if(!(L>>>0<2147483647>>>0)){W=0;break}m=ja(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=190}}while(0);do{if((T|0)==181){O=ja(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[83]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[196]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647>>>0)){W=0;break}m=c[198]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=ja($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=190}}while(0);f:do{if((T|0)==190){m=-_|0;if(!((X|0)==-1)){aa=Y;ba=X;T=201;break d}do{if((Z|0)!=-1&_>>>0<2147483647>>>0&_>>>0<J>>>0){g=c[84]|0;O=K-_+g&-g;if(!(O>>>0<2147483647>>>0)){ca=_;break}if((ja(O|0)|0)==-1){ja(m|0)|0;W=Y;break f}else{ca=O+_|0;break}}else{ca=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ca;ba=Z;T=201;break d}}}while(0);c[199]=c[199]|4;da=W;T=198}else{da=0;T=198}}while(0);do{if((T|0)==198){if(!(S>>>0<2147483647>>>0)){break}W=ja(S|0)|0;Z=ja(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ca=Z-W|0;Z=ca>>>0>(o+40|0)>>>0;Y=Z?W:-1;if(!((Y|0)==-1)){aa=Z?ca:da;ba=Y;T=201}}}while(0);do{if((T|0)==201){da=(c[196]|0)+aa|0;c[196]=da;if(da>>>0>(c[197]|0)>>>0){c[197]=da}da=c[94]|0;g:do{if((da|0)==0){S=c[92]|0;if((S|0)==0|ba>>>0<S>>>0){c[92]=ba}c[200]=ba;c[201]=aa;c[203]=0;c[97]=c[82];c[96]=-1;S=0;do{Y=S<<1;ca=392+(Y<<2)|0;c[392+(Y+3<<2)>>2]=ca;c[392+(Y+2<<2)>>2]=ca;S=S+1|0;}while(S>>>0<32>>>0);S=ba+8|0;if((S&7|0)==0){ea=0}else{ea=-S&7}S=aa-40-ea|0;c[94]=ba+ea;c[91]=S;c[ba+(ea+4)>>2]=S|1;c[ba+(aa-36)>>2]=40;c[95]=c[86]}else{S=800;while(1){fa=c[S>>2]|0;ga=S+4|0;ha=c[ga>>2]|0;if((ba|0)==(fa+ha|0)){T=213;break}ca=c[S+8>>2]|0;if((ca|0)==0){break}else{S=ca}}do{if((T|0)==213){if((c[S+12>>2]&8|0)!=0){break}ca=da;if(!(ca>>>0>=fa>>>0&ca>>>0<ba>>>0)){break}c[ga>>2]=ha+aa;Y=(c[91]|0)+aa|0;Z=da+8|0;if((Z&7|0)==0){ka=0}else{ka=-Z&7}Z=Y-ka|0;c[94]=ca+ka;c[91]=Z;c[ca+(ka+4)>>2]=Z|1;c[ca+(Y+4)>>2]=40;c[95]=c[86];break g}}while(0);if(ba>>>0<(c[92]|0)>>>0){c[92]=ba}S=ba+aa|0;Y=800;while(1){la=Y|0;if((c[la>>2]|0)==(S|0)){T=223;break}ca=c[Y+8>>2]|0;if((ca|0)==0){break}else{Y=ca}}do{if((T|0)==223){if((c[Y+12>>2]&8|0)!=0){break}c[la>>2]=ba;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ba+8|0;if((S&7|0)==0){na=0}else{na=-S&7}S=ba+(aa+8)|0;if((S&7|0)==0){qa=0}else{qa=-S&7}S=ba+(qa+aa)|0;ca=S;Z=na+o|0;W=ba+Z|0;_=W;K=S-(ba+na)-o|0;c[ba+(na+4)>>2]=o|3;do{if((ca|0)==(c[94]|0)){J=(c[91]|0)+K|0;c[91]=J;c[94]=_;c[ba+(Z+4)>>2]=J|1}else{if((ca|0)==(c[93]|0)){J=(c[90]|0)+K|0;c[90]=J;c[93]=_;c[ba+(Z+4)>>2]=J|1;c[ba+(J+Z)>>2]=J;break}J=aa+4|0;X=c[ba+(J+qa)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;h:do{if(X>>>0<256>>>0){U=c[ba+((qa|8)+aa)>>2]|0;Q=c[ba+(aa+12+qa)>>2]|0;R=392+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[92]|0)>>>0){oa();return 0}if((c[U+12>>2]|0)==(ca|0)){break}oa();return 0}}while(0);if((Q|0)==(U|0)){c[88]=c[88]&~(1<<V);break}do{if((Q|0)==(R|0)){ra=Q+8|0}else{if(Q>>>0<(c[92]|0)>>>0){oa();return 0}m=Q+8|0;if((c[m>>2]|0)==(ca|0)){ra=m;break}oa();return 0}}while(0);c[U+12>>2]=Q;c[ra>>2]=U}else{R=S;m=c[ba+((qa|24)+aa)>>2]|0;P=c[ba+(aa+12+qa)>>2]|0;do{if((P|0)==(R|0)){O=qa|16;g=ba+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ba+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){sa=0;break}else{ta=O;ua=e}}else{ta=L;ua=g}while(1){g=ta+20|0;L=c[g>>2]|0;if((L|0)!=0){ta=L;ua=g;continue}g=ta+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ta=L;ua=g}}if(ua>>>0<(c[92]|0)>>>0){oa();return 0}else{c[ua>>2]=0;sa=ta;break}}else{g=c[ba+((qa|8)+aa)>>2]|0;if(g>>>0<(c[92]|0)>>>0){oa();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){oa();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;sa=P;break}else{oa();return 0}}}while(0);if((m|0)==0){break}P=c[ba+(aa+28+qa)>>2]|0;U=656+(P<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=sa;if((sa|0)!=0){break}c[89]=c[89]&~(1<<P);break h}else{if(m>>>0<(c[92]|0)>>>0){oa();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=sa}else{c[m+20>>2]=sa}if((sa|0)==0){break h}}}while(0);if(sa>>>0<(c[92]|0)>>>0){oa();return 0}c[sa+24>>2]=m;R=qa|16;P=c[ba+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[92]|0)>>>0){oa();return 0}else{c[sa+16>>2]=P;c[P+24>>2]=sa;break}}}while(0);P=c[ba+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[92]|0)>>>0){oa();return 0}else{c[sa+20>>2]=P;c[P+24>>2]=sa;break}}}while(0);va=ba+(($|qa)+aa)|0;wa=$+K|0}else{va=ca;wa=K}J=va+4|0;c[J>>2]=c[J>>2]&-2;c[ba+(Z+4)>>2]=wa|1;c[ba+(wa+Z)>>2]=wa;J=wa>>>3;if(wa>>>0<256>>>0){V=J<<1;X=392+(V<<2)|0;P=c[88]|0;m=1<<J;do{if((P&m|0)==0){c[88]=P|m;xa=X;ya=392+(V+2<<2)|0}else{J=392+(V+2<<2)|0;U=c[J>>2]|0;if(!(U>>>0<(c[92]|0)>>>0)){xa=U;ya=J;break}oa();return 0}}while(0);c[ya>>2]=_;c[xa+12>>2]=_;c[ba+(Z+8)>>2]=xa;c[ba+(Z+12)>>2]=X;break}V=W;m=wa>>>8;do{if((m|0)==0){za=0}else{if(wa>>>0>16777215>>>0){za=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;za=wa>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=656+(za<<2)|0;c[ba+(Z+28)>>2]=za;c[ba+(Z+20)>>2]=0;c[ba+(Z+16)>>2]=0;X=c[89]|0;Q=1<<za;if((X&Q|0)==0){c[89]=X|Q;c[m>>2]=V;c[ba+(Z+24)>>2]=m;c[ba+(Z+12)>>2]=V;c[ba+(Z+8)>>2]=V;break}if((za|0)==31){Aa=0}else{Aa=25-(za>>>1)|0}Q=wa<<Aa;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(wa|0)){break}Ba=X+16+(Q>>>31<<2)|0;m=c[Ba>>2]|0;if((m|0)==0){T=296;break}else{Q=Q<<1;X=m}}if((T|0)==296){if(Ba>>>0<(c[92]|0)>>>0){oa();return 0}else{c[Ba>>2]=V;c[ba+(Z+24)>>2]=X;c[ba+(Z+12)>>2]=V;c[ba+(Z+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[92]|0;if(X>>>0<$>>>0){oa();return 0}if(m>>>0<$>>>0){oa();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ba+(Z+8)>>2]=m;c[ba+(Z+12)>>2]=X;c[ba+(Z+24)>>2]=0;break}}}while(0);n=ba+(na|8)|0;return n|0}}while(0);Y=da;Z=800;while(1){Ca=c[Z>>2]|0;if(!(Ca>>>0>Y>>>0)){Da=c[Z+4>>2]|0;Ea=Ca+Da|0;if(Ea>>>0>Y>>>0){break}}Z=c[Z+8>>2]|0}Z=Ca+(Da-39)|0;if((Z&7|0)==0){Fa=0}else{Fa=-Z&7}Z=Ca+(Da-47+Fa)|0;W=Z>>>0<(da+16|0)>>>0?Y:Z;Z=W+8|0;_=ba+8|0;if((_&7|0)==0){Ga=0}else{Ga=-_&7}_=aa-40-Ga|0;c[94]=ba+Ga;c[91]=_;c[ba+(Ga+4)>>2]=_|1;c[ba+(aa-36)>>2]=40;c[95]=c[86];c[W+4>>2]=27;c[Z>>2]=c[200];c[Z+4>>2]=c[201];c[Z+8>>2]=c[202];c[Z+12>>2]=c[203];c[200]=ba;c[201]=aa;c[203]=0;c[202]=Z;Z=W+28|0;c[Z>>2]=7;if((W+32|0)>>>0<Ea>>>0){_=Z;while(1){Z=_+4|0;c[Z>>2]=7;if((_+8|0)>>>0<Ea>>>0){_=Z}else{break}}}if((W|0)==(Y|0)){break}_=W-da|0;Z=Y+(_+4)|0;c[Z>>2]=c[Z>>2]&-2;c[da+4>>2]=_|1;c[Y+_>>2]=_;Z=_>>>3;if(_>>>0<256>>>0){K=Z<<1;ca=392+(K<<2)|0;S=c[88]|0;m=1<<Z;do{if((S&m|0)==0){c[88]=S|m;Ha=ca;Ia=392+(K+2<<2)|0}else{Z=392+(K+2<<2)|0;Q=c[Z>>2]|0;if(!(Q>>>0<(c[92]|0)>>>0)){Ha=Q;Ia=Z;break}oa();return 0}}while(0);c[Ia>>2]=da;c[Ha+12>>2]=da;c[da+8>>2]=Ha;c[da+12>>2]=ca;break}K=da;m=_>>>8;do{if((m|0)==0){Ja=0}else{if(_>>>0>16777215>>>0){Ja=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;W=(Y+520192|0)>>>16&4;Z=Y<<W;Y=(Z+245760|0)>>>16&2;Q=14-(W|S|Y)+(Z<<Y>>>15)|0;Ja=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=656+(Ja<<2)|0;c[da+28>>2]=Ja;c[da+20>>2]=0;c[da+16>>2]=0;ca=c[89]|0;Q=1<<Ja;if((ca&Q|0)==0){c[89]=ca|Q;c[m>>2]=K;c[da+24>>2]=m;c[da+12>>2]=da;c[da+8>>2]=da;break}if((Ja|0)==31){Ka=0}else{Ka=25-(Ja>>>1)|0}Q=_<<Ka;ca=c[m>>2]|0;while(1){if((c[ca+4>>2]&-8|0)==(_|0)){break}La=ca+16+(Q>>>31<<2)|0;m=c[La>>2]|0;if((m|0)==0){T=331;break}else{Q=Q<<1;ca=m}}if((T|0)==331){if(La>>>0<(c[92]|0)>>>0){oa();return 0}else{c[La>>2]=K;c[da+24>>2]=ca;c[da+12>>2]=da;c[da+8>>2]=da;break}}Q=ca+8|0;_=c[Q>>2]|0;m=c[92]|0;if(ca>>>0<m>>>0){oa();return 0}if(_>>>0<m>>>0){oa();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[da+8>>2]=_;c[da+12>>2]=ca;c[da+24>>2]=0;break}}}while(0);da=c[91]|0;if(!(da>>>0>o>>>0)){break}_=da-o|0;c[91]=_;da=c[94]|0;Q=da;c[94]=Q+o;c[Q+(o+4)>>2]=_|1;c[da+4>>2]=o|3;n=da+8|0;return n|0}}while(0);c[(ma()|0)>>2]=12;n=0;return n|0}function Zb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[92]|0;if(b>>>0<e>>>0){oa()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){oa()}h=f&-8;i=a+(h-8)|0;j=i;a:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){oa()}if((n|0)==(c[93]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[90]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=392+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){oa()}if((c[k+12>>2]|0)==(n|0)){break}oa()}}while(0);if((s|0)==(k|0)){c[88]=c[88]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){oa()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}oa()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){oa()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){oa()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){oa()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{oa()}}}while(0);if((p|0)==0){q=n;r=o;break}v=c[a+(l+28)>>2]|0;m=656+(v<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[89]=c[89]&~(1<<v);q=n;r=o;break a}else{if(p>>>0<(c[92]|0)>>>0){oa()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break a}}}while(0);if(A>>>0<(c[92]|0)>>>0){oa()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[92]|0)>>>0){oa()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[92]|0)>>>0){oa()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(!(d>>>0<i>>>0)){oa()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){oa()}do{if((e&2|0)==0){if((j|0)==(c[94]|0)){B=(c[91]|0)+r|0;c[91]=B;c[94]=q;c[q+4>>2]=B|1;if((q|0)!=(c[93]|0)){return}c[93]=0;c[90]=0;return}if((j|0)==(c[93]|0)){B=(c[90]|0)+r|0;c[90]=B;c[93]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;b:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=392+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[92]|0)>>>0){oa()}if((c[u+12>>2]|0)==(j|0)){break}oa()}}while(0);if((g|0)==(u|0)){c[88]=c[88]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[92]|0)>>>0){oa()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}oa()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[92]|0)>>>0){oa()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[92]|0)>>>0){oa()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){oa()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{oa()}}}while(0);if((f|0)==0){break}t=c[a+(h+20)>>2]|0;u=656+(t<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[89]=c[89]&~(1<<t);break b}else{if(f>>>0<(c[92]|0)>>>0){oa()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break b}}}while(0);if(E>>>0<(c[92]|0)>>>0){oa()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[92]|0)>>>0){oa()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[92]|0)>>>0){oa()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[93]|0)){H=B;break}c[90]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=392+(d<<2)|0;A=c[88]|0;E=1<<r;do{if((A&E|0)==0){c[88]=A|E;I=e;J=392+(d+2<<2)|0}else{r=392+(d+2<<2)|0;h=c[r>>2]|0;if(!(h>>>0<(c[92]|0)>>>0)){I=h;J=r;break}oa()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=656+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[89]|0;d=1<<K;do{if((r&d|0)==0){c[89]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=129;break}else{A=A<<1;J=E}}if((N|0)==129){if(M>>>0<(c[92]|0)>>>0){oa()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[92]|0;if(J>>>0<E>>>0){oa()}if(B>>>0<E>>>0){oa()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[96]|0)-1|0;c[96]=q;if((q|0)==0){O=808}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[96]=-1;return}function _b(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=Yb(b)|0;return d|0}if(b>>>0>4294967231>>>0){c[(ma()|0)>>2]=12;d=0;return d|0}if(b>>>0<11>>>0){e=16}else{e=b+11&-8}f=$b(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=Yb(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;cc(f|0,a|0,g>>>0<b>>>0?g:b)|0;Zb(a);d=f;return d|0}function $b(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[92]|0;if(g>>>0<j>>>0){oa();return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){oa();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){oa();return 0}if((k|0)==0){if(b>>>0<256>>>0){n=0;return n|0}do{if(!(f>>>0<(b+4|0)>>>0)){if((f-b|0)>>>0>c[84]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(!(f>>>0<b>>>0)){k=f-b|0;if(!(k>>>0>15>>>0)){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;ac(g+b|0,k);n=a;return n|0}if((i|0)==(c[94]|0)){k=(c[91]|0)+f|0;if(!(k>>>0>b>>>0)){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[94]=g+b;c[91]=l;n=a;return n|0}if((i|0)==(c[93]|0)){l=(c[90]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15>>>0){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[90]=q;c[93]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;a:do{if(m>>>0<256>>>0){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=392+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){oa();return 0}if((c[l+12>>2]|0)==(i|0)){break}oa();return 0}}while(0);if((k|0)==(l|0)){c[88]=c[88]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){oa();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}oa();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){oa();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){oa();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){oa();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{oa();return 0}}}while(0);if((s|0)==0){break}t=c[g+(f+28)>>2]|0;l=656+(t<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[89]=c[89]&~(1<<t);break a}else{if(s>>>0<(c[92]|0)>>>0){oa();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break a}}}while(0);if(y>>>0<(c[92]|0)>>>0){oa();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[92]|0)>>>0){oa();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[92]|0)>>>0){oa();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16>>>0){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;ac(g+b|0,q);n=a;return n|0}return 0}function ac(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;a:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[92]|0;if(i>>>0<l>>>0){oa()}if((j|0)==(c[93]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[90]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256>>>0){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=392+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){oa()}if((c[p+12>>2]|0)==(j|0)){break}oa()}}while(0);if((q|0)==(p|0)){c[88]=c[88]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){oa()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}oa()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){oa()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){oa()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){oa()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{oa()}}}while(0);if((m|0)==0){n=j;o=k;break}t=c[d+(28-h)>>2]|0;l=656+(t<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[89]=c[89]&~(1<<t);n=j;o=k;break a}else{if(m>>>0<(c[92]|0)>>>0){oa()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break a}}}while(0);if(y>>>0<(c[92]|0)>>>0){oa()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[92]|0)>>>0){oa()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[92]|0)>>>0){oa()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[92]|0;if(e>>>0<a>>>0){oa()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[94]|0)){A=(c[91]|0)+o|0;c[91]=A;c[94]=n;c[n+4>>2]=A|1;if((n|0)!=(c[93]|0)){return}c[93]=0;c[90]=0;return}if((f|0)==(c[93]|0)){A=(c[90]|0)+o|0;c[90]=A;c[93]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;b:do{if(z>>>0<256>>>0){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=392+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){oa()}if((c[g+12>>2]|0)==(f|0)){break}oa()}}while(0);if((t|0)==(g|0)){c[88]=c[88]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){oa()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}oa()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){oa()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){oa()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){oa()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{oa()}}}while(0);if((m|0)==0){break}l=c[d+(b+28)>>2]|0;g=656+(l<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[89]=c[89]&~(1<<l);break b}else{if(m>>>0<(c[92]|0)>>>0){oa()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break b}}}while(0);if(C>>>0<(c[92]|0)>>>0){oa()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[92]|0)>>>0){oa()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[92]|0)>>>0){oa()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[93]|0)){F=A;break}c[90]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256>>>0){z=o<<1;y=392+(z<<2)|0;C=c[88]|0;b=1<<o;do{if((C&b|0)==0){c[88]=C|b;G=y;H=392+(z+2<<2)|0}else{o=392+(z+2<<2)|0;d=c[o>>2]|0;if(!(d>>>0<(c[92]|0)>>>0)){G=d;H=o;break}oa()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215>>>0){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=656+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[89]|0;z=1<<I;if((o&z|0)==0){c[89]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}if((I|0)==31){J=0}else{J=25-(I>>>1)|0}I=F<<J;J=c[G>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(F|0)){break}K=J+16+(I>>>31<<2)|0;G=c[K>>2]|0;if((G|0)==0){L=126;break}else{I=I<<1;J=G}}if((L|0)==126){if(K>>>0<(c[92]|0)>>>0){oa()}c[K>>2]=y;c[n+24>>2]=J;c[n+12>>2]=n;c[n+8>>2]=n;return}K=J+8|0;L=c[K>>2]|0;I=c[92]|0;if(J>>>0<I>>>0){oa()}if(L>>>0<I>>>0){oa()}c[L+12>>2]=y;c[K>>2]=y;c[n+8>>2]=L;c[n+12>>2]=J;c[n+24>>2]=0;return}function bc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;i=f&~3;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b]=d;b=b+1|0}}while((b|0)<(i|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function cc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((e|0)>=4096)return qa(b|0,d|0,e|0)|0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function dc(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function ec(a,b){a=a|0;b=b|0;ta[a&1](b|0)}function fc(a,b){a=a|0;b=b|0;return ua[a&1](b|0)|0}function gc(a){a=a|0;va[a&1]()}function hc(a,b,c){a=a|0;b=+b;c=c|0;wa[a&1](+b,c|0)}function ic(a,b,c){a=a|0;b=b|0;c=c|0;return xa[a&1](b|0,c|0)|0}function jc(a){a=a|0;_(0)}function kc(a){a=a|0;_(1);return 0}function lc(){_(2)}function mc(a,b){a=+a;b=b|0;_(3)}function nc(a,b){a=a|0;b=b|0;_(4);return 0}




// EMSCRIPTEN_END_FUNCS
var ta=[jc,jc];var ua=[kc,kc];var va=[lc,lc];var wa=[mc,mc];var xa=[nc,nc];return{_Potrace_traceBitmap:Vb,_strlen:dc,_Potrace_createBitmap:Rb,_realloc:_b,_Potrace_freeBitmap:Tb,_memset:bc,_malloc:Yb,_memcpy:cc,_Potrace_bitmapPut:Xb,_Potrace_freeState:Wb,_free:Zb,runPostSets:Oa,stackAlloc:ya,stackSave:za,stackRestore:Aa,setThrew:Ba,setTempRet0:Ea,setTempRet1:Fa,setTempRet2:Ga,setTempRet3:Ha,setTempRet4:Ia,setTempRet5:Ja,setTempRet6:Ka,setTempRet7:La,setTempRet8:Ma,setTempRet9:Na,dynCall_vi:ec,dynCall_ii:fc,dynCall_v:gc,dynCall_vdi:hc,dynCall_iii:ic}})


// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_vi": invoke_vi, "invoke_ii": invoke_ii, "invoke_v": invoke_v, "invoke_vdi": invoke_vdi, "invoke_iii": invoke_iii, "_sysconf": _sysconf, "_sbrk": _sbrk, "_fabs": _fabs, "___setErrNo": ___setErrNo, "___errno_location": ___errno_location, "_sqrt": _sqrt, "_abort": _abort, "_time": _time, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_fflush": _fflush, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity }, buffer);
var _Potrace_traceBitmap = Module["_Potrace_traceBitmap"] = asm["_Potrace_traceBitmap"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _Potrace_createBitmap = Module["_Potrace_createBitmap"] = asm["_Potrace_createBitmap"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _Potrace_freeBitmap = Module["_Potrace_freeBitmap"] = asm["_Potrace_freeBitmap"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _Potrace_bitmapPut = Module["_Potrace_bitmapPut"] = asm["_Potrace_bitmapPut"];
var _Potrace_freeState = Module["_Potrace_freeState"] = asm["_Potrace_freeState"];
var _free = Module["_free"] = asm["_free"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_vdi = Module["dynCall_vdi"] = asm["dynCall_vdi"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];

Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };

// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;

// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}
