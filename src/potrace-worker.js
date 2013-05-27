// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
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
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
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
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}
if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  Module['read'] = read;
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }
  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  Module['load'] = importScripts;
}
if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
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
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];
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
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
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
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
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
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
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
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
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
  addFunction: function (func, sig) {
    //assert(sig); // TODO: support asm
    var table = FUNCTION_TABLE; // TODO: support asm
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE; // TODO: support asm
    table[index] = null;
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
      Runtime.funcWrappers[func] = function() {
        Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};
var ABORT = false;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}
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
//                   'array' for JavaScript arrays and typed arrays).
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
    var func = globalScope['Module']['_' + ident]; // closure exported function
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
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
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
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/(+(4294967296))), (+(4294967295)))>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[(tempDoublePtr)>>3]=value,HEAP32[((ptr)>>2)]=((HEAP32[((tempDoublePtr)>>2)])|0),HEAP32[(((ptr)+(4))>>2)]=((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)); break;
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
      case 'double': return (HEAP32[((tempDoublePtr)>>2)]=HEAP32[((ptr)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((ptr)+(4))>>2)],(+(HEAPF64[(tempDoublePtr)>>3])));
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_NONE = 3; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
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
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
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
    HEAPU8.set(new Uint8Array(slab), ret);
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
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
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
STACK_ROOT = STACKTOP = Runtime.alignMemory(1);
STACK_MAX = TOTAL_STACK; // we lose a little stack here, but TOTAL_STACK is nice and round so use that as the max
var tempDoublePtr = Runtime.alignMemory(allocate(12, 'i8', ALLOC_STACK), 8);
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
STATICTOP = STACK_MAX;
assert(STATICTOP < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var nullString = allocate(intArrayFromString('(null)'), 'i8', ALLOC_STACK);
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
var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown
var runtimeInitialized = false;
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
    HEAP8[(((buffer)+(i))|0)]=chr
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
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
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
if (!Math.imul) Math.imul = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 6000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
function addPreRun(func) {
  if (!Module['preRun']) Module['preRun'] = [];
  else if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
  Module['preRun'].push(func);
}
var awaitingMemoryInitializer = false;
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, TOTAL_STACK);
    runPostSets();
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
  awaitingMemoryInitializer = false;
}
// === Body ===
assert(STATICTOP == STACK_MAX); assert(STACK_MAX == TOTAL_STACK);
STATICTOP += 812;
assert(STATICTOP < TOTAL_MEMORY);
/* memory initializer */ allocate([2,0,0,0,4,0,0,0,0,0,0,0,0,0,240,63,1,0,0,0,154,153,153,153,153,153,201,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,1,1,0,1,1,0,0,1,1,1,0,0,0,1,1,1,0,1,0,1,1,0,1,0,0,0,0,0,0,1,1,1,0,1,1,0,0,1,0,0,0,0,0,1,0,0,1,1,0,0,0,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1,0,0,0,1,1,0,0,0,0,1,0,1,1,0,0,1,1,1,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,0,0,0,0,1,0,1,0,1,0,1,0,0,1,0,0,1,0,1,1,1,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0,1,0,1,0,1,0,0,1,1,0,1,0,0,0,0,0,0,1,0,0,0,0,1,1,1,1,0,1,1,0,0,1,1,0,0,1,1,0,1,1,0,0,0,1,1,1,1,0,1,0,0,0,0,1,0,1,1,1,0,0,0,1,0,1,1,0,0,1,1,1,0,1,0,0,1,1,0,0,1,1,1,0,0,1,1,1,0,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, TOTAL_STACK)
function runPostSets() {
}
if (!awaitingMemoryInitializer) runPostSets();
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  var _sqrt=Math.sqrt;
  var _fabs=Math.abs;
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }
  var _llvm_memset_p0i8_i64=_memset;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  Module["_strlen"] = _strlen;
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
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
        if (Browser.initted) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        function getMimetype(name) {
          return {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(name.lastIndexOf('.')+1)];
        }
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/.exec(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
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
          img.onload = function() {
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
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
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
              var b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
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
            setTimeout(function() {
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
                                 document['webkitExitPointerLock'];
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
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
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
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        this.lockPointer = lockPointer;
        this.resizeCanvas = resizeCanvas;
        if (typeof this.lockPointer === 'undefined') this.lockPointer = true;
        if (typeof this.resizeCanvas === 'undefined') this.resizeCanvas = false;
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
        if (!this.fullScreenHandlersInstalled) {
          this.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen(); 
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
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
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
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
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      }};
___setErrNo(0);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
var Math_min = Math.min;
function invoke_vfi(index,a1,a2) {
  try {
    Module.dynCall_vfi(index,a1,a2);
  } catch(e) {
    asm.setThrew(1);
  }
}
function invoke_vi(index,a1) {
  try {
    Module.dynCall_vi(index,a1);
  } catch(e) {
    asm.setThrew(1);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module.dynCall_ii(index,a1);
  } catch(e) {
    asm.setThrew(1);
  }
}
function invoke_v(index) {
  try {
    Module.dynCall_v(index);
  } catch(e) {
    asm.setThrew(1);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module.dynCall_iii(index,a1,a2);
  } catch(e) {
    asm.setThrew(1);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=+env.NaN;var n=+env.Infinity;var o=0;var p=0;var q=0,r=0,s=0,t=0,u=0.0,v=0,w=0,x=0,y=0.0;var z=0;var A=0;var B=0;var C=0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=global.Math.floor;var K=global.Math.abs;var L=global.Math.sqrt;var M=global.Math.pow;var N=global.Math.cos;var O=global.Math.sin;var P=global.Math.tan;var Q=global.Math.acos;var R=global.Math.asin;var S=global.Math.atan;var T=global.Math.atan2;var U=global.Math.exp;var V=global.Math.log;var W=global.Math.ceil;var X=global.Math.imul;var Y=env.abort;var Z=env.assert;var _=env.asmPrintInt;var $=env.asmPrintFloat;var aa=env.copyTempDouble;var ab=env.copyTempFloat;var ac=env.min;var ad=env.invoke_vfi;var ae=env.invoke_vi;var af=env.invoke_ii;var ag=env.invoke_v;var ah=env.invoke_iii;var ai=env._llvm_lifetime_end;var aj=env._sysconf;var ak=env._fabs;var al=env.___setErrNo;var am=env.___errno_location;var an=env._sqrt;var ao=env._llvm_lifetime_start;var ap=env._abort;var aq=env._sbrk;var ar=env._time;
// EMSCRIPTEN_START_FUNCS
function ax(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+3>>2<<2;return b|0}function ay(){return i|0}function az(a){a=a|0;i=a}function aA(a){a=a|0;o=a}function aB(a){a=a|0;z=a}function aC(a){a=a|0;A=a}function aD(a){a=a|0;B=a}function aE(a){a=a|0;C=a}function aF(a){a=a|0;D=a}function aG(a){a=a|0;E=a}function aH(a){a=a|0;F=a}function aI(a){a=a|0;G=a}function aJ(a){a=a|0;H=a}function aK(a){a=a|0;I=a}function aL(a){a=a|0;var b=0,d=0,e=0,f=0;if((a|0)==0){b=a;a_(b);return}d=a+32|0;e=c[d>>2]|0;if((e|0)==0){f=0}else{a_(c[e+4>>2]|0);a_(c[(c[d>>2]|0)+8>>2]|0);a_(c[(c[d>>2]|0)+20>>2]|0);a_(c[(c[d>>2]|0)+28>>2]|0);e=c[d>>2]|0;a_(c[e+36>>2]|0);a_(c[e+40>>2]|0);a_(c[e+48>>2]|0);a_(c[e+52>>2]|0);a_(c[e+56>>2]|0);a_(c[e+60>>2]|0);e=c[d>>2]|0;a_(c[e+68>>2]|0);a_(c[e+72>>2]|0);a_(c[e+80>>2]|0);a_(c[e+84>>2]|0);a_(c[e+88>>2]|0);a_(c[e+92>>2]|0);f=c[d>>2]|0}a_(f);b=a;a_(b);return}function aM(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;a3(a|0,0,32);c[a>>2]=b;d=aZ(b<<2)|0;e=a+4|0;c[e>>2]=d;do{if((d|0)==0){f=a+8|0}else{g=aZ(b*48&-1)|0;h=a+8|0;c[h>>2]=g;if((g|0)==0){f=h;break}g=aZ(b<<4)|0;c[a+16>>2]=g;if((g|0)==0){f=h;break}g=b<<3;i=aZ(g)|0;c[a+20>>2]=i;if((i|0)==0){f=h;break}i=aZ(g)|0;c[a+24>>2]=i;if((i|0)==0){f=h;break}i=aZ(g)|0;c[a+28>>2]=i;if((i|0)==0){f=h;break}else{j=0}return j|0}}while(0);a_(c[e>>2]|0);a_(c[f>>2]|0);a_(c[a+16>>2]|0);a_(c[a+20>>2]|0);a_(c[a+24>>2]|0);a_(c[a+28>>2]|0);j=1;return j|0}function aN(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,j=0,l=0.0,m=0,n=0,o=0.0,p=0.0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0.0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,a$=0,a0=0,a1=0,a2=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0.0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0.0,by=0.0,bz=0.0,bA=0.0,bB=0.0,bC=0.0,bD=0.0,bE=0.0,bF=0.0,bG=0,bH=0.0,bI=0.0,bJ=0,bK=0,bL=0,bM=0,bN=0,bO=0,bP=0,bQ=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0.0,b_=0,b$=0,b0=0.0,b1=0.0,b2=0.0,b3=0.0,b4=0.0,b5=0.0,b6=0.0,b7=0.0,b8=0.0,b9=0.0,ca=0.0,cb=0.0,cc=0.0,cd=0.0,ce=0.0,cf=0.0,cg=0.0,ch=0.0,ci=0.0,cj=0.0,ck=0.0,cl=0.0,cm=0.0,cn=0.0,co=0.0,cp=0.0,cq=0.0,cr=0.0,cs=0.0,ct=0.0,cu=0.0,cv=0.0,cw=0.0,cx=0.0,cy=0.0,cz=0.0,cA=0.0,cB=0.0,cC=0.0,cD=0.0,cE=0.0,cF=0.0,cG=0.0,cH=0.0,cI=0.0,cJ=0.0,cK=0.0,cL=0.0,cM=0.0,cN=0.0,cO=0.0,cP=0.0,cQ=0.0,cR=0.0,cS=0,cT=0,cU=0.0,cV=0,cW=0.0,cX=0.0,cY=0.0,cZ=0.0,c_=0,c$=0,c0=0,c1=0,c2=0,c3=0,c4=0,c5=0,c6=0,c7=0,c8=0,c9=0,da=0,db=0,dc=0,dd=0.0,de=0,df=0,dg=0,dh=0,di=0,dj=0,dk=0,dl=0,dm=0,dn=0,dp=0,dq=0,dr=0,ds=0,dt=0,du=0,dv=0,dw=0.0,dx=0,dy=0,dz=0.0,dA=0.0,dB=0.0,dC=0,dD=0.0,dE=0.0,dF=0,dG=0.0,dH=0.0,dI=0.0,dJ=0.0,dK=0,dL=0,dM=0,dN=0,dO=0,dP=0,dQ=0,dR=0,dS=0,dT=0.0;e=i;i=i+32|0;f=e|0;g=e+16|0;j=d|0;L20:do{if((c[j>>2]|0)==0){l=0.0;m=22}else{if((a|0)==0){break}else{n=a;o=0.0}while(1){p=o+ +(c[c[n+32>>2]>>2]|0);q=c[n+20>>2]|0;if((q|0)==0){l=p;m=22;break L20}else{n=q;o=p}}}}while(0);do{if((m|0)==22){L26:do{if((a|0)!=0){n=g;q=g+12|0;r=g+8|0;s=g+4|0;t=g|0;u=f;v=b+8|0;w=b+16|0;x=(d|0)==0;y=d+8|0;z=d+16|0;A=d+40|0;B=d+4|0;C=d+24|0;D=b+20|0;E=a;o=0.0;while(1){F=E+32|0;G=c[F>>2]|0;H=c[G>>2]|0;I=aZ((H*40&-1)+40|0)|0;J=G+20|0;c[J>>2]=I;if((I|0)==0){M=1;m=399;break}N=G+4|0;O=c[N>>2]|0;P=G+12|0;c[P>>2]=c[O>>2]|0;Q=G+16|0;c[Q>>2]=c[O+4>>2]|0;O=I+8|0;h[k>>3]=0.0,c[O>>2]=c[k>>2]|0,c[O+4>>2]=c[k+4>>2]|0;O=c[J>>2]|0;h[k>>3]=0.0,c[O>>2]=c[k>>2]|0,c[O+4>>2]=c[k+4>>2]|0;O=(c[J>>2]|0)+32|0;h[k>>3]=0.0,c[O>>2]=c[k>>2]|0,c[O+4>>2]=c[k+4>>2]|0;O=(c[J>>2]|0)+24|0;h[k>>3]=0.0,c[O>>2]=c[k>>2]|0,c[O+4>>2]=c[k+4>>2]|0;O=(c[J>>2]|0)+16|0;h[k>>3]=0.0,c[O>>2]=c[k>>2]|0,c[O+4>>2]=c[k+4>>2]|0;L31:do{if((H|0)>0){O=0;while(1){I=c[N>>2]|0;G=(c[I+(O<<3)>>2]|0)-(c[P>>2]|0)|0;R=(c[I+(O<<3)+4>>2]|0)-(c[Q>>2]|0)|0;I=c[J>>2]|0;S=I+(O*40&-1)|0;p=+(G|0)+(c[k>>2]=c[S>>2]|0,c[k+4>>2]=c[S+4>>2]|0,+h[k>>3]);S=O+1|0;T=I+(S*40&-1)|0;h[k>>3]=p,c[T>>2]=c[k>>2]|0,c[T+4>>2]=c[k+4>>2]|0;T=c[J>>2]|0;I=T+(O*40&-1)+8|0;p=+(R|0)+(c[k>>2]=c[I>>2]|0,c[k+4>>2]=c[I+4>>2]|0,+h[k>>3]);I=T+(S*40&-1)+8|0;h[k>>3]=p,c[I>>2]=c[k>>2]|0,c[I+4>>2]=c[k+4>>2]|0;I=c[J>>2]|0;T=I+(O*40&-1)+16|0;p=(c[k>>2]=c[T>>2]|0,c[k+4>>2]=c[T+4>>2]|0,+h[k>>3]);U=+(X(G,G)|0)+p;T=I+(S*40&-1)+16|0;h[k>>3]=U,c[T>>2]=c[k>>2]|0,c[T+4>>2]=c[k+4>>2]|0;T=c[J>>2]|0;I=T+(O*40&-1)+24|0;U=(c[k>>2]=c[I>>2]|0,c[k+4>>2]=c[I+4>>2]|0,+h[k>>3]);p=+(X(R,G)|0)+U;G=T+(S*40&-1)+24|0;h[k>>3]=p,c[G>>2]=c[k>>2]|0,c[G+4>>2]=c[k+4>>2]|0;G=c[J>>2]|0;T=G+(O*40&-1)+32|0;p=(c[k>>2]=c[T>>2]|0,c[k+4>>2]=c[T+4>>2]|0,+h[k>>3]);U=+(X(R,R)|0)+p;R=G+(S*40&-1)+32|0;h[k>>3]=U,c[R>>2]=c[k>>2]|0,c[R+4>>2]=c[k+4>>2]|0;if((S|0)==(H|0)){break L31}else{O=S}}}}while(0);H=c[F>>2]|0;J=c[H+4>>2]|0;Q=c[H>>2]|0;P=Q<<2;N=aZ(P)|0;O=N;if((N|0)==0){V=0;W=0;m=101;break}S=aZ(P)|0;R=S;if((S|0)==0){V=R;W=N;m=101;break}G=Q-1|0;T=(Q|0)>0;L37:do{if(T){I=0;Y=G;while(1){if((c[J+(Y<<3)>>2]|0)==(c[J+(I<<3)>>2]|0)){Z=I}else{Z=(c[J+(Y<<3)+4>>2]|0)==(c[J+(I<<3)+4>>2]|0)?I:Y+1|0}c[R+(Y<<2)>>2]=Z;if((Y|0)>0){I=Z;Y=Y-1|0}else{break L37}}}}while(0);Y=aZ(P)|0;I=Y;_=H+8|0;c[_>>2]=I;if((Y|0)==0){V=R;W=N;m=101;break}if(T){Y=G;while(1){$=Y+1|0;a3(n|0,0,16);if(($|0)<(Q|0)){aa=c[J+(Y<<3)>>2]|0;ab=$;ac=aa;ad=(c[J+($<<3)>>2]|0)-aa|0}else{aa=($|0)%(Q|0);$=c[J+(Y<<3)>>2]|0;ab=aa;ac=$;ad=(c[J+(aa<<3)>>2]|0)-$|0}$=c[J+(Y<<3)+4>>2]|0;aa=g+((((((ad*3&-1)+3|0)+(c[J+(ab<<3)+4>>2]|0)|0)-$|0)/2&-1)<<2)|0;c[aa>>2]=(c[aa>>2]|0)+1|0;aa=c[R+(Y<<2)>>2]|0;ae=Y;af=0;ag=0;ah=0;ai=0;aj=ac;ak=$;L52:while(1){al=c[J+(aa<<3)>>2]|0;am=al-aj|0;if((am|0)>0){an=6}else{an=((am>>31)*3&-1)+3|0}ao=c[J+(aa<<3)+4>>2]|0;am=ao-ak|0;ap=g+(((((am|0)>0?1:am>>31)+an|0)/2&-1)<<2)|0;c[ap>>2]=(c[ap>>2]|0)+1|0;do{if((c[t>>2]|0)!=0){if((c[s>>2]|0)==0){break}if((c[r>>2]|0)==0){break}if((c[q>>2]|0)!=0){m=45;break L52}}}while(0);ap=al-ac|0;am=ao-$|0;aq=X(am,af);if((aq-X(ap,ag)|0)<0){m=66;break}aq=X(am,ah);if((aq-X(ap,ai)|0)>0){m=66;break}do{if((((ap|0)>0?ap:-ap|0)|0)<2){if((((am|0)>0?am:-am|0)|0)<2){ar=af;at=ag;au=ah;av=ai;break}else{m=50;break}}else{m=50}}while(0);if((m|0)==50){m=0;do{if((am|0)>-1){if((am|0)>0){aw=1;break}aw=(ap>>31&2)-1|0}else{aw=-1}}while(0);aq=aw+ap|0;do{if((ap|0)<1){if((ap|0)<0){ax=1;break}ax=(am>>31&2)-1|0}else{ax=-1}}while(0);ay=ax+am|0;az=X(ay,af);aA=(az-X(aq,ag)|0)>-1;az=aA?ay:ag;ay=aA?aq:af;do{if((am|0)<1){if((am|0)<0){aB=1;break}aB=(ap>>31&2)-1|0}else{aB=-1}}while(0);aq=aB+ap|0;if((al|0)==(ac|0)){aC=(am>>31&2)-1|0}else{aC=ap>>31|1}aA=aC+am|0;aD=X(aA,ah);aE=(aD-X(aq,ai)|0)<1;ar=ay;at=az;au=aE?aq:ah;av=aE?aA:ai}aF=c[R+(aa<<2)>>2]|0;aA=(aF|0)<=(Y|0);aE=(Y|0)<(aa|0);if((aF|0)>(aa|0)){if(aA|aE){ae=aa;aa=aF;af=ar;ag=at;ah=au;ai=av;aj=al;ak=ao;continue}else{m=65;break}}else{if(aA&aE){ae=aa;aa=aF;af=ar;ag=at;ah=au;ai=av;aj=al;ak=ao;continue}else{m=65;break}}}do{if((m|0)==45){m=0;c[O+(Y<<2)>>2]=ae;break}else if((m|0)==65){m=0;aG=aa;aH=ar;aI=at;aJ=au;aK=av;aL=c[J+(aF<<3)>>2]|0;aN=c[J+(aF<<3)+4>>2]|0;aO=al;aP=ao;m=67;break}else if((m|0)==66){m=0;aG=ae;aH=af;aI=ag;aJ=ah;aK=ai;aL=al;aN=ao;aO=c[J+(ae<<3)>>2]|0;aP=c[J+(ae<<3)+4>>2]|0;m=67;break}}while(0);if((m|0)==67){m=0;ae=aL-aO|0;ai=(ae|0)>0?1:ae>>31;ae=aN-aP|0;ah=(ae|0)>0?1:ae>>31;ae=aO-ac|0;ag=aP-$|0;af=X(ag,aH);aa=af-X(ae,aI)|0;af=X(ah,aH);ak=af-X(ai,aI)|0;af=X(ag,aJ);ag=X(ae,aK);ae=X(ah,aJ);ah=ae-X(ai,aK)|0;do{if((ak|0)<0){ai=-ak|0;if((aa|0)>-1){aQ=(aa|0)/(ai|0)&-1;break}else{aQ=(aa^-1|0)/(ai|0)&-1^-1;break}}else{aQ=1e7}}while(0);do{if((ah|0)>0){aa=ag-af|0;ak=(aa|0)>-1;if(ak){aR=(aa|0)/(ah|0)&-1}else{aR=(aa^-1|0)/(ah|0)&-1^-1}if((aQ|0)<(aR|0)){aS=aQ;break}if(ak){aS=(aa|0)/(ah|0)&-1;break}else{aS=(aa^-1|0)/(ah|0)&-1^-1;break}}else{aS=aQ}}while(0);ah=aS+aG|0;do{if((ah|0)<(Q|0)){if((ah|0)>-1){aT=ah;break}aT=G-(ah^-1|0)%(Q|0)|0}else{aT=(ah|0)%(Q|0)}}while(0);c[O+(Y<<2)>>2]=aT}if((Y|0)>0){Y=Y-1|0}else{break}}aU=c[_>>2]|0}else{aU=I}Y=c[O+(G<<2)>>2]|0;c[aU+(G<<2)>>2]=Y;J=Q-2|0;L118:do{if((J|0)>-1){R=Y;T=J;while(1){H=T+1|0;P=c[O+(T<<2)>>2]|0;ah=(H|0)<=(P|0);af=(P|0)<(R|0);do{if((H|0)>(R|0)){if(ah|af){m=91;break}else{aV=R;break}}else{if(ah&af){m=91;break}else{aV=R;break}}}while(0);if((m|0)==91){m=0;aV=P}c[(c[_>>2]|0)+(T<<2)>>2]=aV;if((T|0)>0){R=aV;T=T-1|0}else{aW=aV;break L118}}}else{aW=Y}}while(0);Y=G;while(1){O=Y+1|0;do{if((O|0)<(Q|0)){if((O|0)>-1){aX=O;break}aX=G-(-2-Y|0)%(Q|0)|0}else{aX=(O|0)%(Q|0)}}while(0);O=(c[_>>2]|0)+(Y<<2)|0;J=c[O>>2]|0;I=(aX|0)<=(aW|0);T=(aW|0)<(J|0);if((aX|0)>(J|0)){if(!(I|T)){break}}else{if(!(I&T)){break}}c[O>>2]=aW;Y=Y-1|0}a_(N);a_(S);Y=c[F>>2]|0;_=Y|0;Q=c[_>>2]|0;G=Q+1|0;O=aZ(G<<3)|0;T=O;if((O|0)==0){aY=0;a$=0;a0=0;a1=0;a2=0;a5=0;m=152;break}I=G<<2;G=aZ(I)|0;J=G;if((G|0)==0){aY=0;a$=0;a0=0;a1=0;a2=J;a5=O;m=152;break}R=aZ(Q<<2)|0;af=R;if((R|0)==0){aY=0;a$=0;a0=0;a1=af;a2=J;a5=O;m=152;break}ah=aZ(I)|0;H=ah;if((ah|0)==0){aY=0;a$=0;a0=H;a1=af;a2=J;a5=O;m=152;break}az=aZ(I)|0;ay=az;if((az|0)==0){aY=0;a$=ay;a0=H;a1=af;a2=J;a5=O;m=152;break}am=aZ(I)|0;I=am;if((am|0)==0){aY=I;a$=ay;a0=H;a1=af;a2=J;a5=O;m=152;break}ap=(Q|0)>0;L146:do{if(ap){ag=Q-1|0;aa=Y+8|0;ak=0;while(1){$=ak-1|0;do{if(($|0)<(Q|0)){if((ak|0)>0){a6=$;break}a6=ag-(-ak|0)%(Q|0)|0}else{a6=($|0)%(Q|0)}}while(0);$=c[(c[aa>>2]|0)+(a6<<2)>>2]|0;P=$-1|0;do{if((P|0)<(Q|0)){if(($|0)>0){a7=P;break}a7=ag-(-$|0)%(Q|0)|0}else{a7=(P|0)%(Q|0)}}while(0);do{if((a7|0)==(ak|0)){P=ak+1|0;if((P|0)<(Q|0)){a8=P;a9=af+(ak<<2)|0;m=124;break}else{ba=(P|0)==(Q|0)?0:P;m=122;break}}else{ba=a7;m=122}}while(0);do{if((m|0)==122){m=0;P=af+(ak<<2)|0;if((ba|0)>=(ak|0)){a8=ba;a9=P;m=124;break}c[P>>2]=Q;break}}while(0);if((m|0)==124){m=0;c[a9>>2]=a8}P=ak+1|0;if((P|0)==(Q|0)){bb=1;bc=0;break}else{ak=P}}while(1){ak=af+(bc<<2)|0;L173:do{if((bb|0)>(c[ak>>2]|0)){bd=bb}else{ag=bb;while(1){c[H+(ag<<2)>>2]=bc;aa=ag+1|0;if((aa|0)>(c[ak>>2]|0)){bd=aa;break L173}else{ag=aa}}}}while(0);ak=bc+1|0;if((ak|0)==(Q|0)){be=0;bf=0;bg=ay;break}else{bb=bd;bc=ak}}while(1){c[bg>>2]=bf;ak=c[af+(bf<<2)>>2]|0;bh=be+1|0;bi=ay+(bh<<2)|0;if((ak|0)<(Q|0)){be=bh;bf=ak;bg=bi}else{break}}c[bi>>2]=Q;if((bh|0)>0){bj=bh;bk=Q}else{bl=bh;m=133;break}while(1){c[I+(bj<<2)>>2]=bk;ak=bj-1|0;if((ak|0)>0){bj=ak;bk=c[H+(bk<<2)>>2]|0}else{break}}c[I>>2]=0;h[k>>3]=0.0,c[T>>2]=c[k>>2]|0,c[T+4>>2]=c[k+4>>2]|0;if((be|0)<0){bm=bh;break}ak=Y+4|0;ag=Y+20|0;aa=be+2|0;P=1;while(1){$=c[I+(P<<2)>>2]|0;ai=ay+(P<<2)|0;L186:do{if(($|0)<=(c[ai>>2]|0)){ae=ay+(P-1<<2)|0;aj=$;while(1){aE=c[ae>>2]|0;aA=H+(aj<<2)|0;aq=c[aA>>2]|0;L190:do{if((aE|0)<(aq|0)){bn=-1.0}else{aD=J+(aj<<2)|0;bo=aE;U=-1.0;bp=aq;while(1){bq=c[_>>2]|0;br=c[ak>>2]|0;bs=c[ag>>2]|0;bt=(bq|0)>(aj|0);bu=aj-(bt?0:bq)|0;bv=bu+1|0;bw=bs+(bv*40&-1)|0;p=(c[k>>2]=c[bw>>2]|0,c[k+4>>2]=c[bw+4>>2]|0,+h[k>>3]);bw=bs+(bo*40&-1)|0;bx=p-(c[k>>2]=c[bw>>2]|0,c[k+4>>2]=c[bw+4>>2]|0,+h[k>>3]);if(bt){bt=bs+(bv*40&-1)+8|0;p=(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bo*40&-1)+8|0;by=p-(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bv*40&-1)+16|0;p=(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bo*40&-1)+16|0;bz=p-(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bv*40&-1)+24|0;p=(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bo*40&-1)+24|0;bA=p-(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bv*40&-1)+32|0;p=(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bo*40&-1)+32|0;bB=bx;bC=by;bD=bz;bE=bA;bF=p-(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bG=bv-bo|0}else{bt=bs+(bq*40&-1)|0;p=bx+(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bv*40&-1)+8|0;bx=(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bo*40&-1)+8|0;bA=bx-(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bq*40&-1)+8|0;bx=bA+(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bv*40&-1)+16|0;bA=(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bo*40&-1)+16|0;bz=bA-(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bq*40&-1)+16|0;bA=bz+(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bv*40&-1)+24|0;bz=(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bo*40&-1)+24|0;by=bz-(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bq*40&-1)+24|0;bz=by+(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bv*40&-1)+32|0;by=(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bo*40&-1)+32|0;bH=by-(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bt=bs+(bq*40&-1)+32|0;bB=p;bC=bx;bD=bA;bE=bz;bF=bH+(c[k>>2]=c[bt>>2]|0,c[k+4>>2]=c[bt+4>>2]|0,+h[k>>3]);bG=(bq-bo|0)+bv|0}bH=+(bG|0);bv=c[br+(bo<<3)>>2]|0;bq=c[br+(bu<<3)>>2]|0;bz=+(bq+bv|0)*.5- +(c[br>>2]|0);bt=c[br+(bo<<3)+4>>2]|0;bs=c[br+(bu<<3)+4>>2]|0;bA=+(bs+bt|0)*.5- +(c[br+4>>2]|0);bx=+(bq-bv|0);p=+(bt-bs|0);by=+L(+(bx*bx*((bF-bC*2.0*bA)/bH+bA*bA)+(p*p*((bD-bB*2.0*bz)/bH+bz*bz)+bx*p*2.0*((bE-bB*bA-bC*bz)/bH+bz*bA))));bs=T+(bo<<3)|0;bA=by+(c[k>>2]=c[bs>>2]|0,c[k+4>>2]=c[bs+4>>2]|0,+h[k>>3]);if(U<0.0|bA<U){c[aD>>2]=bo;bI=bA;bJ=c[aA>>2]|0}else{bI=U;bJ=bp}bs=bo-1|0;if((bs|0)<(bJ|0)){bn=bI;break L190}else{bo=bs;U=bI;bp=bJ}}}}while(0);aA=T+(aj<<3)|0;h[k>>3]=bn,c[aA>>2]=c[k>>2]|0,c[aA+4>>2]=c[k+4>>2]|0;aA=aj+1|0;if((aA|0)>(c[ai>>2]|0)){break L186}else{aj=aA}}}}while(0);ai=P+1|0;if((ai|0)==(aa|0)){bm=bh;break L146}else{P=ai}}}else{c[ay>>2]=Q;bl=0;m=133;break}}while(0);if((m|0)==133){m=0;c[I>>2]=0;h[k>>3]=0.0,c[T>>2]=c[k>>2]|0,c[T+4>>2]=c[k+4>>2]|0;bm=bl}c[Y+24>>2]=bm;_=aZ(bm<<2)|0;S=_;N=Y+28|0;c[N>>2]=S;if((_|0)==0){aY=I;a$=ay;a0=H;a1=af;a2=J;a5=O;m=152;break}L208:do{if(ap){_=bm-1|0;P=c[J+(Q<<2)>>2]|0;c[S+(_<<2)>>2]=P;if((P|0)>0){bK=_;bL=P}else{break}while(1){P=bK-1|0;_=c[J+(bL<<2)>>2]|0;c[(c[N>>2]|0)+(P<<2)>>2]=_;if((_|0)>0){bK=P;bL=_}else{break L208}}}}while(0);a_(O);a_(G);a_(R);a_(ah);a_(az);a_(am);N=c[F>>2]|0;J=c[N+24>>2]|0;S=c[N+28>>2]|0;Q=N|0;ap=c[Q>>2]|0;af=c[N+4>>2]|0;H=c[N+12>>2]|0;ay=c[N+16>>2]|0;I=J<<4;Y=aZ(I)|0;T=Y;if((Y|0)==0){bM=0;bN=0;bO=0;m=206;break}_=aZ(I)|0;I=_;if((_|0)==0){bM=I;bN=0;bO=Y;m=206;break}P=aZ(J*72&-1)|0;aa=P;if((P|0)==0){bM=I;bN=aa;bO=Y;m=206;break}if((aM(N+32|0,J)|0)!=0){bM=I;bN=aa;bO=Y;m=206;break}L217:do{if((J|0)>0){ag=ap-1|0;ak=N+20|0;ai=0;while(1){$=ai+1|0;if(($|0)<(J|0)){bP=$}else{bP=($|0)==(J|0)?0:$}aj=c[S+(ai<<2)>>2]|0;ae=(c[S+(bP<<2)>>2]|0)-aj|0;do{if((ae|0)<(ap|0)){if((ae|0)>-1){bQ=ae;break}bQ=ag-(ae^-1|0)%(ap|0)|0}else{bQ=(ae|0)%(ap|0)}}while(0);ae=bQ+aj|0;aA=I+(ai<<4)|0;aq=c[Q>>2]|0;aE=c[ak>>2]|0;L229:do{if((ae|0)<(aq|0)){bR=ae;bS=0}else{bp=ae;bo=0;while(1){aD=bp-aq|0;bs=bo+1|0;if((aD|0)<(aq|0)){bR=aD;bS=bs;break L229}else{bp=aD;bo=bs}}}}while(0);L233:do{if((aj|0)<(aq|0)){bT=aj;bU=bS}else{ae=aj;bo=bS;while(1){bp=ae-aq|0;bs=bo-1|0;if((bp|0)<(aq|0)){bT=bp;bU=bs;break L233}else{ae=bp;bo=bs}}}}while(0);L237:do{if((bR|0)<0){aj=bR;bo=bU;while(1){ae=aj+aq|0;bs=bo-1|0;if((ae|0)<0){aj=ae;bo=bs}else{bV=ae;bW=bs;break L237}}}else{bV=bR;bW=bU}}while(0);L241:do{if((bT|0)<0){bo=bT;aj=bW;while(1){bs=bo+aq|0;ae=aj+1|0;if((bs|0)<0){bo=bs;aj=ae}else{bX=bs;bY=ae;break L241}}}else{bX=bT;bY=bW}}while(0);aj=bV+1|0;bo=aE+(aj*40&-1)|0;U=(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(bX*40&-1)|0;bA=U-(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);U=+(bY|0);bo=aE+(aq*40&-1)|0;by=bA+U*(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(aj*40&-1)+8|0;bA=(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(bX*40&-1)+8|0;bz=bA-(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(aq*40&-1)+8|0;bA=bz+U*(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(aj*40&-1)+16|0;bz=(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(bX*40&-1)+16|0;bH=bz-(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(aq*40&-1)+16|0;bz=bH+U*(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(aj*40&-1)+24|0;bH=(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(bX*40&-1)+24|0;p=bH-(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(aq*40&-1)+24|0;bH=p+U*(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(aj*40&-1)+32|0;p=(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(bX*40&-1)+32|0;bx=p-(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(aq*40&-1)+32|0;p=bx+U*(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);U=+((aj-bX|0)+X(bY,aq)|0);bx=by/U;aj=T+(ai<<4)|0;h[k>>3]=bx,c[aj>>2]=c[k>>2]|0,c[aj+4>>2]=c[k+4>>2]|0;bx=bA/U;aj=T+(ai<<4)+8|0;h[k>>3]=bx,c[aj>>2]=c[k>>2]|0,c[aj+4>>2]=c[k+4>>2]|0;bx=(bz-by*by/U)/U;bz=(bH-by*bA/U)/U;by=(p-bA*bA/U)/U;U=bx-by;bA=(bx+by+ +L(+(bz*bz*4.0+U*U)))*.5;U=bx-bA;bx=by-bA;bA=+K(+U);do{if(bA<+K(+bx)){by=+L(+(bz*bz+bx*bx));if(by==0.0){bZ=by;break}p=(-0.0-bx)/by;aj=aA|0;h[k>>3]=p,c[aj>>2]=c[k>>2]|0,c[aj+4>>2]=c[k+4>>2]|0;p=bz/by;aj=I+(ai<<4)+8|0;h[k>>3]=p,c[aj>>2]=c[k>>2]|0,c[aj+4>>2]=c[k+4>>2]|0;bZ=by}else{by=+L(+(bz*bz+U*U));if(by==0.0){bZ=by;break}p=(-0.0-bz)/by;aj=aA|0;h[k>>3]=p,c[aj>>2]=c[k>>2]|0,c[aj+4>>2]=c[k+4>>2]|0;p=U/by;aj=I+(ai<<4)+8|0;h[k>>3]=p,c[aj>>2]=c[k>>2]|0,c[aj+4>>2]=c[k+4>>2]|0;bZ=by}}while(0);if(bZ==0.0){a3(aA|0,0,16)}if(($|0)==(J|0)){b_=0;break}else{ai=$}}while(1){ai=I+(b_<<4)|0;U=(c[k>>2]=c[ai>>2]|0,c[k+4>>2]=c[ai+4>>2]|0,+h[k>>3]);bz=U*U;ai=I+(b_<<4)+8|0;bx=(c[k>>2]=c[ai>>2]|0,c[k+4>>2]=c[ai+4>>2]|0,+h[k>>3]);bA=bx*bx;by=bz+bA;if(by==0.0){a3(P+(b_*72&-1)|0,0,72)}else{p=-0.0-U;ai=T+(b_<<4)+8|0;bH=U*(c[k>>2]=c[ai>>2]|0,c[k+4>>2]=c[ai+4>>2]|0,+h[k>>3]);ai=T+(b_<<4)|0;U=bH-bx*(c[k>>2]=c[ai>>2]|0,c[k+4>>2]=c[ai+4>>2]|0,+h[k>>3]);bH=bA/by;ai=aa+(b_*72&-1)|0;h[k>>3]=bH,c[ai>>2]=c[k>>2]|0,c[ai+4>>2]=c[k+4>>2]|0;bH=bx*p/by;ai=aa+(b_*72&-1)+8|0;h[k>>3]=bH,c[ai>>2]=c[k>>2]|0,c[ai+4>>2]=c[k+4>>2]|0;bA=bx*U/by;ai=aa+(b_*72&-1)+16|0;h[k>>3]=bA,c[ai>>2]=c[k>>2]|0,c[ai+4>>2]=c[k+4>>2]|0;ai=aa+(b_*72&-1)+24|0;h[k>>3]=bH,c[ai>>2]=c[k>>2]|0,c[ai+4>>2]=c[k+4>>2]|0;bH=bz/by;ai=aa+(b_*72&-1)+32|0;h[k>>3]=bH,c[ai>>2]=c[k>>2]|0,c[ai+4>>2]=c[k+4>>2]|0;bH=U*p/by;ai=aa+(b_*72&-1)+40|0;h[k>>3]=bH,c[ai>>2]=c[k>>2]|0,c[ai+4>>2]=c[k+4>>2]|0;ai=aa+(b_*72&-1)+48|0;h[k>>3]=bA,c[ai>>2]=c[k>>2]|0,c[ai+4>>2]=c[k+4>>2]|0;ai=aa+(b_*72&-1)+56|0;h[k>>3]=bH,c[ai>>2]=c[k>>2]|0,c[ai+4>>2]=c[k+4>>2]|0;bH=U*U/by;ai=aa+(b_*72&-1)+64|0;h[k>>3]=bH,c[ai>>2]=c[k>>2]|0,c[ai+4>>2]=c[k+4>>2]|0}ai=b_+1|0;if((ai|0)==(J|0)){break}else{b_=ai}}ai=J-1|0;bH=+(H|0);ak=N+48|0;by=+(ay|0);ag=0;while(1){aq=c[S+(ag<<2)>>2]|0;U=+((c[af+(aq<<3)>>2]|0)-H|0);bA=+((c[af+(aq<<3)+4>>2]|0)-ay|0);aq=ag-1|0;do{if((aq|0)<(J|0)){if((ag|0)>0){b$=aq;break}b$=ai-(-ag|0)%(J|0)|0}else{b$=(aq|0)%(J|0)}}while(0);aq=aa+(b$*72&-1)|0;p=(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(ag*72&-1)|0;bz=p+(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(b$*72&-1)+8|0;p=(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(ag*72&-1)+8|0;bx=p+(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(b$*72&-1)+16|0;p=(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(ag*72&-1)+16|0;b0=p+(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(b$*72&-1)+24|0;p=(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(ag*72&-1)+24|0;b1=p+(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(b$*72&-1)+32|0;p=(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(ag*72&-1)+32|0;b2=p+(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(b$*72&-1)+40|0;p=(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(ag*72&-1)+40|0;b3=p+(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(b$*72&-1)+48|0;p=(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(ag*72&-1)+48|0;b4=p+(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(b$*72&-1)+56|0;p=(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(ag*72&-1)+56|0;b5=p+(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(b$*72&-1)+64|0;p=(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);aq=aa+(ag*72&-1)+64|0;b6=p+(c[k>>2]=c[aq>>2]|0,c[k+4>>2]=c[aq+4>>2]|0,+h[k>>3]);a_(0);p=bz*b2-bx*b1;L268:do{if(p!=0.0){b7=p;b8=b0;b9=b3;ca=bz;cb=bx;cc=b1;cd=b2;ce=b4;cf=b5;cg=b6}else{ch=bz;ci=b2;cj=bx;ck=b0;cl=b1;cm=b3;cn=b4;co=b5;cp=b6;while(1){do{if(ch>ci){cq=-0.0-cj;cr=ch}else{if(ci==0.0){cq=1.0;cr=0.0;break}cq=-0.0-ci;cr=cl}}while(0);cs=cq*cq;ct=cr*cr;cu=ct+cs;cv=bA*(-0.0-cr)-U*cq;cw=ch+cs/cu;cs=cr*cq/cu;cx=cj+cs;cy=cq*cv/cu;cz=ck+cy;cA=cl+cs;cs=ci+ct/cu;ct=cr*cv/cu;cB=cm+ct;cC=cn+cy;cy=co+ct;ct=cp+cv*cv/cu;a_(0);cu=cw*cs-cx*cA;if(cu!=0.0){b7=cu;b8=cz;b9=cB;ca=cw;cb=cx;cc=cA;cd=cs;ce=cC;cf=cy;cg=ct;break L268}else{ch=cw;ci=cs;cj=cx;ck=cz;cl=cA;cm=cB;cn=cC;co=cy;cp=ct}}}}while(0);b6=(cb*b9+cd*(-0.0-b8))/b7;b5=(cc*b8-ca*b9)/b7;do{if(+K(+(b6-U))>.5){m=199}else{if(+K(+(b5-bA))>.5){m=199;break}b4=bH+b6;aq=(c[ak>>2]|0)+(ag<<4)|0;h[k>>3]=b4,c[aq>>2]=c[k>>2]|0,c[aq+4>>2]=c[k+4>>2]|0;b4=by+b5;aq=(c[ak>>2]|0)+(ag<<4)+8|0;h[k>>3]=b4,c[aq>>2]=c[k>>2]|0,c[aq+4>>2]=c[k+4>>2]|0;break}}while(0);if((m|0)==199){m=0;b5=cg+(bA*cf+(U*ce+(bA*b9+(bA*bA*cd+(U*bA*cc+(U*b8+(bA*U*cb+(U*U*ca+0.0))))))));if(ca==0.0){cD=bA;cE=U;cF=b5}else{b6=bA+-.5;b4=b6+0.0;b3=(-0.0-(b4*cb+b8))/ca;b1=cg+(b4*cf+(ce*b3+(b4*b9+(b4*b4*cd+(b4*cc*b3+(b8*b3+(b4*cb*b3+(b3*ca*b3+0.0))))))));aq=+K(+(b3-U))<=.5&b1<b5;b0=aq?b1:b5;b5=b6+1.0;b6=(-0.0-(b5*cb+b8))/ca;b1=cg+(b5*cf+(ce*b6+(b5*b9+(b5*b5*cd+(b5*cc*b6+(b8*b6+(b5*cb*b6+(b6*ca*b6+0.0))))))));$=+K(+(b6-U))<=.5&b1<b0;cD=$?b5:aq?b4:bA;cE=$?b6:aq?b3:U;cF=$?b1:b0}b0=U+-.5;b1=b0+0.0;if(cd==0.0){b3=b0+1.0;cG=cD;cH=cE;cI=cF;cJ=b1*b1*ca+0.0;cK=b1*cb;cL=b1*b8;cM=b1*ce;cN=b3;cO=b3*b3*ca+0.0;cP=b3*cb;cQ=b3*b8;cR=b3*ce}else{b3=(-0.0-(b1*cc+b9))/cd;b6=b1*b1*ca+0.0;b4=b1*cb;b5=b1*b8;bx=b1*ce;b2=cg+(cf*b3+(bx+(b9*b3+(b3*cd*b3+(b1*cc*b3+(b5+(b6+b4*b3)))))));$=+K(+(b3-bA))<=.5&b2<cF;bz=$?b2:cF;b2=b0+1.0;b0=(-0.0-(b2*cc+b9))/cd;p=b2*b2*ca+0.0;cp=b2*cb;co=b2*b8;cn=b2*ce;cm=cg+(cf*b0+(cn+(b9*b0+(b0*cd*b0+(b2*cc*b0+(co+(p+cp*b0)))))));aq=+K(+(b0-bA))<=.5&cm<bz;cG=aq?b0:$?b3:cD;cH=aq?b2:$?b1:cE;cI=aq?cm:bz;cJ=b6;cK=b4;cL=b5;cM=bx;cN=b2;cO=p;cP=cp;cQ=co;cR=cn}cn=bA+-.5;co=cn+0.0;cp=cn+1.0;cn=cp*cf;p=co*cc;b2=co*co*cd;bx=co*b9;b5=co*cf;b4=cg+(b5+(cM+(bx+(b2+(b1*p+(cL+(cJ+co*cK)))))));aq=b4<cI;b6=aq?b4:cI;b4=cp*cc;bz=cp*cp*cd;cm=cp*b9;b3=cg+(cn+(cM+(cm+(bz+(b1*b4+(cL+(cJ+cp*cK)))))));$=b3<b6;b0=$?b3:b6;b6=cg+(b5+(cR+(bx+(b2+(cQ+(cO+co*cP)+p*cN)))));aA=b6<b0;aE=cg+(cn+(cR+(cm+(bz+(cQ+(cO+cp*cP)+b4*cN)))))<(aA?b6:b0);b0=aE?cp:aA?co:$?cp:aq?co:cG;co=bH+(aE?cN:aA?cN:$?b1:aq?b1:cH);aq=(c[ak>>2]|0)+(ag<<4)|0;h[k>>3]=co,c[aq>>2]=c[k>>2]|0,c[aq+4>>2]=c[k+4>>2]|0;co=by+b0;aq=(c[ak>>2]|0)+(ag<<4)+8|0;h[k>>3]=co,c[aq>>2]=c[k>>2]|0,c[aq+4>>2]=c[k+4>>2]|0}aq=ag+1|0;if((aq|0)==(J|0)){break L217}else{ag=aq}}}}while(0);a_(Y);a_(_);a_(P);L291:do{if((c[E+4>>2]|0)==45){J=c[F>>2]|0;aa=(c[J+32>>2]|0)-1|0;if((aa|0)<=0){break}ay=J+48|0;J=0;af=aa;while(1){aa=c[ay>>2]|0;H=aa+(J<<4)|0;a4(u|0,H|0,16);a4(H|0,aa+(af<<4)|0,16);a4((c[ay>>2]|0)+(af<<4)|0,u|0,16);aa=J+1|0;H=af-1|0;if((aa|0)<(H|0)){J=aa;af=H}else{break L291}}}}while(0);P=c[F>>2]|0;by=(c[k>>2]=c[v>>2]|0,c[k+4>>2]=c[v+4>>2]|0,+h[k>>3]);_=c[P+32>>2]|0;L297:do{if((_|0)>0){Y=_-1|0;af=P+48|0;J=P+56|0;ay=P+36|0;H=P+40|0;aa=P+52|0;S=P+60|0;N=0;while(1){T=N+1|0;if((T|0)<(_|0)){cS=T}else{cS=(T|0)==(_|0)?0:T}I=N+2|0;do{if((I|0)<(_|0)){if((I|0)>-1){cT=I;break}cT=Y-(-3-N|0)%(_|0)|0}else{cT=(I|0)%(_|0)}}while(0);I=c[af>>2]|0;Q=I+(cT<<4)|0;bA=(c[k>>2]=c[Q>>2]|0,c[k+4>>2]=c[Q+4>>2]|0,+h[k>>3]);Q=I+(cT<<4)+8|0;U=(c[k>>2]=c[Q>>2]|0,c[k+4>>2]=c[Q+4>>2]|0,+h[k>>3]);Q=I+(cS<<4)|0;bH=(c[k>>2]=c[Q>>2]|0,c[k+4>>2]=c[Q+4>>2]|0,+h[k>>3]);Q=I+(cS<<4)+8|0;co=(c[k>>2]=c[Q>>2]|0,c[k+4>>2]=c[Q+4>>2]|0,+h[k>>3]);b0=bA+(bH-bA)*.5;b1=U+(co-U)*.5;Q=I+(N<<4)|0;cp=(c[k>>2]=c[Q>>2]|0,c[k+4>>2]=c[Q+4>>2]|0,+h[k>>3]);Q=I+(N<<4)+8|0;b6=(c[k>>2]=c[Q>>2]|0,c[k+4>>2]=c[Q+4>>2]|0,+h[k>>3]);b4=bA-cp;if(b4>0.0){cU=1.0}else{cU=+((b4<0.0)<<31>>31|0)}bA=U-b6;if(bA>0.0){cV=1}else{cV=(bA<0.0)<<31>>31}U=b4*cU-bA*+(-cV|0);if(U!=0.0){bz=+K(+(((bH-cp)*bA-b4*(co-b6))/U));if(bz>1.0){cW=1.0-1.0/bz}else{cW=0.0}cX=cW/.75}else{cX=1.3333333333333333}Q=(c[J>>2]|0)+(cS<<3)|0;h[k>>3]=cX,c[Q>>2]=c[k>>2]|0,c[Q+4>>2]=c[k+4>>2]|0;if(cX<by){do{if(cX<.55){cY=.55}else{if(cX<=1.0){cY=cX;break}cY=1.0}}while(0);bz=cY*.5+.5;Q=c[af>>2]|0;I=Q+(N<<4)|0;U=(c[k>>2]=c[I>>2]|0,c[k+4>>2]=c[I+4>>2]|0,+h[k>>3]);I=Q+(N<<4)+8|0;b6=(c[k>>2]=c[I>>2]|0,c[k+4>>2]=c[I+4>>2]|0,+h[k>>3]);I=Q+(cS<<4)|0;co=(c[k>>2]=c[I>>2]|0,c[k+4>>2]=c[I+4>>2]|0,+h[k>>3]);I=Q+(cS<<4)+8|0;b4=(c[k>>2]=c[I>>2]|0,c[k+4>>2]=c[I+4>>2]|0,+h[k>>3]);bA=U+bz*(co-U);U=b6+bz*(b4-b6);I=Q+(cT<<4)|0;b6=(c[k>>2]=c[I>>2]|0,c[k+4>>2]=c[I+4>>2]|0,+h[k>>3]);I=Q+(cT<<4)+8|0;cp=(c[k>>2]=c[I>>2]|0,c[k+4>>2]=c[I+4>>2]|0,+h[k>>3]);bH=b6+bz*(co-b6);b6=cp+bz*(b4-cp);c[(c[ay>>2]|0)+(cS<<2)>>2]=1;I=c[H>>2]|0;Q=I+(cS*48&-1)|0;h[k>>3]=bA,c[Q>>2]=c[k>>2]|0,c[Q+4>>2]=c[k+4>>2]|0;Q=I+(cS*48&-1)+8|0;h[k>>3]=U,c[Q>>2]=c[k>>2]|0,c[Q+4>>2]=c[k+4>>2]|0;Q=c[H>>2]|0;I=Q+(cS*48&-1)+16|0;h[k>>3]=bH,c[I>>2]=c[k>>2]|0,c[I+4>>2]=c[k+4>>2]|0;I=Q+(cS*48&-1)+24|0;h[k>>3]=b6,c[I>>2]=c[k>>2]|0,c[I+4>>2]=c[k+4>>2]|0;I=c[H>>2]|0;Q=I+(cS*48&-1)+32|0;h[k>>3]=b0,c[Q>>2]=c[k>>2]|0,c[Q+4>>2]=c[k+4>>2]|0;Q=I+(cS*48&-1)+40|0;h[k>>3]=b1,c[Q>>2]=c[k>>2]|0,c[Q+4>>2]=c[k+4>>2]|0;cZ=cY}else{c[(c[ay>>2]|0)+(cS<<2)>>2]=2;a4((c[H>>2]|0)+(cS*48&-1)+16|0,(c[af>>2]|0)+(cS<<4)|0,16);Q=c[H>>2]|0;I=Q+(cS*48&-1)+32|0;h[k>>3]=b0,c[I>>2]=c[k>>2]|0,c[I+4>>2]=c[k+4>>2]|0;I=Q+(cS*48&-1)+40|0;h[k>>3]=b1,c[I>>2]=c[k>>2]|0,c[I+4>>2]=c[k+4>>2]|0;cZ=cX}I=(c[aa>>2]|0)+(cS<<3)|0;h[k>>3]=cZ,c[I>>2]=c[k>>2]|0,c[I+4>>2]=c[k+4>>2]|0;I=(c[S>>2]|0)+(cS<<3)|0;h[k>>3]=.5,c[I>>2]=c[k>>2]|0,c[I+4>>2]=c[k+4>>2]|0;if((T|0)==(_|0)){break L297}else{N=T}}}}while(0);c[P+44>>2]=1;_=c[F>>2]|0;if((c[w>>2]|0)==0){c[_+96>>2]=_+32|0}else{by=(c[k>>2]=c[D>>2]|0,c[k+4>>2]=c[D+4>>2]|0,+h[k>>3]);N=_+32|0;S=c[N>>2]|0;aa=S+1|0;H=aa<<2;af=aZ(H)|0;ay=af;if((af|0)==0){c_=0;c$=0;c0=0;c1=0;c2=0;c3=0;c4=0;c5=0;m=386;break}J=aa<<3;Y=aZ(J)|0;I=Y;if((Y|0)==0){c_=0;c$=0;c0=0;c1=0;c2=I;c3=0;c4=0;c5=af;m=386;break}Q=aZ(H)|0;H=Q;if((Q|0)==0){c_=0;c$=0;c0=0;c1=0;c2=I;c3=H;c4=0;c5=af;m=386;break}ap=aZ(aa<<6)|0;am=ap;if((ap|0)==0){c_=0;c$=0;c0=0;c1=0;c2=I;c3=H;c4=am;c5=af;m=386;break}az=aZ(S<<2)|0;ah=az;if((az|0)==0){c_=0;c$=ah;c0=0;c1=0;c2=I;c3=H;c4=am;c5=af;m=386;break}R=aZ(J)|0;J=R;if((R|0)==0){c_=J;c$=ah;c0=0;c1=0;c2=I;c3=H;c4=am;c5=af;m=386;break}L338:do{if((S|0)>0){G=_+36|0;O=S-1|0;ag=_+48|0;ak=0;while(1){if((c[(c[G>>2]|0)+(ak<<2)>>2]|0)==1){ai=ak-1|0;aq=(ai|0)<(S|0);do{if(aq){if((ak|0)>0){c6=ai;break}c6=O-(-ak|0)%(S|0)|0}else{c6=(ai|0)%(S|0)}}while(0);T=c[ag>>2]|0;$=ak+1|0;aA=($|0)<(S|0);if(aA){c7=$}else{c7=($|0)==(S|0)?0:$}aE=T+(c6<<4)|0;b1=(c[k>>2]=c[aE>>2]|0,c[k+4>>2]=c[aE+4>>2]|0,+h[k>>3]);aE=T+(c6<<4)+8|0;b0=(c[k>>2]=c[aE>>2]|0,c[k+4>>2]=c[aE+4>>2]|0,+h[k>>3]);aE=T+(ak<<4)|0;b6=(c[k>>2]=c[aE>>2]|0,c[k+4>>2]=c[aE+4>>2]|0,+h[k>>3]);aE=T+(ak<<4)+8|0;bH=(c[k>>2]=c[aE>>2]|0,c[k+4>>2]=c[aE+4>>2]|0,+h[k>>3]);aE=T+(c7<<4)|0;U=(c[k>>2]=c[aE>>2]|0,c[k+4>>2]=c[aE+4>>2]|0,+h[k>>3]);aE=T+(c7<<4)+8|0;if((b6-b1)*((c[k>>2]=c[aE>>2]|0,c[k+4>>2]=c[aE+4>>2]|0,+h[k>>3])-b0)-(bH-b0)*(U-b1)>0.0){c8=1}else{do{if(aq){if((ak|0)>0){c9=ai;break}c9=O-(-ak|0)%(S|0)|0}else{c9=(ai|0)%(S|0)}}while(0);if(aA){da=$}else{da=($|0)==(S|0)?0:$}ai=T+(c9<<4)|0;b1=(c[k>>2]=c[ai>>2]|0,c[k+4>>2]=c[ai+4>>2]|0,+h[k>>3]);ai=T+(c9<<4)+8|0;U=(c[k>>2]=c[ai>>2]|0,c[k+4>>2]=c[ai+4>>2]|0,+h[k>>3]);ai=T+(da<<4)|0;b0=(c[k>>2]=c[ai>>2]|0,c[k+4>>2]=c[ai+4>>2]|0,+h[k>>3]);ai=T+(da<<4)+8|0;c8=((b6-b1)*((c[k>>2]=c[ai>>2]|0,c[k+4>>2]=c[ai+4>>2]|0,+h[k>>3])-U)-(bH-U)*(b0-b1)<0.0)<<31>>31}c[ah+(ak<<2)>>2]=c8;db=$}else{c[ah+(ak<<2)>>2]=0;db=ak+1|0}if((db|0)==(S|0)){break}else{ak=db}}h[k>>3]=0.0,c[J>>2]=c[k>>2]|0,c[J+4>>2]=c[k+4>>2]|0;ak=c[ag>>2]|0;O=ak|0;b1=(c[k>>2]=c[O>>2]|0,c[k+4>>2]=c[O+4>>2]|0,+h[k>>3]);O=ak+8|0;b0=(c[k>>2]=c[O>>2]|0,c[k+4>>2]=c[O+4>>2]|0,+h[k>>3]);O=_+52|0;ak=_+40|0;ai=0;U=0.0;while(1){aq=ai+1|0;if((aq|0)<(S|0)){dc=aq}else{dc=(aq|0)==(S|0)?0:aq}if((c[(c[G>>2]|0)+(dc<<2)>>2]|0)==1){aE=(c[O>>2]|0)+(dc<<3)|0;bA=(c[k>>2]=c[aE>>2]|0,c[k+4>>2]=c[aE+4>>2]|0,+h[k>>3]);aE=c[ak>>2]|0;aj=c[ag>>2]|0;bo=aE+(ai*48&-1)+32|0;cp=(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(ai*48&-1)+40|0;b4=(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aj+(dc<<4)|0;bz=(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aj+(dc<<4)+8|0;co=(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(dc*48&-1)+32|0;cm=(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=aE+(dc*48&-1)+40|0;cn=(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);dd=((cp-b1)*(cn-b0)-(b4-b0)*(cm-b1))*.5+(U+bA*.3*(4.0-bA)*((bz-cp)*(cn-b4)-(co-b4)*(cm-cp))*.5)}else{dd=U}bo=J+(aq<<3)|0;h[k>>3]=dd,c[bo>>2]=c[k>>2]|0,c[bo+4>>2]=c[k+4>>2]|0;if((aq|0)==(S|0)){de=ag;break L338}else{ai=aq;U=dd}}}else{ai=_+48|0;h[k>>3]=0.0,c[J>>2]=c[k>>2]|0,c[J+4>>2]=c[k+4>>2]|0;de=ai}}while(0);c[ay>>2]=-1;h[k>>3]=0.0,c[I>>2]=c[k>>2]|0,c[I+4>>2]=c[k+4>>2]|0;c[H>>2]=0;L376:do{if((S|0)>=1){P=_+40|0;ai=_+52|0;ag=1;while(1){ak=ag-1|0;O=ay+(ag<<2)|0;c[O>>2]=ak;G=I+(ak<<3)|0;U=(c[k>>2]=c[G>>2]|0,c[k+4>>2]=c[G+4>>2]|0,+h[k>>3]);G=I+(ag<<3)|0;h[k>>3]=U,c[G>>2]=c[k>>2]|0,c[G+4>>2]=c[k+4>>2]|0;aq=H+(ag<<2)|0;c[aq>>2]=(c[H+(ak<<2)>>2]|0)+1|0;ak=ag-2|0;L380:do{if((ak|0)>-1){bo=(ag|0)<(S|0);aE=am+(ag<<6)|0;aj=am+(ag<<6)+8|0;ae=am+(ag<<6)+16|0;bs=am+(ag<<6)+24|0;bp=am+(ag<<6)+32|0;aD=am+(ag<<6)+40|0;bt=am+(ag<<6)+48|0;bv=am+(ag<<6)+56|0;bq=(ag|0)==(S|0)?0:ag;br=ak;while(1){bu=bo?ag:bq;bw=c[N>>2]|0;if((br|0)==(bu|0)){break L380}df=br+1|0;dg=(df|0)<(bw|0);do{if(dg){if((df|0)>-1){dh=df;break}dh=(bw-1|0)-(-2-br|0)%(bw|0)|0}else{dh=(df|0)%(bw|0)}}while(0);di=c[ah+(dh<<2)>>2]|0;if((di|0)==0){break L380}dj=c[de>>2]|0;dk=dj+(br<<4)|0;U=(c[k>>2]=c[dk>>2]|0,c[k+4>>2]=c[dk+4>>2]|0,+h[k>>3]);dk=dj+(br<<4)+8|0;b1=(c[k>>2]=c[dk>>2]|0,c[k+4>>2]=c[dk+4>>2]|0,+h[k>>3]);dk=dj+(dh<<4)|0;b0=(c[k>>2]=c[dk>>2]|0,c[k+4>>2]=c[dk+4>>2]|0,+h[k>>3]);dk=dj+(dh<<4)+8|0;cp=(c[k>>2]=c[dk>>2]|0,c[k+4>>2]=c[dk+4>>2]|0,+h[k>>3]);cm=U-b0;b4=b1-cp;co=+L(+(cm*cm+b4*b4));dk=bw-1|0;b4=b0-U;U=cp-b1;dl=dh;while(1){if((dl|0)==(bu|0)){break}dm=dl+1|0;do{if((dm|0)<(bw|0)){if((dm|0)>-1){dn=dm;break}dn=dk-(-2-dl|0)%(bw|0)|0}else{dn=(dm|0)%(bw|0)}}while(0);dm=dl+2|0;do{if((dm|0)<(bw|0)){if((dm|0)>-1){dp=dm;break}dp=dk-(-3-dl|0)%(bw|0)|0}else{dp=(dm|0)%(bw|0)}}while(0);if((c[ah+(dn<<2)>>2]|0)!=(di|0)){break L380}dm=dj+(dn<<4)|0;b1=(c[k>>2]=c[dm>>2]|0,c[k+4>>2]=c[dm+4>>2]|0,+h[k>>3]);dm=dj+(dn<<4)+8|0;cp=(c[k>>2]=c[dm>>2]|0,c[k+4>>2]=c[dm+4>>2]|0,+h[k>>3]);dm=dj+(dp<<4)|0;b0=(c[k>>2]=c[dm>>2]|0,c[k+4>>2]=c[dm+4>>2]|0,+h[k>>3]);dm=dj+(dp<<4)+8|0;cm=(c[k>>2]=c[dm>>2]|0,c[k+4>>2]=c[dm+4>>2]|0,+h[k>>3]);cn=b0-b1;bz=cm-cp;bA=b4*bz-U*cn;if(bA>0.0){dq=1}else{dq=(bA<0.0)<<31>>31}if((dq|0)!=(di|0)){break L380}bA=b1-b0;b0=cp-cm;if(b4*cn+U*bz<co*+L(+(bA*bA+b0*b0))*-.999847695156){break L380}else{dl=dn}}if((bw|0)>(br|0)){dr=br}else{dr=(br|0)%(bw|0)}dl=c[P>>2]|0;di=dl+(dr*48&-1)+32|0;co=(c[k>>2]=c[di>>2]|0,c[k+4>>2]=c[di+4>>2]|0,+h[k>>3]);di=dl+(dr*48&-1)+40|0;U=(c[k>>2]=c[di>>2]|0,c[k+4>>2]=c[di+4>>2]|0,+h[k>>3]);do{if(dg){if((df|0)>-1){ds=df;break}ds=dk-(-2-br|0)%(bw|0)|0}else{ds=(df|0)%(bw|0)}}while(0);di=dj+(ds<<4)|0;b4=(c[k>>2]=c[di>>2]|0,c[k+4>>2]=c[di+4>>2]|0,+h[k>>3]);di=dj+(ds<<4)+8|0;b0=(c[k>>2]=c[di>>2]|0,c[k+4>>2]=c[di+4>>2]|0,+h[k>>3]);do{if((bw|0)>(bu|0)){if((bu|0)>-1){dt=bu;du=dj+(bu<<4)|0;dv=dj+(bu<<4)+8|0;break}else{di=dk-(bu^-1|0)%(bw|0)|0;dt=di;du=dj+(di<<4)|0;dv=dj+(di<<4)+8|0;break}}else{di=(bu|0)%(bw|0);dt=di;du=dj+(di<<4)|0;dv=dj+(di<<4)+8|0}}while(0);bA=(c[k>>2]=c[du>>2]|0,c[k+4>>2]=c[du+4>>2]|0,+h[k>>3]);bz=(c[k>>2]=c[dv>>2]|0,c[k+4>>2]=c[dv+4>>2]|0,+h[k>>3]);di=dl+(dt*48&-1)+32|0;cn=(c[k>>2]=c[di>>2]|0,c[k+4>>2]=c[di+4>>2]|0,+h[k>>3]);di=dl+(dt*48&-1)+40|0;cm=(c[k>>2]=c[di>>2]|0,c[k+4>>2]=c[di+4>>2]|0,+h[k>>3]);di=J+(bu<<3)|0;cp=(c[k>>2]=c[di>>2]|0,c[k+4>>2]=c[di+4>>2]|0,+h[k>>3]);di=J+(br<<3)|0;b1=cp-(c[k>>2]=c[di>>2]|0,c[k+4>>2]=c[di+4>>2]|0,+h[k>>3]);di=dj|0;cp=(c[k>>2]=c[di>>2]|0,c[k+4>>2]=c[di+4>>2]|0,+h[k>>3]);di=dj+8|0;p=(c[k>>2]=c[di>>2]|0,c[k+4>>2]=c[di+4>>2]|0,+h[k>>3]);di=dl+(br*48&-1)+32|0;b2=(c[k>>2]=c[di>>2]|0,c[k+4>>2]=c[di+4>>2]|0,+h[k>>3]);di=dl+(br*48&-1)+40|0;bx=(c[k>>2]=c[di>>2]|0,c[k+4>>2]=c[di+4>>2]|0,+h[k>>3]);di=dl+(bu*48&-1)+32|0;b5=(c[k>>2]=c[di>>2]|0,c[k+4>>2]=c[di+4>>2]|0,+h[k>>3]);di=dl+(bu*48&-1)+40|0;b3=b1-((b2-cp)*((c[k>>2]=c[di>>2]|0,c[k+4>>2]=c[di+4>>2]|0,+h[k>>3])-p)-(bx-p)*(b5-cp))*.5;if((br|0)<(bu|0)){dw=b3}else{di=J+(bw<<3)|0;dw=b3+(c[k>>2]=c[di>>2]|0,c[k+4>>2]=c[di+4>>2]|0,+h[k>>3])}b3=b4-co;cp=b0-U;b5=bA-co;p=bz-U;b1=b3*p-cp*b5;cl=cn-co;ck=cm-U;cj=b3*ck-cp*cl;ci=b5*ck-p*cl;if(cj==b1){break L380}cl=ci/(ci-(b1+ci-cj));ci=cj/(cj-b1);b1=cj*cl*.5;if(b1==0.0){break L380}cj=2.0- +L(+(4.0-dw/b1/.3));b1=cl*cj;p=co+b3*b1;b3=U+cp*b1;b1=ci*cj;cp=cn+(bA-cn)*b1;bA=cm+(bz-cm)*b1;do{if(dg){if((df|0)>-1){dx=df;break}dx=dk-(-2-br|0)%(bw|0)|0}else{dx=(df|0)%(bw|0)}}while(0);b0=p-co;b4=b3-U;b1=cp-p;bz=bA-b3;ck=cn-cp;b5=cm-bA;L435:do{if((dx|0)==(bu|0)){dy=br;dz=0.0;dA=b2;dB=bx}else{df=dx;ch=0.0;while(1){dg=df+1|0;do{if((dg|0)<(bw|0)){if((dg|0)>-1){dC=dg;break}dC=dk-(-2-df|0)%(bw|0)|0}else{dC=(dg|0)%(bw|0)}}while(0);dg=dj+(df<<4)|0;ct=(c[k>>2]=c[dg>>2]|0,c[k+4>>2]=c[dg+4>>2]|0,+h[k>>3]);dg=dj+(df<<4)+8|0;cy=(c[k>>2]=c[dg>>2]|0,c[k+4>>2]=c[dg+4>>2]|0,+h[k>>3]);dg=dj+(dC<<4)|0;cC=(c[k>>2]=c[dg>>2]|0,c[k+4>>2]=c[dg+4>>2]|0,+h[k>>3]);dg=dj+(dC<<4)+8|0;cB=(c[k>>2]=c[dg>>2]|0,c[k+4>>2]=c[dg+4>>2]|0,+h[k>>3]);cA=cC-ct;cz=cB-cy;cx=b0*cz-b4*cA;cs=(b1*cz-bz*cA)*2.0;cw=ck*cz-b5*cA+(cx-cs);cu=cx*-2.0+cs;cs=cu*cu-cx*cw*4.0;if(cw==0.0|cs<0.0){break L380}cx=+L(+cs);cs=cw*2.0;cw=(cx-cu)/cs;cv=(-0.0-cu-cx)/cs;if(cw>=0.0&cw<=1.0){dD=cw}else{dD=cv>=0.0&cv<=1.0?cv:-1.0}if(dD<-.5){break L380}cv=1.0-dD;cw=cv*cv;cs=cv*cw;cx=dD*cw*3.0;cw=dD*dD;cu=cw*cv*3.0;cv=dD*cw;cw=cn*cv+(cp*cu+(co*cs+p*cx));dE=cm*cv+(bA*cu+(U*cs+b3*cx));cx=ct-cC;cs=cy-cB;cu=+L(+(cx*cx+cs*cs));if(cu==0.0){break L380}cv=cw-ct;ct=dE-cy;cy=(cA*ct-cz*cv)/cu;if(+K(+cy)>by){break L380}if(cA*cv+cz*ct<0.0){break L380}if(cx*(cw-cC)+cs*(dE-cB)<0.0){break L380}cB=ch+cy*cy;if((dC|0)==(bu|0)){dy=br;dz=cB;dA=b2;dB=bx;break L435}else{df=dC;ch=cB}}}}while(0);while(1){df=dy+1|0;do{if((df|0)<(bw|0)){if((df|0)>-1){dF=df;break}dF=dk-(-2-dy|0)%(bw|0)|0}else{dF=(df|0)%(bw|0)}}while(0);df=dl+(dF*48&-1)+32|0;bx=(c[k>>2]=c[df>>2]|0,c[k+4>>2]=c[df+4>>2]|0,+h[k>>3]);df=dl+(dF*48&-1)+40|0;b2=(c[k>>2]=c[df>>2]|0,c[k+4>>2]=c[df+4>>2]|0,+h[k>>3]);ch=bx-dA;cB=b2-dB;cy=b0*cB-b4*ch;dE=(b1*cB-bz*ch)*2.0;cs=ck*cB-b5*ch+(cy-dE);cC=cy*-2.0+dE;dE=cC*cC-cy*cs*4.0;if(cs==0.0|dE<0.0){break L380}cy=+L(+dE);dE=cs*2.0;cs=(cy-cC)/dE;cw=(-0.0-cC-cy)/dE;if(cs>=0.0&cs<=1.0){dG=cs}else{dG=cw>=0.0&cw<=1.0?cw:-1.0}if(dG<-.5){break L380}cw=1.0-dG;cs=cw*cw;dE=cw*cs;cy=dG*cs*3.0;cs=dG*dG;cC=cs*cw*3.0;cw=dG*cs;cs=dA-bx;cx=dB-b2;ct=+L(+(cs*cs+cx*cx));if(ct==0.0){break L380}cx=(ch*(cm*cw+(bA*cC+(U*dE+b3*cy))-dB)-cB*(cn*cw+(cp*cC+(co*dE+p*cy))-dA))/ct;df=dj+(dF<<4)|0;cy=(c[k>>2]=c[df>>2]|0,c[k+4>>2]=c[df+4>>2]|0,+h[k>>3]);df=dj+(dF<<4)+8|0;dE=(ch*((c[k>>2]=c[df>>2]|0,c[k+4>>2]=c[df+4>>2]|0,+h[k>>3])-dB)-cB*(cy-dA))/ct;df=(c[ai>>2]|0)+(dF<<3)|0;ct=dE*(c[k>>2]=c[df>>2]|0,c[k+4>>2]=c[df+4>>2]|0,+h[k>>3])*.75;if(ct<0.0){dH=-0.0-cx;dI=-0.0-ct}else{dH=cx;dI=ct}if(dH<dI-by){break L380}if(dH<dI){ct=dH-dI;dJ=dz+ct*ct}else{dJ=dz}if((dF|0)==(bu|0)){break}else{dy=dF;dz=dJ;dA=bx;dB=b2}}bu=c[aq>>2]|0;dj=H+(br<<2)|0;dl=(c[dj>>2]|0)+1|0;do{if((bu|0)>(dl|0)){dK=I+(br<<3)|0;m=345;break}else{if((bu|0)!=(dl|0)){break}co=(c[k>>2]=c[G>>2]|0,c[k+4>>2]=c[G+4>>2]|0,+h[k>>3]);bw=I+(br<<3)|0;if(co>dJ+(c[k>>2]=c[bw>>2]|0,c[k+4>>2]=c[bw+4>>2]|0,+h[k>>3])){dK=bw;m=345;break}else{break}}}while(0);if((m|0)==345){m=0;c[O>>2]=br;co=dJ+(c[k>>2]=c[dK>>2]|0,c[k+4>>2]=c[dK+4>>2]|0,+h[k>>3]);h[k>>3]=co,c[G>>2]=c[k>>2]|0,c[G+4>>2]=c[k+4>>2]|0;c[aq>>2]=(c[dj>>2]|0)+1|0;h[k>>3]=dJ,c[aE>>2]=c[k>>2]|0,c[aE+4>>2]=c[k+4>>2]|0;h[k>>3]=p,c[aj>>2]=c[k>>2]|0,c[aj+4>>2]=c[k+4>>2]|0;h[k>>3]=b3,c[ae>>2]=c[k>>2]|0,c[ae+4>>2]=c[k+4>>2]|0;h[k>>3]=cp,c[bs>>2]=c[k>>2]|0,c[bs+4>>2]=c[k+4>>2]|0;h[k>>3]=bA,c[bp>>2]=c[k>>2]|0,c[bp+4>>2]=c[k+4>>2]|0;h[k>>3]=cl,c[aD>>2]=c[k>>2]|0,c[aD+4>>2]=c[k+4>>2]|0;h[k>>3]=ci,c[bt>>2]=c[k>>2]|0,c[bt+4>>2]=c[k+4>>2]|0;h[k>>3]=cj,c[bv>>2]=c[k>>2]|0,c[bv+4>>2]=c[k+4>>2]|0}if((br|0)>0){br=br-1|0}else{break L380}}}}while(0);aq=ag+1|0;if((aq|0)==(aa|0)){break L376}else{ag=aq}}}}while(0);aa=c[H+(S<<2)>>2]|0;if((aM(_+64|0,aa)|0)!=0){c_=J;c$=ah;c0=0;c1=0;c2=I;c3=H;c4=am;c5=af;m=386;break}N=aa<<3;ag=aZ(N)|0;ai=ag;if((ag|0)==0){c_=J;c$=ah;c0=0;c1=ai;c2=I;c3=H;c4=am;c5=af;m=386;break}P=aZ(N)|0;N=P;if((P|0)==0){c_=J;c$=ah;c0=N;c1=ai;c2=I;c3=H;c4=am;c5=af;m=386;break}L485:do{if((aa|0)>0){aq=S-1|0;G=_+36|0;O=_+68|0;ak=_+72|0;$=_+40|0;T=_+80|0;aA=_+52|0;br=_+84|0;bv=_+56|0;bt=_+88|0;aD=_+60|0;bp=_+92|0;bs=S;ae=aa;while(1){aj=ae-1|0;aE=ay+(bs<<2)|0;if((c[aE>>2]|0)==(bs-1|0)){bq=(bs|0)<(S|0);do{if(bq){if((bs|0)>-1){dL=bs;break}dL=aq-(bs^-1|0)%(S|0)|0}else{dL=(bs|0)%(S|0)}}while(0);c[(c[O>>2]|0)+(aj<<2)>>2]=c[(c[G>>2]|0)+(dL<<2)>>2]|0;bo=(c[ak>>2]|0)+(aj*48&-1)|0;L496:do{if(bq){dl=(bs|0)>-1;if(dl){a4(bo|0,(c[$>>2]|0)+(bs*48&-1)|0,16);a4((c[ak>>2]|0)+(aj*48&-1)+16|0,(c[$>>2]|0)+(bs*48&-1)+16|0,16);dM=bs}else{bu=aq-(bs^-1|0)%(S|0)|0;a4(bo|0,(c[$>>2]|0)+(bu*48&-1)|0,16);a4((c[ak>>2]|0)+(aj*48&-1)+16|0,(c[$>>2]|0)+(bu*48&-1)+16|0,16);dM=bu}a4((c[ak>>2]|0)+(aj*48&-1)+32|0,(c[$>>2]|0)+(dM*48&-1)+32|0,16);bu=(c[T>>2]|0)+(aj<<4)|0;do{if(dl){a4(bu|0,(c[de>>2]|0)+(bs<<4)|0,16);bw=(c[aA>>2]|0)+(bs<<3)|0;by=(c[k>>2]=c[bw>>2]|0,c[k+4>>2]=c[bw+4>>2]|0,+h[k>>3]);bw=(c[br>>2]|0)+(aj<<3)|0;h[k>>3]=by,c[bw>>2]=c[k>>2]|0,c[bw+4>>2]=c[k+4>>2]|0;if(!bq){m=366;break L496}if((bs|0)>-1){bw=(c[bv>>2]|0)+(bs<<3)|0;by=(c[k>>2]=c[bw>>2]|0,c[k+4>>2]=c[bw+4>>2]|0,+h[k>>3]);bw=(c[bt>>2]|0)+(aj<<3)|0;h[k>>3]=by,c[bw>>2]=c[k>>2]|0,c[bw+4>>2]=c[k+4>>2]|0;dN=bs;break L496}else{dO=aq-(bs^-1|0)%(S|0)|0;break}}else{bw=aq-(bs^-1|0)%(S|0)|0;a4(bu|0,(c[de>>2]|0)+(bw<<4)|0,16);dk=(c[aA>>2]|0)+(bw<<3)|0;by=(c[k>>2]=c[dk>>2]|0,c[k+4>>2]=c[dk+4>>2]|0,+h[k>>3]);dk=(c[br>>2]|0)+(aj<<3)|0;h[k>>3]=by,c[dk>>2]=c[k>>2]|0,c[dk+4>>2]=c[k+4>>2]|0;dO=bw}}while(0);bu=(c[bv>>2]|0)+(dO<<3)|0;by=(c[k>>2]=c[bu>>2]|0,c[k+4>>2]=c[bu+4>>2]|0,+h[k>>3]);bu=(c[bt>>2]|0)+(aj<<3)|0;h[k>>3]=by,c[bu>>2]=c[k>>2]|0,c[bu+4>>2]=c[k+4>>2]|0;if(bq){dN=dO;break}dN=(bs|0)%(S|0);break}else{bu=(bs|0)%(S|0);a4(bo|0,(c[$>>2]|0)+(bu*48&-1)|0,16);a4((c[ak>>2]|0)+(aj*48&-1)+16|0,(c[$>>2]|0)+(bu*48&-1)+16|0,16);a4((c[ak>>2]|0)+(aj*48&-1)+32|0,(c[$>>2]|0)+(bu*48&-1)+32|0,16);a4((c[T>>2]|0)+(aj<<4)|0,(c[de>>2]|0)+(bu<<4)|0,16);dl=(c[aA>>2]|0)+(bu<<3)|0;by=(c[k>>2]=c[dl>>2]|0,c[k+4>>2]=c[dl+4>>2]|0,+h[k>>3]);dl=(c[br>>2]|0)+(aj<<3)|0;h[k>>3]=by,c[dl>>2]=c[k>>2]|0,c[dl+4>>2]=c[k+4>>2]|0;m=366;break}}while(0);if((m|0)==366){m=0;bo=(bs|0)%(S|0);bq=(c[bv>>2]|0)+(bo<<3)|0;by=(c[k>>2]=c[bq>>2]|0,c[k+4>>2]=c[bq+4>>2]|0,+h[k>>3]);bq=(c[bt>>2]|0)+(aj<<3)|0;h[k>>3]=by,c[bq>>2]=c[k>>2]|0,c[bq+4>>2]=c[k+4>>2]|0;dN=bo}bo=(c[aD>>2]|0)+(dN<<3)|0;by=(c[k>>2]=c[bo>>2]|0,c[k+4>>2]=c[bo+4>>2]|0,+h[k>>3]);bo=(c[bp>>2]|0)+(aj<<3)|0;h[k>>3]=by,c[bo>>2]=c[k>>2]|0,c[bo+4>>2]=c[k+4>>2]|0;bo=N+(aj<<3)|0;h[k>>3]=1.0,c[bo>>2]=c[k>>2]|0,c[bo+4>>2]=c[k+4>>2]|0;bo=ai+(aj<<3)|0;h[k>>3]=1.0,c[bo>>2]=c[k>>2]|0,c[bo+4>>2]=c[k+4>>2]|0}else{c[(c[O>>2]|0)+(aj<<2)>>2]=1;a4((c[ak>>2]|0)+(aj*48&-1)|0,am+(bs<<6)+8|0,16);a4((c[ak>>2]|0)+(aj*48&-1)+16|0,am+(bs<<6)+24|0,16);bo=(c[ak>>2]|0)+(aj*48&-1)+32|0;bq=(bs|0)<(S|0);do{if(bq){if((bs|0)>-1){dP=bs;break}dP=aq-(bs^-1|0)%(S|0)|0}else{dP=(bs|0)%(S|0)}}while(0);a4(bo|0,(c[$>>2]|0)+(dP*48&-1)+32|0,16);dl=c[T>>2]|0;bu=am+(bs<<6)+48|0;by=(c[k>>2]=c[bu>>2]|0,c[k+4>>2]=c[bu+4>>2]|0,+h[k>>3]);do{if(bq){if((bs|0)>-1){dQ=bs;break}dQ=aq-(bs^-1|0)%(S|0)|0}else{dQ=(bs|0)%(S|0)}}while(0);bq=c[$>>2]|0;bo=c[de>>2]|0;bw=bq+(dQ*48&-1)+32|0;bH=(c[k>>2]=c[bw>>2]|0,c[k+4>>2]=c[bw+4>>2]|0,+h[k>>3]);bw=bq+(dQ*48&-1)+40|0;b6=(c[k>>2]=c[bw>>2]|0,c[k+4>>2]=c[bw+4>>2]|0,+h[k>>3]);bw=bo+(dQ<<4)|0;co=(c[k>>2]=c[bw>>2]|0,c[k+4>>2]=c[bw+4>>2]|0,+h[k>>3]);bw=bo+(dQ<<4)+8|0;cn=bH+by*(co-bH);bH=b6+by*((c[k>>2]=c[bw>>2]|0,c[k+4>>2]=c[bw+4>>2]|0,+h[k>>3])-b6);bw=dl+(aj<<4)|0;h[k>>3]=cn,c[bw>>2]=c[k>>2]|0,c[bw+4>>2]=c[k+4>>2]|0;bw=dl+(aj<<4)+8|0;h[k>>3]=bH,c[bw>>2]=c[k>>2]|0,c[bw+4>>2]=c[k+4>>2]|0;bw=am+(bs<<6)+56|0;bH=(c[k>>2]=c[bw>>2]|0,c[k+4>>2]=c[bw+4>>2]|0,+h[k>>3]);bo=(c[br>>2]|0)+(aj<<3)|0;h[k>>3]=bH,c[bo>>2]=c[k>>2]|0,c[bo+4>>2]=c[k+4>>2]|0;bH=(c[k>>2]=c[bw>>2]|0,c[k+4>>2]=c[bw+4>>2]|0,+h[k>>3]);bw=(c[bt>>2]|0)+(aj<<3)|0;h[k>>3]=bH,c[bw>>2]=c[k>>2]|0,c[bw+4>>2]=c[k+4>>2]|0;bH=(c[k>>2]=c[bu>>2]|0,c[k+4>>2]=c[bu+4>>2]|0,+h[k>>3]);bw=ai+(aj<<3)|0;h[k>>3]=bH,c[bw>>2]=c[k>>2]|0,c[bw+4>>2]=c[k+4>>2]|0;bw=am+(bs<<6)+40|0;bH=(c[k>>2]=c[bw>>2]|0,c[k+4>>2]=c[bw+4>>2]|0,+h[k>>3]);bw=N+(aj<<3)|0;h[k>>3]=bH,c[bw>>2]=c[k>>2]|0,c[bw+4>>2]=c[k+4>>2]|0}if((aj|0)>0){bs=c[aE>>2]|0;ae=aj}else{dR=0;break}}while(1){ae=dR+1|0;if((ae|0)<(aa|0)){dS=ae}else{dS=(ae|0)==(aa|0)?0:ae}bs=ai+(dR<<3)|0;bH=(c[k>>2]=c[bs>>2]|0,c[k+4>>2]=c[bs+4>>2]|0,+h[k>>3]);bs=N+(dS<<3)|0;cn=bH/(bH+(c[k>>2]=c[bs>>2]|0,c[k+4>>2]=c[bs+4>>2]|0,+h[k>>3]));bs=(c[bp>>2]|0)+(dR<<3)|0;h[k>>3]=cn,c[bs>>2]=c[k>>2]|0,c[bs+4>>2]=c[k+4>>2]|0;if((ae|0)==(aa|0)){break L485}else{dR=ae}}}}while(0);c[_+76>>2]=1;a_(af);a_(Y);a_(Q);a_(ap);a_(ag);a_(P);a_(az);a_(R);aa=c[F>>2]|0;c[aa+96>>2]=aa+64|0}aa=c[F>>2]|0;N=c[aa+96>>2]|0;c[E+8>>2]=c[N>>2]|0;c[E+12>>2]=c[N+4>>2]|0;c[E+16>>2]=c[N+8>>2]|0;N=c[j>>2]|0;do{if((N|0)==0){dT=o}else{cn=o+ +(c[aa>>2]|0);bH=cn/l;if(x){dT=cn;break}b6=(1.0-bH)*(c[k>>2]=c[y>>2]|0,c[k+4>>2]=c[y+4>>2]|0,+h[k>>3]);co=b6+bH*(c[k>>2]=c[z>>2]|0,c[k+4>>2]=c[z+4>>2]|0,+h[k>>3]);if(bH!=1.0){bH=(c[k>>2]=c[A>>2]|0,c[k+4>>2]=c[A+4>>2]|0,+h[k>>3]);if(co<bH+(c[k>>2]=c[C>>2]|0,c[k+4>>2]=c[C+4>>2]|0,+h[k>>3])){dT=cn;break}}as[N&1](co,c[B>>2]|0);h[k>>3]=co,c[A>>2]=c[k>>2]|0,c[A+4>>2]=c[k+4>>2]|0;dT=cn}}while(0);N=c[E+20>>2]|0;if((N|0)==0){break L26}else{E=N;o=dT}}if((m|0)==101){a_(W);a_(V);M=1;i=e;return M|0}else if((m|0)==152){a_(a5);a_(a2);a_(a1);a_(a0);a_(a$);a_(aY);M=1;i=e;return M|0}else if((m|0)==206){a_(bO);a_(bM);a_(bN);M=1;i=e;return M|0}else if((m|0)==386){a_(c5);a_(c2);a_(c3);a_(c4);a_(c1);a_(c0);a_(c$);a_(c_);M=1;i=e;return M|0}else if((m|0)==399){i=e;return M|0}}}while(0);if((d|0)==0){M=0}else{break}i=e;return M|0}}while(0);m=c[j>>2]|0;if((m|0)==0){M=0;i=e;return M|0}j=d+8|0;dT=(c[k>>2]=c[j>>2]|0,c[k+4>>2]=c[j+4>>2]|0,+h[k>>3])*0.0;j=d+16|0;l=dT+(c[k>>2]=c[j>>2]|0,c[k+4>>2]=c[j+4>>2]|0,+h[k>>3]);j=d+40|0;as[m&1](l,c[d+4>>2]|0);h[k>>3]=l,c[j>>2]=c[k>>2]|0,c[j+4>>2]=c[k+4>>2]|0;M=0;i=e;return M|0}function aO(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=b+32|0;b=c[d>>2]|0;e=c[b>>2]|0;if((e|0)<1){return}f=c[b+4>>2]|0;b=c[f>>2]&-32;g=a+12|0;h=a+8|0;a=0;i=c[f+(e-1<<3)+4>>2]|0;e=f;while(1){f=c[e+(a<<3)+4>>2]|0;do{if((f|0)==(i|0)){j=i}else{k=c[e+(a<<3)>>2]|0;l=(f|0)<(i|0)?f:i;m=k&-32;n=k&31;L567:do{if((m|0)<(b|0)){k=m;while(1){o=c[g>>2]|0;p=o+(X(c[h>>2]|0,l)+((k|0)/32&-1)<<2)|0;c[p>>2]=c[p>>2]^-1;p=k+32|0;if((p|0)<(b|0)){k=p}else{break L567}}}else{if((m|0)>(b|0)){q=b}else{break}while(1){k=c[g>>2]|0;p=k+(X(c[h>>2]|0,l)+((q|0)/32&-1)<<2)|0;c[p>>2]=c[p>>2]^-1;p=q+32|0;if((p|0)<(m|0)){q=p}else{break L567}}}}while(0);if((n|0)==0){j=f;break}p=c[g>>2]|0;k=p+(X(c[h>>2]|0,l)+((m|0)/32&-1)<<2)|0;c[k>>2]=c[k>>2]^-1<<32-n;j=f}}while(0);f=a+1|0;k=c[d>>2]|0;if((f|0)>=(c[k>>2]|0)){break}a=f;i=j;e=c[k+4>>2]|0}return}function aP(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0.0,aE=0.0,aF=0.0,aG=0,aH=0,aI=0,aJ=0,aK=0,aM=0,aN=0,aP=0,aQ=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,a0=0,a1=0,a2=0,a5=0,a6=0;g=i;i=i+12|0;j=g|0;l=g+4|0;m=g+8|0;c[m>>2]=0;n=b|0;o=c[n>>2]|0;p=b+4|0;q=c[p>>2]|0;r=(o+31|0)/32&-1;s=aZ(16)|0;L579:do{if((s|0)==0){t=0}else{u=s;c[u>>2]=o;v=s+4|0;c[v>>2]=q;w=s+8|0;c[w>>2]=r;x=aZ(X(q<<2,r))|0;y=s+12|0;c[y>>2]=x;if((x|0)==0){a_(s);t=0;break}z=s;A=b+12|0;B=c[A>>2]|0;C=b+8|0;a4(x|0,B|0,X(c[C>>2]<<2,c[p>>2]|0)|0);B=c[u>>2]|0;x=(B|0)%32;L584:do{if((x|0)==0){D=c[v>>2]|0;E=429;break}else{F=-1<<32-x;if((c[v>>2]|0)<=0){break}G=(c[y>>2]|0)+(((B|0)/32&-1)<<2)|0;c[G>>2]=c[G>>2]&F;G=c[v>>2]|0;if((G|0)>1){H=1}else{D=G;E=429;break}while(1){G=(c[u>>2]|0)/32&-1;I=c[y>>2]|0;J=I+(X(c[w>>2]|0,H)+G<<2)|0;c[J>>2]=c[J>>2]&F;J=H+1|0;G=c[v>>2]|0;if((J|0)<(G|0)){H=J}else{D=G;E=429;break L584}}}}while(0);L590:do{if((E|0)==429){if((D|0)<=0){break}B=e+4|0;x=e|0;F=(f|0)==0;G=f|0;J=f+8|0;I=f+16|0;K=f+40|0;L=f+4|0;M=f+24|0;N=0;O=D-1|0;P=m;L593:while(1){Q=c[u>>2]|0;R=O;S=N&-32;L595:while(1){T=S;while(1){if((T|0)>=(Q|0)){break}U=c[y>>2]|0;V=X(c[w>>2]|0,R);if((c[U+(V+((T|0)/32&-1)<<2)>>2]|0)==0){T=T+32|0}else{break L595}}if((R|0)>0){R=R-1|0;S=0}else{break L590}}if((R|0)<(c[v>>2]|0)){W=T}else{E=439;break}while(1){if((W|0)>-1&(W|0)<(Q|0)){Y=(W|0)/32&-1;Z=-2147483648>>>((W&31)>>>0);if((c[U+(Y+V<<2)>>2]&Z|0)!=0){break}}W=W+1|0}do{if((W|0)<(c[n>>2]|0)&(R|0)>-1){if((R|0)>=(c[p>>2]|0)){_=45;break}Q=c[A>>2]|0;_=(c[Q+(X(c[C>>2]|0,R)+Y<<2)>>2]&Z|0)!=0?43:45}else{_=45}}while(0);Q=R+1|0;S=c[B>>2]|0;$=(_|0)==43;aa=(_|0)==45;ab=0;ac=W;ad=Q;ae=0;af=0;ag=0;ah=-1;ai=0;while(1){aj=-ah|0;ak=-ai|0;if((ag|0)<(af|0)){al=ab;am=af}else{an=~~(+(af+100|0)*1.3);ao=a$(ab,an<<3)|0;if((ao|0)==0){ap=ab;break L593}al=ao;am=an}c[al+(ag<<3)>>2]=ac;c[al+(ag<<3)+4>>2]=ad;aq=ag+1|0;an=ac+ai|0;ao=ad+ah|0;ar=X(an,ah)+ae|0;if((an|0)==(W|0)&(ao|0)==(Q|0)){break}at=ai-1|0;au=(at+ah|0)/2&-1;av=au+an|0;do{if((av|0)>-1){if((av|0)>=(c[u>>2]|0)){aw=0;break}ax=((ah+(ai^-1)|0)/2&-1)+ao|0;if((ax|0)<=-1){aw=0;break}if((ax|0)>=(c[v>>2]|0)){aw=0;break}ay=c[y>>2]|0;aw=(c[ay+(X(c[w>>2]|0,ax)+((av|0)/32&-1)<<2)>>2]&-2147483648>>>((av&31)>>>0)|0)!=0&1}else{aw=0}}while(0);av=((at-ah|0)/2&-1)+an|0;do{if((av|0)>-1){if((av|0)>=(c[u>>2]|0)){az=1;break}ax=au+ao|0;if((ax|0)<=-1){az=1;break}if((ax|0)>=(c[v>>2]|0)){az=1;break}ay=c[y>>2]|0;az=(c[ay+(X(c[w>>2]|0,ax)+((av|0)/32&-1)<<2)>>2]&-2147483648>>>((av&31)>>>0)|0)==0}else{az=1}}while(0);av=(aw|0)!=0;if(!(av&az)){if(av){ab=al;ac=an;ad=ao;ae=ar;af=am;ag=aq;ai=ah;ah=ak;continue}ab=al;ac=an;ad=ao;ae=ar;af=am;ag=aq;ah=az?ai:ah;ai=az?aj:ai;continue}if((S|0)==5){if((aR(z,an,ao)|0)!=0){ab=al;ac=an;ad=ao;ae=ar;af=am;ag=aq;ai=ah;ah=ak;continue}}else if((S|0)==4){if((aR(z,an,ao)|0)==0){ab=al;ac=an;ad=ao;ae=ar;af=am;ag=aq;ai=ah;ah=ak;continue}}else if((S|0)==0){if($){ab=al;ac=an;ad=ao;ae=ar;af=am;ag=aq;ai=ah;ah=ak;continue}}else if((S|0)==1){if(aa){ab=al;ac=an;ad=ao;ae=ar;af=am;ag=aq;ai=ah;ah=ak;continue}}else if((S|0)==6){av=X(X(an,78898037)^ao,94957459);if((a[5242964+(av>>>8&255)|0]^a[5242964+(av&255)|0]^a[5242964+(av>>>16&255)|0])<<24>>24!=a[5242964+(av>>>24)|0]<<24>>24){ab=al;ac=an;ad=ao;ae=ar;af=am;ag=aq;ai=ah;ah=ak;continue}}else if((S|0)==3){ab=al;ac=an;ad=ao;ae=ar;af=am;ag=aq;ai=ah;ah=ak;continue}ab=al;ac=an;ad=ao;ae=ar;af=am;ag=aq;ah=ai;ai=aj}ai=aZ(36)|0;ah=ai;if((ai|0)==0){aA=0;aB=0;E=471;break}a3(ai|0,0,36);ag=aZ(100)|0;af=ag;if((ag|0)==0){aA=af;aB=ai;E=471;break}a3(ag|0,0,100);ae=ai+32|0;c[ae>>2]=af;c[ag+4>>2]=al;c[c[ae>>2]>>2]=aq;ae=ai;c[ae>>2]=ar;c[ai+4>>2]=_;aO(z,ah);if((c[ae>>2]|0)>(c[x>>2]|0)){ae=ai+20|0;c[ae>>2]=c[P>>2]|0;c[P>>2]=ah;aC=ae}else{aL(ah);aC=P}ah=c[v>>2]|0;do{if((ah|0)>0){aD=1.0- +(R|0)/+(ah|0);if(F){break}ae=c[G>>2]|0;if((ae|0)==0){break}aE=(1.0-aD)*(c[k>>2]=c[J>>2]|0,c[k+4>>2]=c[J+4>>2]|0,+h[k>>3]);aF=aE+aD*(c[k>>2]=c[I>>2]|0,c[k+4>>2]=c[I+4>>2]|0,+h[k>>3]);if(aD!=1.0){aD=(c[k>>2]=c[K>>2]|0,c[k+4>>2]=c[K+4>>2]|0,+h[k>>3]);if(aF<aD+(c[k>>2]=c[M>>2]|0,c[k+4>>2]=c[M+4>>2]|0,+h[k>>3])){break}}as[ae&1](aF,c[L>>2]|0);h[k>>3]=aF,c[K>>2]=c[k>>2]|0,c[K+4>>2]=c[k+4>>2]|0}}while(0);if((R|0)>-1){N=W;O=R;P=aC}else{break L590}}if((E|0)==471){a_(aB);a_(aA);ap=al}else if((E|0)==439){while(1){E=0}}a_(ap);a_(c[y>>2]|0);t=s;break L579}}while(0);C=c[m>>2]|0;c[j>>2]=C;A=c[y>>2]|0;a3(A|0,0,X(c[v>>2]<<2,c[w>>2]|0)|0);L663:do{if((C|0)==0){E=510}else{A=C;while(1){P=c[A+20>>2]|0;c[A+28>>2]=P;c[A+24>>2]=0;if((P|0)==0){aG=C;break}else{A=P}}while(1){A=aG+24|0;P=c[A>>2]|0;c[A>>2]=0;O=aG+20|0;N=c[O>>2]|0;c[O>>2]=0;aO(z,aG);K=c[aG+32>>2]|0;L=c[K>>2]|0;if((L|0)>0){M=c[K+4>>2]|0;K=0;I=2147483647;J=0;G=2147483647;F=0;while(1){x=c[M+(K<<3)>>2]|0;B=c[M+(K<<3)+4>>2]|0;aH=(x|0)<(I|0)?x:I;aI=(x|0)>(J|0)?x:J;aJ=(B|0)<(G|0)?B:G;aK=(B|0)>(F|0)?B:F;B=K+1|0;if((B|0)==(L|0)){break}else{K=B;I=aH;J=aI;G=aJ;F=aK}}aM=(aH|0)/32&-1;aN=(aI+31|0)/32&-1;aP=aJ;aQ=aK}else{aM=67108863;aN=0;aP=2147483647;aQ=0}L674:do{if((N|0)!=0){F=N;G=A;J=O;L675:while(1){aS=F;aT=J;L677:while(1){aU=aS+20|0;aV=c[aU>>2]|0;c[aU>>2]=0;I=c[(c[aS+32>>2]|0)+4>>2]|0;K=c[I+4>>2]|0;if((K|0)<=(aP|0)){break L675}L=c[I>>2]|0;do{if((L|0)>-1){if((L|0)>=(c[u>>2]|0)){break}I=K-1|0;if((K|0)<=0){break}if((I|0)>=(c[v>>2]|0)){break}M=c[y>>2]|0;if((c[M+(X(c[w>>2]|0,I)+((L|0)/32&-1)<<2)>>2]&-2147483648>>>((L&31)>>>0)|0)!=0){break L677}}}while(0);c[aU>>2]=c[aT>>2]|0;c[aT>>2]=aS;if((aV|0)==0){break L674}else{aS=aV;aT=aU}}c[aU>>2]=c[G>>2]|0;c[G>>2]=aS;if((aV|0)==0){break L674}else{F=aV;G=aU;J=aT}}c[aT>>2]=aS;c[aU>>2]=aV}}while(0);L689:do{if((aP|0)<(aQ|0)&(aM|0)<(aN|0)){N=aP;while(1){J=aM;while(1){G=c[y>>2]|0;c[G+(X(c[w>>2]|0,N)+J<<2)>>2]=0;G=J+1|0;if((G|0)==(aN|0)){break}else{J=G}}J=N+1|0;if((J|0)==(aQ|0)){break L689}else{N=J}}}}while(0);N=c[O>>2]|0;if((N|0)==0){aW=P}else{c[N+24>>2]=P;aW=c[O>>2]|0}N=c[A>>2]|0;if((N|0)==0){aX=aW}else{c[N+24>>2]=aW;aX=c[A>>2]|0}if((aX|0)==0){break}else{aG=aX}}N=c[j>>2]|0;if((N|0)==0){E=510;break}else{aY=N}while(1){J=aY+28|0;G=c[J>>2]|0;c[J>>2]=c[aY+20>>2]|0;if((G|0)==0){break}else{aY=G}}c[N+20>>2]=0;c[j>>2]=0;G=N;J=j;F=0;while(1){c[l>>2]=F;if((G|0)==0){a0=J;a1=F}else{aj=G;ao=J;while(1){an=aj+20|0;c[an>>2]=c[ao>>2]|0;c[ao>>2]=aj;ak=c[aj+24>>2]|0;L711:do{if((ak|0)==0){a2=an}else{L=an;K=ak;while(1){I=K+20|0;c[I>>2]=c[L>>2]|0;c[L>>2]=K;M=K+24|0;R=c[M>>2]|0;if((R|0)!=0){B=l;while(1){x=c[B>>2]|0;if((x|0)==0){break}else{B=x+20|0}}c[R+20>>2]=0;c[B>>2]=c[M>>2]|0}x=c[K+28>>2]|0;if((x|0)==0){a2=I;break L711}else{L=I;K=x}}}}while(0);ak=c[aj+28>>2]|0;if((ak|0)==0){break}else{aj=ak;ao=a2}}a0=a2;a1=c[l>>2]|0}if((a1|0)==0){break L663}G=a1;J=a0;F=c[a1+20>>2]|0}}}while(0);if((E|0)==510){c[j>>2]=0}a_(c[y>>2]|0);a_(s);c[d>>2]=c[m>>2]|0;if((f|0)==0){a5=0;i=g;return a5|0}w=c[f>>2]|0;if((w|0)==0){a5=0;i=g;return a5|0}v=f+8|0;aF=(c[k>>2]=c[v>>2]|0,c[k+4>>2]=c[v+4>>2]|0,+h[k>>3])*0.0;v=f+16|0;aD=aF+(c[k>>2]=c[v>>2]|0,c[k+4>>2]=c[v+4>>2]|0,+h[k>>3]);v=f+40|0;as[w&1](aD,c[f+4>>2]|0);h[k>>3]=aD,c[v>>2]=c[k>>2]|0,c[v+4>>2]=c[k+4>>2]|0;a5=0;i=g;return a5|0}}while(0);a_(t);t=c[m>>2]|0;if((t|0)==0){a5=-1;i=g;return a5|0}else{a6=t}while(1){t=a6+20|0;f=c[t>>2]|0;c[t>>2]=0;aL(a6);if((f|0)==0){break}else{a6=f}}c[m>>2]=0;a5=-1;i=g;return a5|0}function aQ(){return 4}function aR(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;e=a|0;f=a+4|0;g=a+12|0;h=a+8|0;a=2;while(1){if((a|0)>=5){i=0;j=561;break}k=a+d|0;l=k-1|0;m=a+b|0;n=m-1|0;o=(m|0)>0;m=(n|0)/32&-1;p=-2147483648>>>((n&31)>>>0);q=d-a|0;r=b-a|0;s=(r|0)>-1;t=(r|0)/32&-1;u=-2147483648>>>((r&31)>>>0);v=1-a|0;w=0;while(1){x=v+b|0;do{if((x|0)>-1){if((x|0)>=(c[e>>2]|0)|(k|0)<1){y=-1;break}if((l|0)>=(c[f>>2]|0)){y=-1;break}z=c[g>>2]|0;y=(c[z+(X(c[h>>2]|0,l)+((x|0)/32&-1)<<2)>>2]&-2147483648>>>((x&31)>>>0)|0)!=0?1:-1}else{y=-1}}while(0);z=y+w|0;do{if(o){if((n|0)>=(c[e>>2]|0)){A=-1;break}B=v+d|0;C=B-1|0;if((B|0)<=0){A=-1;break}if((C|0)>=(c[f>>2]|0)){A=-1;break}B=c[g>>2]|0;A=(c[B+(X(c[h>>2]|0,C)+m<<2)>>2]&p|0)!=0?1:-1}else{A=-1}}while(0);C=z+A|0;B=x-1|0;do{if((x|0)>0){if((B|0)>=(c[e>>2]|0)|(q|0)<0){D=-1;break}if((q|0)>=(c[f>>2]|0)){D=-1;break}E=c[g>>2]|0;D=(c[E+(X(c[h>>2]|0,q)+((B|0)/32&-1)<<2)>>2]&-2147483648>>>((B&31)>>>0)|0)!=0?1:-1}else{D=-1}}while(0);B=C+D|0;do{if(s){if((r|0)>=(c[e>>2]|0)){F=-1;break}x=v+d|0;if((x|0)<=-1){F=-1;break}if((x|0)>=(c[f>>2]|0)){F=-1;break}z=c[g>>2]|0;F=(c[z+(X(c[h>>2]|0,x)+t<<2)>>2]&u|0)!=0?1:-1}else{F=-1}}while(0);G=B+F|0;C=v+1|0;if((C|0)==(a|0)){break}else{v=C;w=G}}if((G|0)>0){i=1;j=562;break}if((G|0)<0){i=0;j=563;break}else{a=a+1|0}}if((j|0)==561){return i|0}else if((j|0)==562){return i|0}else if((j|0)==563){return i|0}return 0}function aS(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=-2147483648>>>((b&31)>>>0);if((e|0)==0){e=c[a+12>>2]|0;g=e+(X(c[a+8>>2]|0,d)+((b|0)/32&-1)<<2)|0;c[g>>2]=c[g>>2]&(f^-1);return}else{g=c[a+12>>2]|0;e=g+(X(c[a+8>>2]|0,d)+((b|0)/32&-1)<<2)|0;c[e>>2]=c[e>>2]|f;return}}function aT(a){a=a|0;return c[a+20>>2]|0}function aU(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,j=0,l=0,m=0.0,n=0.0,o=0.0,p=0,q=0,r=0,s=0.0,t=0.0,u=0,v=0,w=0.0,x=0.0,y=0.0,z=0;d=i;i=i+52|0;e=d|0;f=d+4|0;c[e>>2]=0;g=c[a+28>>2]|0;j=c[a+32>>2]|0;l=a+36|0;m=(c[k>>2]=c[l>>2]|0,c[k+4>>2]=c[l+4>>2]|0,+h[k>>3]);l=a+44|0;n=(c[k>>2]=c[l>>2]|0,c[k+4>>2]=c[l+4>>2]|0,+h[k>>3]);l=a+52|0;o=(c[k>>2]=c[l>>2]|0,c[k+4>>2]=c[l+4>>2]|0,+h[k>>3]);l=aZ(12)|0;p=l;if((l|0)==0){q=0;i=d;return q|0}r=(g|0)==0;do{if(r){c[f>>2]=0}else{s=m+n*0.0;t=m*.9+n*.1;u=f|0;if(t-s<o){c[u>>2]=0;v=f+32|0;h[k>>3]=.1,c[v>>2]=c[k>>2]|0,c[v+4>>2]=c[k+4>>2]|0;break}else{c[u>>2]=g;c[f+4>>2]=j;u=f+24|0;h[k>>3]=o,c[u>>2]=c[k>>2]|0,c[u+4>>2]=c[k+4>>2]|0;u=f+8|0;h[k>>3]=s,c[u>>2]=c[k>>2]|0,c[u+4>>2]=c[k+4>>2]|0;u=f+16|0;h[k>>3]=t,c[u>>2]=c[k>>2]|0,c[u+4>>2]=c[k+4>>2]|0;u=f+40|0;h[k>>3]=m,c[u>>2]=c[k>>2]|0,c[u+4>>2]=c[k+4>>2]|0;break}}}while(0);if((aP(b,e,a,f)|0)!=0){a_(l);q=0;i=d;return q|0}b=l;c[b>>2]=0;u=c[e>>2]|0;c[l+4>>2]=u;c[l+8>>2]=0;l=f|0;e=f+32|0;t=(c[k>>2]=c[e>>2]|0,c[k+4>>2]=c[e+4>>2]|0,+h[k>>3]);do{if(r){c[l>>2]=0;w=m}else{v=f+40|0;s=(c[k>>2]=c[v>>2]|0,c[k+4>>2]=c[v+4>>2]|0,+h[k>>3]);do{if((c[l>>2]|0)==0){x=n*t+m*(1.0-t);if(t!=1.0){if(x<m+o){y=m;break}}as[g&1](x,j);y=x}else{y=s}}while(0);s=m*.9+n*.1;x=m*0.0+n;if(x-s<o){c[l>>2]=0;h[k>>3]=1.0,c[e>>2]=c[k>>2]|0,c[e+4>>2]=c[k+4>>2]|0;w=y;break}else{c[l>>2]=g;c[f+4>>2]=j;z=f+24|0;h[k>>3]=o,c[z>>2]=c[k>>2]|0,c[z+4>>2]=c[k+4>>2]|0;z=f+8|0;h[k>>3]=s,c[z>>2]=c[k>>2]|0,c[z+4>>2]=c[k+4>>2]|0;z=f+16|0;h[k>>3]=x,c[z>>2]=c[k>>2]|0,c[z+4>>2]=c[k+4>>2]|0;h[k>>3]=y,c[v>>2]=c[k>>2]|0,c[v+4>>2]=c[k+4>>2]|0;w=y;break}}}while(0);if((aN(u,a,f)|0)!=0){c[b>>2]=1}b=c[l>>2]|0;y=(c[k>>2]=c[e>>2]|0,c[k+4>>2]=c[e+4>>2]|0,+h[k>>3]);if(!((b|0)==0&(r^1))){q=p;i=d;return q|0}t=n*y+m*(1.0-y);do{if(y!=1.0){if(t<o+w){q=p}else{break}i=d;return q|0}}while(0);as[g&1](t,j);q=p;i=d;return q|0}function aV(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=(a+31|0)/32&-1;e=aZ(16)|0;if((e|0)==0){f=0;return f|0}c[e>>2]=a;c[e+4>>2]=b;c[e+8>>2]=d;a=aZ(X(b<<2,d))|0;c[e+12>>2]=a;if((a|0)!=0){f=e;return f|0}a_(e);f=0;return f|0}function aW(a){a=a|0;if((a|0)!=0){a_(c[a+12>>2]|0)}a_(a);return}function aX(a){a=a|0;var b=0,d=0,e=0;b=aZ(60)|0;if((b|0)==0){d=0}else{a4(b|0,5242880,60);d=b}c[d>>2]=0;b=d+8|0;h[k>>3]=1.0,c[b>>2]=c[k>>2]|0,c[b+4>>2]=c[k+4>>2]|0;b=aU(d,a)|0;if((b|0)==0){e=0;return e|0}if((c[b>>2]|0)!=0){e=0;return e|0}a_(d);e=b;return e|0}function aY(a){a=a|0;var b=0,d=0,e=0,f=0;b=c[a+4>>2]|0;if((b|0)==0){d=a;a_(d);return}else{e=b}while(1){b=e+20|0;f=c[b>>2]|0;c[b>>2]=0;aL(e);if((f|0)==0){break}else{e=f}}d=a;a_(d);return}function aZ(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,ak=0,al=0,an=0,ao=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0;do{if(a>>>0<245){if(a>>>0<11){b=16}else{b=a+11&-8}d=b>>>3;e=c[1310805]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=5243260+(h<<2)|0;j=5243260+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[1310805]=e&(1<<g^-1)}else{if(l>>>0<(c[1310809]|0)>>>0){ap();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{ap();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[1310807]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=5243260+(p<<2)|0;m=5243260+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[1310805]=e&(1<<r^-1)}else{if(l>>>0<(c[1310809]|0)>>>0){ap();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{ap();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[1310807]|0;if((l|0)!=0){q=c[1310810]|0;d=l>>>3;l=d<<1;f=5243260+(l<<2)|0;k=c[1310805]|0;h=1<<d;do{if((k&h|0)==0){c[1310805]=k|h;s=f;t=5243260+(l+2<<2)|0}else{d=5243260+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[1310809]|0)>>>0){s=g;t=d;break}ap();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[1310807]=m;c[1310810]=e;n=i;return n|0}l=c[1310806]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[5243524+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[1310809]|0;if(r>>>0<i>>>0){ap();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){ap();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;L1029:do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;do{if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break L1029}else{w=l;x=k;break}}else{w=g;x=q}}while(0);while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){ap();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){ap();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){ap();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{ap();return 0}}}while(0);L1051:do{if((e|0)!=0){f=d+28|0;i=5243524+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[1310806]=c[1310806]&(1<<c[f>>2]^-1);break L1051}else{if(e>>>0<(c[1310809]|0)>>>0){ap();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L1051}}}while(0);if(v>>>0<(c[1310809]|0)>>>0){ap();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[1310809]|0)>>>0){ap();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[1310809]|0)>>>0){ap();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4|0)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b|0)>>2]=p;f=c[1310807]|0;if((f|0)!=0){e=c[1310810]|0;i=f>>>3;f=i<<1;q=5243260+(f<<2)|0;k=c[1310805]|0;g=1<<i;do{if((k&g|0)==0){c[1310805]=k|g;y=q;z=5243260+(f+2<<2)|0}else{i=5243260+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[1310809]|0)>>>0){y=l;z=i;break}ap();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[1310807]=p;c[1310810]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231){o=-1;break}f=a+11|0;g=f&-8;k=c[1310806]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=(14-(h|f|l)|0)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[5243524+(A<<2)>>2]|0;L859:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L859}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break L859}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[5243524+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}L874:do{if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break L874}else{p=r;m=i;q=e}}}}while(0);if((K|0)==0){o=g;break}if(J>>>0>=((c[1310807]|0)-g|0)>>>0){o=g;break}k=K;q=c[1310809]|0;if(k>>>0<q>>>0){ap();return 0}m=k+g|0;p=m;if(k>>>0>=m>>>0){ap();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;L887:do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;do{if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break L887}else{M=B;N=j;break}}else{M=d;N=r}}while(0);while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<q>>>0){ap();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<q>>>0){ap();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){ap();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{ap();return 0}}}while(0);L909:do{if((e|0)!=0){i=K+28|0;q=5243524+(c[i>>2]<<2)|0;do{if((K|0)==(c[q>>2]|0)){c[q>>2]=L;if((L|0)!=0){break}c[1310806]=c[1310806]&(1<<c[i>>2]^-1);break L909}else{if(e>>>0<(c[1310809]|0)>>>0){ap();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L909}}}while(0);if(L>>>0<(c[1310809]|0)>>>0){ap();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[1310809]|0)>>>0){ap();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[1310809]|0)>>>0){ap();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16){e=J+g|0;c[K+4>>2]=e|3;i=k+(e+4|0)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[k+(g|4)>>2]=J|1;c[k+(J+g|0)>>2]=J;i=J>>>3;if(J>>>0<256){e=i<<1;q=5243260+(e<<2)|0;r=c[1310805]|0;j=1<<i;do{if((r&j|0)==0){c[1310805]=r|j;O=q;P=5243260+(e+2<<2)|0}else{i=5243260+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[1310809]|0)>>>0){O=d;P=i;break}ap();return 0}}while(0);c[P>>2]=p;c[O+12>>2]=p;c[k+(g+8|0)>>2]=O;c[k+(g+12|0)>>2]=q;break}e=m;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=(14-(d|r|i)|0)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=5243524+(Q<<2)|0;c[k+(g+28|0)>>2]=Q;c[k+(g+20|0)>>2]=0;c[k+(g+16|0)>>2]=0;q=c[1310806]|0;l=1<<Q;if((q&l|0)==0){c[1310806]=q|l;c[j>>2]=e;c[k+(g+24|0)>>2]=j;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;q=c[j>>2]|0;while(1){if((c[q+4>>2]&-8|0)==(J|0)){break}S=q+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=774;break}else{l=l<<1;q=j}}if((T|0)==774){if(S>>>0<(c[1310809]|0)>>>0){ap();return 0}else{c[S>>2]=e;c[k+(g+24|0)>>2]=q;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}}l=q+8|0;j=c[l>>2]|0;i=c[1310809]|0;if(q>>>0<i>>>0){ap();return 0}if(j>>>0<i>>>0){ap();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[k+(g+8|0)>>2]=j;c[k+(g+12|0)>>2]=q;c[k+(g+24|0)>>2]=0;break}}}while(0);k=K+8|0;if((k|0)==0){o=g;break}else{n=k}return n|0}}while(0);K=c[1310807]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[1310810]|0;if(S>>>0>15){R=J;c[1310810]=R+o|0;c[1310807]=S;c[R+(o+4|0)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[1310807]=0;c[1310810]=0;c[J+4>>2]=K|3;S=J+(K+4|0)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[1310808]|0;if(o>>>0<J>>>0){S=J-o|0;c[1310808]=S;J=c[1310811]|0;K=J;c[1310811]=K+o|0;c[K+(o+4|0)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[1310735]|0)==0){J=aj(8)|0;if((J-1&J|0)==0){c[1310737]=J;c[1310736]=J;c[1310738]=-1;c[1310739]=2097152;c[1310740]=0;c[1310916]=0;c[1310735]=ar(0)&-16^1431655768;break}else{ap();return 0}}}while(0);J=o+48|0;S=c[1310737]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[1310915]|0;do{if((O|0)!=0){P=c[1310913]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L1118:do{if((c[1310916]&4|0)==0){O=c[1310811]|0;L1120:do{if((O|0)==0){T=804}else{L=O;P=5243668;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=804;break L1120}else{P=M}}if((P|0)==0){T=804;break}L=R-(c[1310808]|0)&Q;if(L>>>0>=2147483647){W=0;break}q=aq(L|0)|0;e=(q|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?q:-1;Y=e?L:0;Z=q;_=L;T=813;break}}while(0);do{if((T|0)==804){O=aq(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[1310736]|0;q=L-1|0;if((q&g|0)==0){$=S}else{$=(S-g|0)+(q+g&-L)|0}L=c[1310913]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647)){W=0;break}q=c[1310915]|0;if((q|0)!=0){if(g>>>0<=L>>>0|g>>>0>q>>>0){W=0;break}}q=aq($|0)|0;g=(q|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=q;_=$;T=813;break}}while(0);L1140:do{if((T|0)==813){q=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=824;break L1118}do{if((Z|0)!=-1&_>>>0<2147483647&_>>>0<J>>>0){g=c[1310737]|0;O=(K-_|0)+g&-g;if(O>>>0>=2147483647){ac=_;break}if((aq(O|0)|0)==-1){aq(q|0);W=Y;break L1140}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=824;break L1118}}}while(0);c[1310916]=c[1310916]|4;ad=W;T=821;break}else{ad=0;T=821}}while(0);do{if((T|0)==821){if(S>>>0>=2147483647){break}W=aq(S|0)|0;Z=aq(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)==-1){break}else{aa=Z?ac:ad;ab=Y;T=824;break}}}while(0);do{if((T|0)==824){ad=(c[1310913]|0)+aa|0;c[1310913]=ad;if(ad>>>0>(c[1310914]|0)>>>0){c[1310914]=ad}ad=c[1310811]|0;L1160:do{if((ad|0)==0){S=c[1310809]|0;if((S|0)==0|ab>>>0<S>>>0){c[1310809]=ab}c[1310917]=ab;c[1310918]=aa;c[1310920]=0;c[1310814]=c[1310735]|0;c[1310813]=-1;S=0;while(1){Y=S<<1;ac=5243260+(Y<<2)|0;c[5243260+(Y+3<<2)>>2]=ac;c[5243260+(Y+2<<2)>>2]=ac;ac=S+1|0;if((ac|0)==32){break}else{S=ac}}S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=(aa-40|0)-ae|0;c[1310811]=ab+ae|0;c[1310808]=S;c[ab+(ae+4|0)>>2]=S|1;c[ab+(aa-36|0)>>2]=40;c[1310812]=c[1310739]|0}else{S=5243668;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=836;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==836){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa|0;ac=c[1310811]|0;Y=(c[1310808]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[1310811]=Z+ai|0;c[1310808]=W;c[Z+(ai+4|0)>>2]=W|1;c[Z+(Y+4|0)>>2]=40;c[1310812]=c[1310739]|0;break L1160}}while(0);if(ab>>>0<(c[1310809]|0)>>>0){c[1310809]=ab}S=ab+aa|0;Y=5243668;while(1){ak=Y|0;if((c[ak>>2]|0)==(S|0)){T=846;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==846){if((c[Y+12>>2]&8|0)!=0){break}c[ak>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa|0;S=ab+8|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(aa+8|0)|0;if((S&7|0)==0){an=0}else{an=-S&7}S=ab+(an+aa|0)|0;Z=S;W=al+o|0;ac=ab+W|0;_=ac;K=(S-(ab+al|0)|0)-o|0;c[ab+(al+4|0)>>2]=o|3;do{if((Z|0)==(c[1310811]|0)){J=(c[1310808]|0)+K|0;c[1310808]=J;c[1310811]=_;c[ab+(W+4|0)>>2]=J|1}else{if((Z|0)==(c[1310810]|0)){J=(c[1310807]|0)+K|0;c[1310807]=J;c[1310810]=_;c[ab+(W+4|0)>>2]=J|1;c[ab+(J+W|0)>>2]=J;break}J=aa+4|0;X=c[ab+(J+an|0)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L1205:do{if(X>>>0<256){U=c[ab+((an|8)+aa|0)>>2]|0;Q=c[ab+((aa+12|0)+an|0)>>2]|0;R=5243260+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[1310809]|0)>>>0){ap();return 0}if((c[U+12>>2]|0)==(Z|0)){break}ap();return 0}}while(0);if((Q|0)==(U|0)){c[1310805]=c[1310805]&(1<<V^-1);break}do{if((Q|0)==(R|0)){ao=Q+8|0}else{if(Q>>>0<(c[1310809]|0)>>>0){ap();return 0}q=Q+8|0;if((c[q>>2]|0)==(Z|0)){ao=q;break}ap();return 0}}while(0);c[U+12>>2]=Q;c[ao>>2]=U}else{R=S;q=c[ab+((an|24)+aa|0)>>2]|0;P=c[ab+((aa+12|0)+an|0)>>2]|0;L1226:do{if((P|0)==(R|0)){O=an|16;g=ab+(J+O|0)|0;L=c[g>>2]|0;do{if((L|0)==0){e=ab+(O+aa|0)|0;M=c[e>>2]|0;if((M|0)==0){as=0;break L1226}else{at=M;au=e;break}}else{at=L;au=g}}while(0);while(1){g=at+20|0;L=c[g>>2]|0;if((L|0)!=0){at=L;au=g;continue}g=at+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{at=L;au=g}}if(au>>>0<(c[1310809]|0)>>>0){ap();return 0}else{c[au>>2]=0;as=at;break}}else{g=c[ab+((an|8)+aa|0)>>2]|0;if(g>>>0<(c[1310809]|0)>>>0){ap();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){ap();return 0}O=P+8|0;if((c[O>>2]|0)==(R|0)){c[L>>2]=P;c[O>>2]=g;as=P;break}else{ap();return 0}}}while(0);if((q|0)==0){break}P=ab+((aa+28|0)+an|0)|0;U=5243524+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=as;if((as|0)!=0){break}c[1310806]=c[1310806]&(1<<c[P>>2]^-1);break L1205}else{if(q>>>0<(c[1310809]|0)>>>0){ap();return 0}Q=q+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=as}else{c[q+20>>2]=as}if((as|0)==0){break L1205}}}while(0);if(as>>>0<(c[1310809]|0)>>>0){ap();return 0}c[as+24>>2]=q;R=an|16;P=c[ab+(R+aa|0)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[1310809]|0)>>>0){ap();return 0}else{c[as+16>>2]=P;c[P+24>>2]=as;break}}}while(0);P=c[ab+(J+R|0)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[1310809]|0)>>>0){ap();return 0}else{c[as+20>>2]=P;c[P+24>>2]=as;break}}}while(0);av=ab+(($|an)+aa|0)|0;aw=$+K|0}else{av=Z;aw=K}J=av+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4|0)>>2]=aw|1;c[ab+(aw+W|0)>>2]=aw;J=aw>>>3;if(aw>>>0<256){V=J<<1;X=5243260+(V<<2)|0;P=c[1310805]|0;q=1<<J;do{if((P&q|0)==0){c[1310805]=P|q;ax=X;ay=5243260+(V+2<<2)|0}else{J=5243260+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[1310809]|0)>>>0){ax=U;ay=J;break}ap();return 0}}while(0);c[ay>>2]=_;c[ax+12>>2]=_;c[ab+(W+8|0)>>2]=ax;c[ab+(W+12|0)>>2]=X;break}V=ac;q=aw>>>8;do{if((q|0)==0){az=0}else{if(aw>>>0>16777215){az=31;break}P=(q+1048320|0)>>>16&8;$=q<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=(14-(J|P|$)|0)+(U<<$>>>15)|0;az=aw>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=5243524+(az<<2)|0;c[ab+(W+28|0)>>2]=az;c[ab+(W+20|0)>>2]=0;c[ab+(W+16|0)>>2]=0;X=c[1310806]|0;Q=1<<az;if((X&Q|0)==0){c[1310806]=X|Q;c[q>>2]=V;c[ab+(W+24|0)>>2]=q;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}if((az|0)==31){aA=0}else{aA=25-(az>>>1)|0}Q=aw<<aA;X=c[q>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(aw|0)){break}aB=X+16+(Q>>>31<<2)|0;q=c[aB>>2]|0;if((q|0)==0){T=919;break}else{Q=Q<<1;X=q}}if((T|0)==919){if(aB>>>0<(c[1310809]|0)>>>0){ap();return 0}else{c[aB>>2]=V;c[ab+(W+24|0)>>2]=X;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}}Q=X+8|0;q=c[Q>>2]|0;$=c[1310809]|0;if(X>>>0<$>>>0){ap();return 0}if(q>>>0<$>>>0){ap();return 0}else{c[q+12>>2]=V;c[Q>>2]=V;c[ab+(W+8|0)>>2]=q;c[ab+(W+12|0)>>2]=X;c[ab+(W+24|0)>>2]=0;break}}}while(0);n=ab+(al|8)|0;return n|0}}while(0);Y=ad;W=5243668;while(1){aC=c[W>>2]|0;if(aC>>>0<=Y>>>0){aD=c[W+4>>2]|0;aE=aC+aD|0;if(aE>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=aC+(aD-39|0)|0;if((W&7|0)==0){aF=0}else{aF=-W&7}W=aC+((aD-47|0)+aF|0)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aG=0}else{aG=-_&7}_=(aa-40|0)-aG|0;c[1310811]=ab+aG|0;c[1310808]=_;c[ab+(aG+4|0)>>2]=_|1;c[ab+(aa-36|0)>>2]=40;c[1310812]=c[1310739]|0;c[ac+4>>2]=27;a4(W|0,5243668,16);c[1310917]=ab;c[1310918]=aa;c[1310920]=0;c[1310919]=W;W=ac+28|0;c[W>>2]=7;L1324:do{if((ac+32|0)>>>0<aE>>>0){_=W;while(1){K=_+4|0;c[K>>2]=7;if((_+8|0)>>>0<aE>>>0){_=K}else{break L1324}}}}while(0);if((ac|0)==(Y|0)){break}W=ac-ad|0;_=Y+(W+4|0)|0;c[_>>2]=c[_>>2]&-2;c[ad+4>>2]=W|1;c[Y+W>>2]=W;_=W>>>3;if(W>>>0<256){K=_<<1;Z=5243260+(K<<2)|0;S=c[1310805]|0;q=1<<_;do{if((S&q|0)==0){c[1310805]=S|q;aH=Z;aI=5243260+(K+2<<2)|0}else{_=5243260+(K+2<<2)|0;Q=c[_>>2]|0;if(Q>>>0>=(c[1310809]|0)>>>0){aH=Q;aI=_;break}ap();return 0}}while(0);c[aI>>2]=ad;c[aH+12>>2]=ad;c[ad+8>>2]=aH;c[ad+12>>2]=Z;break}K=ad;q=W>>>8;do{if((q|0)==0){aJ=0}else{if(W>>>0>16777215){aJ=31;break}S=(q+1048320|0)>>>16&8;Y=q<<S;ac=(Y+520192|0)>>>16&4;_=Y<<ac;Y=(_+245760|0)>>>16&2;Q=(14-(ac|S|Y)|0)+(_<<Y>>>15)|0;aJ=W>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=5243524+(aJ<<2)|0;c[ad+28>>2]=aJ;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[1310806]|0;Q=1<<aJ;if((Z&Q|0)==0){c[1310806]=Z|Q;c[q>>2]=K;c[ad+24>>2]=q;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aJ|0)==31){aK=0}else{aK=25-(aJ>>>1)|0}Q=W<<aK;Z=c[q>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(W|0)){break}aL=Z+16+(Q>>>31<<2)|0;q=c[aL>>2]|0;if((q|0)==0){T=954;break}else{Q=Q<<1;Z=q}}if((T|0)==954){if(aL>>>0<(c[1310809]|0)>>>0){ap();return 0}else{c[aL>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;W=c[Q>>2]|0;q=c[1310809]|0;if(Z>>>0<q>>>0){ap();return 0}if(W>>>0<q>>>0){ap();return 0}else{c[W+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=W;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[1310808]|0;if(ad>>>0<=o>>>0){break}W=ad-o|0;c[1310808]=W;ad=c[1310811]|0;Q=ad;c[1310811]=Q+o|0;c[Q+(o+4|0)>>2]=W|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[am()>>2]=12;n=0;return n|0}function a_(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[1310809]|0;if(b>>>0<e>>>0){ap()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){ap()}h=f&-8;i=a+(h-8|0)|0;j=i;L1377:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){ap()}if((n|0)==(c[1310810]|0)){p=a+(h-4|0)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[1310807]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4|0)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[a+(l+8|0)>>2]|0;s=c[a+(l+12|0)>>2]|0;t=5243260+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){ap()}if((c[k+12>>2]|0)==(n|0)){break}ap()}}while(0);if((s|0)==(k|0)){c[1310805]=c[1310805]&(1<<p^-1);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){ap()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}ap()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24|0)>>2]|0;v=c[a+(l+12|0)>>2]|0;L1411:do{if((v|0)==(t|0)){w=a+(l+20|0)|0;x=c[w>>2]|0;do{if((x|0)==0){y=a+(l+16|0)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break L1411}else{B=z;C=y;break}}else{B=x;C=w}}while(0);while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){ap()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8|0)>>2]|0;if(w>>>0<e>>>0){ap()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){ap()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{ap()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28|0)|0;m=5243524+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[1310806]=c[1310806]&(1<<c[v>>2]^-1);q=n;r=o;break L1377}else{if(p>>>0<(c[1310809]|0)>>>0){ap()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L1377}}}while(0);if(A>>>0<(c[1310809]|0)>>>0){ap()}c[A+24>>2]=p;t=c[a+(l+16|0)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[1310809]|0)>>>0){ap()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20|0)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[1310809]|0)>>>0){ap()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){ap()}A=a+(h-4|0)|0;e=c[A>>2]|0;if((e&1|0)==0){ap()}do{if((e&2|0)==0){if((j|0)==(c[1310811]|0)){B=(c[1310808]|0)+r|0;c[1310808]=B;c[1310811]=q;c[q+4>>2]=B|1;if((q|0)==(c[1310810]|0)){c[1310810]=0;c[1310807]=0}if(B>>>0<=(c[1310812]|0)>>>0){return}a0(0);return}if((j|0)==(c[1310810]|0)){B=(c[1310807]|0)+r|0;c[1310807]=B;c[1310810]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L1482:do{if(e>>>0<256){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=5243260+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[1310809]|0)>>>0){ap()}if((c[u+12>>2]|0)==(j|0)){break}ap()}}while(0);if((g|0)==(u|0)){c[1310805]=c[1310805]&(1<<C^-1);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[1310809]|0)>>>0){ap()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}ap()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16|0)>>2]|0;t=c[a+(h|4)>>2]|0;L1503:do{if((t|0)==(b|0)){p=a+(h+12|0)|0;v=c[p>>2]|0;do{if((v|0)==0){m=a+(h+8|0)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break L1503}else{F=k;G=m;break}}else{F=v;G=p}}while(0);while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[1310809]|0)>>>0){ap()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[1310809]|0)>>>0){ap()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){ap()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{ap()}}}while(0);if((f|0)==0){break}t=a+(h+20|0)|0;u=5243524+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[1310806]=c[1310806]&(1<<c[t>>2]^-1);break L1482}else{if(f>>>0<(c[1310809]|0)>>>0){ap()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L1482}}}while(0);if(E>>>0<(c[1310809]|0)>>>0){ap()}c[E+24>>2]=f;b=c[a+(h+8|0)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[1310809]|0)>>>0){ap()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12|0)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[1310809]|0)>>>0){ap()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[1310810]|0)){H=B;break}c[1310807]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256){d=r<<1;e=5243260+(d<<2)|0;A=c[1310805]|0;E=1<<r;do{if((A&E|0)==0){c[1310805]=A|E;I=e;J=5243260+(d+2<<2)|0}else{r=5243260+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[1310809]|0)>>>0){I=h;J=r;break}ap()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=(14-(E|J|d)|0)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=5243524+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[1310806]|0;d=1<<K;do{if((r&d|0)==0){c[1310806]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=1133;break}else{A=A<<1;J=E}}if((N|0)==1133){if(M>>>0<(c[1310809]|0)>>>0){ap()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[1310809]|0;if(J>>>0<E>>>0){ap()}if(B>>>0<E>>>0){ap()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[1310813]|0)-1|0;c[1310813]=q;if((q|0)==0){O=5243676}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[1310813]=-1;return}function a$(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=aZ(b)|0;return d|0}if(b>>>0>4294967231){c[am()>>2]=12;d=0;return d|0}if(b>>>0<11){e=16}else{e=b+11&-8}f=a1(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=aZ(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;a4(f|0,a|0,(g>>>0<b>>>0?g:b)|0);a_(a);d=f;return d|0}function a0(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;do{if((c[1310735]|0)==0){b=aj(8)|0;if((b-1&b|0)==0){c[1310737]=b;c[1310736]=b;c[1310738]=-1;c[1310739]=2097152;c[1310740]=0;c[1310916]=0;c[1310735]=ar(0)&-16^1431655768;break}else{ap();return 0}}}while(0);if(a>>>0>=4294967232){d=0;e=d&1;return e|0}b=c[1310811]|0;if((b|0)==0){d=0;e=d&1;return e|0}f=c[1310808]|0;do{if(f>>>0>(a+40|0)>>>0){g=c[1310737]|0;h=X(((((((-40-a|0)-1|0)+f|0)+g|0)>>>0)/(g>>>0)>>>0)-1|0,g);i=b;j=5243668;while(1){k=c[j>>2]|0;if(k>>>0<=i>>>0){if((k+(c[j+4>>2]|0)|0)>>>0>i>>>0){l=j;break}}k=c[j+8>>2]|0;if((k|0)==0){l=0;break}else{j=k}}if((c[l+12>>2]&8|0)!=0){break}j=aq(0)|0;i=l+4|0;if((j|0)!=((c[l>>2]|0)+(c[i>>2]|0)|0)){break}k=aq(-(h>>>0>2147483646?-2147483648-g|0:h)|0)|0;m=aq(0)|0;if(!((k|0)!=-1&m>>>0<j>>>0)){break}k=j-m|0;if((j|0)==(m|0)){break}c[i>>2]=(c[i>>2]|0)-k|0;c[1310913]=(c[1310913]|0)-k|0;i=c[1310811]|0;n=(c[1310808]|0)-k|0;k=i;o=i+8|0;if((o&7|0)==0){p=0}else{p=-o&7}o=n-p|0;c[1310811]=k+p|0;c[1310808]=o;c[k+(p+4|0)>>2]=o|1;c[k+(n+4|0)>>2]=40;c[1310812]=c[1310739]|0;d=(j|0)!=(m|0);e=d&1;return e|0}}while(0);if((c[1310808]|0)>>>0<=(c[1310812]|0)>>>0){d=0;e=d&1;return e|0}c[1310812]=-1;d=0;e=d&1;return e|0}function a1(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[1310809]|0;if(g>>>0<j>>>0){ap();return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){ap();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){ap();return 0}if((k|0)==0){if(b>>>0<256){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[1310737]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4|0)>>2]=k|3;c[l>>2]=c[l>>2]|1;a2(g+b|0,k);n=a;return n|0}if((i|0)==(c[1310811]|0)){k=(c[1310808]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4|0)>>2]=l|1;c[1310811]=g+b|0;c[1310808]=l;n=a;return n|0}if((i|0)==(c[1310810]|0)){l=(c[1310807]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15){c[d>>2]=e&1|b|2;c[g+(b+4|0)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4|0)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4|0)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[1310807]=q;c[1310810]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;L1703:do{if(m>>>0<256){l=c[g+(f+8|0)>>2]|0;k=c[g+(f+12|0)>>2]|0;o=5243260+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){ap();return 0}if((c[l+12>>2]|0)==(i|0)){break}ap();return 0}}while(0);if((k|0)==(l|0)){c[1310805]=c[1310805]&(1<<e^-1);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){ap();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}ap();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24|0)>>2]|0;t=c[g+(f+12|0)>>2]|0;L1724:do{if((t|0)==(o|0)){u=g+(f+20|0)|0;v=c[u>>2]|0;do{if((v|0)==0){w=g+(f+16|0)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break L1724}else{z=x;A=w;break}}else{z=v;A=u}}while(0);while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){ap();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8|0)>>2]|0;if(u>>>0<j>>>0){ap();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){ap();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{ap();return 0}}}while(0);if((s|0)==0){break}t=g+(f+28|0)|0;l=5243524+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[1310806]=c[1310806]&(1<<c[t>>2]^-1);break L1703}else{if(s>>>0<(c[1310809]|0)>>>0){ap();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break L1703}}}while(0);if(y>>>0<(c[1310809]|0)>>>0){ap();return 0}c[y+24>>2]=s;o=c[g+(f+16|0)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[1310809]|0)>>>0){ap();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20|0)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[1310809]|0)>>>0){ap();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4|0)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;a2(g+b|0,q);n=a;return n|0}return 0}function a2(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L1779:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[1310809]|0;if(i>>>0<l>>>0){ap()}if((j|0)==(c[1310810]|0)){m=d+(b+4|0)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[1310807]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h|0)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256){p=c[d+(8-h|0)>>2]|0;q=c[d+(12-h|0)>>2]|0;r=5243260+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){ap()}if((c[p+12>>2]|0)==(j|0)){break}ap()}}while(0);if((q|0)==(p|0)){c[1310805]=c[1310805]&(1<<m^-1);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){ap()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}ap()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h|0)>>2]|0;t=c[d+(12-h|0)>>2]|0;L1813:do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4|0)|0;w=c[v>>2]|0;do{if((w|0)==0){x=d+u|0;y=c[x>>2]|0;if((y|0)==0){z=0;break L1813}else{A=y;B=x;break}}else{A=w;B=v}}while(0);while(1){v=A+20|0;w=c[v>>2]|0;if((w|0)!=0){A=w;B=v;continue}v=A+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{A=w;B=v}}if(B>>>0<l>>>0){ap()}else{c[B>>2]=0;z=A;break}}else{v=c[d+(8-h|0)>>2]|0;if(v>>>0<l>>>0){ap()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){ap()}u=t+8|0;if((c[u>>2]|0)==(r|0)){c[w>>2]=t;c[u>>2]=v;z=t;break}else{ap()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h|0)|0;l=5243524+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=z;if((z|0)!=0){break}c[1310806]=c[1310806]&(1<<c[t>>2]^-1);n=j;o=k;break L1779}else{if(m>>>0<(c[1310809]|0)>>>0){ap()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=z}else{c[m+20>>2]=z}if((z|0)==0){n=j;o=k;break L1779}}}while(0);if(z>>>0<(c[1310809]|0)>>>0){ap()}c[z+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[1310809]|0)>>>0){ap()}else{c[z+16>>2]=t;c[t+24>>2]=z;break}}}while(0);t=c[d+(r+4|0)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[1310809]|0)>>>0){ap()}else{c[z+20>>2]=t;c[t+24>>2]=z;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[1310809]|0;if(e>>>0<a>>>0){ap()}z=d+(b+4|0)|0;A=c[z>>2]|0;do{if((A&2|0)==0){if((f|0)==(c[1310811]|0)){B=(c[1310808]|0)+o|0;c[1310808]=B;c[1310811]=n;c[n+4>>2]=B|1;if((n|0)!=(c[1310810]|0)){return}c[1310810]=0;c[1310807]=0;return}if((f|0)==(c[1310810]|0)){B=(c[1310807]|0)+o|0;c[1310807]=B;c[1310810]=n;c[n+4>>2]=B|1;c[n+B>>2]=B;return}B=(A&-8)+o|0;s=A>>>3;L1878:do{if(A>>>0<256){g=c[d+(b+8|0)>>2]|0;t=c[d+(b+12|0)>>2]|0;h=5243260+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){ap()}if((c[g+12>>2]|0)==(f|0)){break}ap()}}while(0);if((t|0)==(g|0)){c[1310805]=c[1310805]&(1<<s^-1);break}do{if((t|0)==(h|0)){C=t+8|0}else{if(t>>>0<a>>>0){ap()}m=t+8|0;if((c[m>>2]|0)==(f|0)){C=m;break}ap()}}while(0);c[g+12>>2]=t;c[C>>2]=g}else{h=e;m=c[d+(b+24|0)>>2]|0;l=c[d+(b+12|0)>>2]|0;L1899:do{if((l|0)==(h|0)){i=d+(b+20|0)|0;p=c[i>>2]|0;do{if((p|0)==0){q=d+(b+16|0)|0;v=c[q>>2]|0;if((v|0)==0){D=0;break L1899}else{E=v;F=q;break}}else{E=p;F=i}}while(0);while(1){i=E+20|0;p=c[i>>2]|0;if((p|0)!=0){E=p;F=i;continue}i=E+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{E=p;F=i}}if(F>>>0<a>>>0){ap()}else{c[F>>2]=0;D=E;break}}else{i=c[d+(b+8|0)>>2]|0;if(i>>>0<a>>>0){ap()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){ap()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;D=l;break}else{ap()}}}while(0);if((m|0)==0){break}l=d+(b+28|0)|0;g=5243524+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=D;if((D|0)!=0){break}c[1310806]=c[1310806]&(1<<c[l>>2]^-1);break L1878}else{if(m>>>0<(c[1310809]|0)>>>0){ap()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=D}else{c[m+20>>2]=D}if((D|0)==0){break L1878}}}while(0);if(D>>>0<(c[1310809]|0)>>>0){ap()}c[D+24>>2]=m;h=c[d+(b+16|0)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[1310809]|0)>>>0){ap()}else{c[D+16>>2]=h;c[h+24>>2]=D;break}}}while(0);h=c[d+(b+20|0)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[1310809]|0)>>>0){ap()}else{c[D+20>>2]=h;c[h+24>>2]=D;break}}}while(0);c[n+4>>2]=B|1;c[n+B>>2]=B;if((n|0)!=(c[1310810]|0)){G=B;break}c[1310807]=B;return}else{c[z>>2]=A&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;G=o}}while(0);o=G>>>3;if(G>>>0<256){A=o<<1;z=5243260+(A<<2)|0;D=c[1310805]|0;b=1<<o;do{if((D&b|0)==0){c[1310805]=D|b;H=z;I=5243260+(A+2<<2)|0}else{o=5243260+(A+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[1310809]|0)>>>0){H=d;I=o;break}ap()}}while(0);c[I>>2]=n;c[H+12>>2]=n;c[n+8>>2]=H;c[n+12>>2]=z;return}z=n;H=G>>>8;do{if((H|0)==0){J=0}else{if(G>>>0>16777215){J=31;break}I=(H+1048320|0)>>>16&8;A=H<<I;b=(A+520192|0)>>>16&4;D=A<<b;A=(D+245760|0)>>>16&2;o=(14-(b|I|A)|0)+(D<<A>>>15)|0;J=G>>>((o+7|0)>>>0)&1|o<<1}}while(0);H=5243524+(J<<2)|0;c[n+28>>2]=J;c[n+20>>2]=0;c[n+16>>2]=0;o=c[1310806]|0;A=1<<J;if((o&A|0)==0){c[1310806]=o|A;c[H>>2]=z;c[n+24>>2]=H;c[n+12>>2]=n;c[n+8>>2]=n;return}if((J|0)==31){K=0}else{K=25-(J>>>1)|0}J=G<<K;K=c[H>>2]|0;while(1){if((c[K+4>>2]&-8|0)==(G|0)){break}L=K+16+(J>>>31<<2)|0;H=c[L>>2]|0;if((H|0)==0){M=1439;break}else{J=J<<1;K=H}}if((M|0)==1439){if(L>>>0<(c[1310809]|0)>>>0){ap()}c[L>>2]=z;c[n+24>>2]=K;c[n+12>>2]=n;c[n+8>>2]=n;return}L=K+8|0;M=c[L>>2]|0;J=c[1310809]|0;if(K>>>0<J>>>0){ap()}if(M>>>0<J>>>0){ap()}c[M+12>>2]=z;c[L>>2]=z;c[n+8>>2]=M;c[n+12>>2]=K;c[n+24>>2]=0;return}function a3(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function a4(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2]|0;b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function a5(b){b=b|0;var c=0;c=b;while(a[c]|0!=0){c=c+1|0}return c-b|0}function a6(a,b,c){a=a|0;b=+b;c=c|0;as[a&1](+b,c|0)}function a7(a,b){a=a|0;b=b|0;at[a&1](b|0)}function a8(a,b){a=a|0;b=b|0;return au[a&1](b|0)|0}function a9(a){a=a|0;av[a&1]()}function ba(a,b,c){a=a|0;b=b|0;c=c|0;return aw[a&1](b|0,c|0)|0}function bb(a,b){a=+a;b=b|0;Y(0)}function bc(a){a=a|0;Y(1)}function bd(a){a=a|0;Y(2);return 0}function be(){Y(3)}function bf(a,b){a=a|0;b=b|0;Y(4);return 0}
// EMSCRIPTEN_END_FUNCS
var as=[bb,bb];var at=[bc,bc];var au=[bd,bd];var av=[be,be];var aw=[bf,bf];return{_Potrace_traceBitmap:aX,_strlen:a5,_free:a_,_Potrace_createBitmap:aV,_Potrace_freeBitmap:aW,_realloc:a$,_memset:a3,_malloc:aZ,_memcpy:a4,_Potrace_bitmapPut:aS,_Potrace_freeState:aY,_Potrace_wordSize:aQ,_Potrace_Path_getNext:aT,stackAlloc:ax,stackSave:ay,stackRestore:az,setThrew:aA,setTempRet0:aB,setTempRet1:aC,setTempRet2:aD,setTempRet3:aE,setTempRet4:aF,setTempRet5:aG,setTempRet6:aH,setTempRet7:aI,setTempRet8:aJ,setTempRet9:aK,dynCall_vfi:a6,dynCall_vi:a7,dynCall_ii:a8,dynCall_v:a9,dynCall_iii:ba}})
// EMSCRIPTEN_END_ASM
({ Math: Math, Int8Array: Int8Array, Int16Array: Int16Array, Int32Array: Int32Array, Uint8Array: Uint8Array, Uint16Array: Uint16Array, Uint32Array: Uint32Array, Float32Array: Float32Array, Float64Array: Float64Array }, { abort: abort, assert: assert, asmPrintInt: asmPrintInt, asmPrintFloat: asmPrintFloat, copyTempDouble: copyTempDouble, copyTempFloat: copyTempFloat, min: Math_min, invoke_vfi: invoke_vfi, invoke_vi: invoke_vi, invoke_ii: invoke_ii, invoke_v: invoke_v, invoke_iii: invoke_iii, _llvm_lifetime_end: _llvm_lifetime_end, _sysconf: _sysconf, _fabs: _fabs, ___setErrNo: ___setErrNo, ___errno_location: ___errno_location, _sqrt: _sqrt, _llvm_lifetime_start: _llvm_lifetime_start, _abort: _abort, _sbrk: _sbrk, _time: _time, STACKTOP: STACKTOP, STACK_MAX: STACK_MAX, tempDoublePtr: tempDoublePtr, ABORT: ABORT, NaN: NaN, Infinity: Infinity }, buffer);
var _Potrace_traceBitmap = Module["_Potrace_traceBitmap"] = asm._Potrace_traceBitmap;
var _strlen = Module["_strlen"] = asm._strlen;
var _free = Module["_free"] = asm._free;
var _Potrace_createBitmap = Module["_Potrace_createBitmap"] = asm._Potrace_createBitmap;
var _Potrace_freeBitmap = Module["_Potrace_freeBitmap"] = asm._Potrace_freeBitmap;
var _realloc = Module["_realloc"] = asm._realloc;
var _memset = Module["_memset"] = asm._memset;
var _malloc = Module["_malloc"] = asm._malloc;
var _memcpy = Module["_memcpy"] = asm._memcpy;
var _Potrace_bitmapPut = Module["_Potrace_bitmapPut"] = asm._Potrace_bitmapPut;
var _Potrace_freeState = Module["_Potrace_freeState"] = asm._Potrace_freeState;
var _Potrace_wordSize = Module["_Potrace_wordSize"] = asm._Potrace_wordSize;
var _Potrace_Path_getNext = Module["_Potrace_Path_getNext"] = asm._Potrace_Path_getNext;
var dynCall_vfi = Module["dynCall_vfi"] = asm.dynCall_vfi;
var dynCall_vi = Module["dynCall_vi"] = asm.dynCall_vi;
var dynCall_ii = Module["dynCall_ii"] = asm.dynCall_ii;
var dynCall_v = Module["dynCall_v"] = asm.dynCall_v;
var dynCall_iii = Module["dynCall_iii"] = asm.dynCall_iii;
Runtime.stackAlloc = function(size) { return asm.stackAlloc(size) };
Runtime.stackSave = function() { return asm.stackSave() };
Runtime.stackRestore = function(top) { asm.stackRestore(top) };
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(!Module['preRun'] || Module['preRun'].length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);
  var ret;
  var initialStackTop = STACKTOP;
  try {
    ret = Module['_main'](argc, argv, 0);
  }
  catch(e) {
    if (e.name == 'ExitStatus') {
      return e.status;
    } else if (e == 'SimulateInfiniteLoop') {
      Module['noExitRuntime'] = true;
    } else {
      throw e;
    }
  } finally {
    STACKTOP = initialStackTop;
  }
  return ret;
}
function run(args) {
  args = args || Module['arguments'];
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    var ret = 0;
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;
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

var _createBitmap = Module.cwrap('Potrace_createBitmap', 'number', ['number', 'number']);
var _traceBitmap = Module.cwrap('Potrace_traceBitmap', 'number', ['number']);
var _freeBitmap = Module.cwrap('Potrace_freeBitmap', null, ['number']);
var _freeState = Module.cwrap('Potrace_freeState', null, ['number']);
var _bitmapPut = Module.cwrap('Potrace_bitmapPut', null, ['number']);

var POTRACE_CURVETO = 1;
var POTRACE_CORNER = 2;

var POTRACE_STATUS_OK = 0;
var POTRACE_STATUS_INCOMPLETE = 1;

function PotraceBitmap(w, h) {
    var imageData, ptr, mapPtr;
    if (typeof w === 'object' || w instanceof ImageData) {
        imageData = w;
        w = imageData.width;
        h = imageData.height;
    }
    this.ptr = ptr = _createBitmap(w, h);
    if (ptr === null) {
        throw new Error('failed to create bitmap');
    }
    this.width = Module.getValue(ptr, 'i32');       ptr+=4;
    this.height = Module.getValue(ptr, 'i32');      ptr+=4;
    this.dy = Module.getValue(ptr, 'i32');          ptr+=4;
    this.size = this.dy * this.height;
    mapPtr = Module.getValue(ptr, 'i32');
    this.map = Module.HEAPU32.subarray(mapPtr, mapPtr + w*h);
    if (imageData) {
        this.putImageData(imageData);
    }
}

PotraceBitmap.prototype.putImageData = function (imageData) {
    var data = imageData.data;
    var i = 0, l, px, r, g, b, a, c;
    var contrast = 3.5;
    var threshold = 0.3;

    // DEBUG
    // var tmpctx = document.createElement('canvas').getContext('2d');
    // tmpctx.canvas.width = this.width;
    // tmpctx.canvas.height = this.height;
    // document.body.appendChild(tmpctx.canvas);

    // TODO: test if more than x% is black, if so try a different contrast/threshold? (RACIST!)

    i = 0;
    var blank = true;
    for (var y = 0, h = this.height; y < h; ++y) {
        for (var x = 0, w = this.width; x < w; ++x) {
            px = 4 * i++;
            r = data[px]/255;
            g = data[px+1]/255;
            b = data[px+2]/255;

            // TODO: use alpha
            a = data[px+3]/255;

            // grayscale and apply contrast
            l = 0.2126*r + 0.7152*g + 0.0722*b;
            c = (l - 0.5) * contrast + 0.5;
            c = c > threshold ? 0 : Math.round(a * 1);
            // set bit appropriately for threshold
            if (blank && c !== 0) blank = false;
            _bitmapPut(this.ptr, x, y, c);

            // DEBUG
            // if (c <= threshold) tmpctx.fillRect(x, y, 1, 1);
        }
    }
    this.blank = blank;
};

PotraceBitmap.prototype.trace = function () {
	if (this.blank) return false;
    var statePtr = _traceBitmap(this.ptr);
    if (statePtr === null) {
        throw new Error('failed to trace bitmap');
    }
    return new PotraceState(statePtr);
};

PotraceBitmap.prototype.free = function () {
    _freeBitmap(this.ptr);
    this.ptr = this.width = this.height = this.dy = this.size = this.map = null;
};


function PotraceState(statePtr) {
    var ptr, pathPtr;
    this.ptr = ptr = statePtr;
    this.status = Module.getValue(ptr, 'i32');       ptr+=4;
    pathPtr = Module.getValue(ptr, 'i32');
    this.path = new PotracePath(pathPtr);
}
PotraceState.prototype.free = function () {
    _freeState(this.ptr);
};

function PotracePath(pathPtr) {
    //console.log('path: '+pathPtr);
    var ptr, tagsPtr, cPtr, nextPtr;
    this.ptr = ptr = pathPtr;
    this.area = Module.getValue(ptr, 'i32');                            ptr+=4;
    this.sign = String.fromCharCode(Module.getValue(ptr, 'i32'));       ptr+=4; // '+' or '-', depending on orientation
    this.curve = {};
    this.curve.n = Module.getValue(ptr, 'i32');                         ptr+=4;
    tagsPtr = Module.getValue(ptr, 'i32');                              ptr+=4;
    this.curve.tags = copyIntArray(tagsPtr, this.curve.n);
    this.curve.c = [];
    cPtr = Module.getValue(ptr, 'i32');                                 ptr+=4;
    for (var i = 0; i < this.curve.n; ++i) {
        this.curve.c.push([
            copyDoublePoint(cPtr),
            copyDoublePoint(cPtr+16),
            copyDoublePoint(cPtr+32)
        ]);
        cPtr += 48;
    }
    this.nextPtr = Module.getValue(ptr, 'i32');                         ptr+=4;
    this.childlistPtr = Module.getValue(ptr, 'i32');                       ptr+=4;
    this.siblingPtr = Module.getValue(ptr, 'i32');                         ptr+=4;
}

PotracePath.prototype.next = function () {
    if (this._next) return this._next;
    var next = this.nextPtr;
    //console.log(next);
    if (next) {
        this._next = new PotracePath(next);
        return this._next;
    }
    return null;
};
PotracePath.prototype.sibling = function () {
    if (this._sibling) return this._sibling;
    var sibling = this.siblingPtr;
    //console.log(next);
    if (sibling) {
        this._sibling = new PotracePath(sibling);
        return this._sibling;
    }
    return null;
};
PotracePath.prototype.childlist = function () {
    if (this._childlist) return this._childlist;
    var childlist = this.childlistPtr;
    //console.log(next);
    if (childlist) {
        this._childlist = new PotracePath(childlist);
        return this._childlist;
    }
    return null;
};

function copyIntArray(ptr, len) {
    var array = [];
    for(var i=0; i<len; i++) {
        array.push(Module.getValue(ptr, 'i32'));
        ptr += 4;
    }
    return array;
}

var copyDoublePoint = function(ptr) {
    return [
        Module.getValue(ptr, 'double'),
        Module.getValue(ptr+8, 'double')
    ];
};
var worker = this;
this.addEventListener('message', function (ev) {
    var data = ev.data;
    var bitmap = new PotraceBitmap(data.imageData);
    var state = bitmap.trace();
    bitmap.free();
    if (state) {
        worker.postMessage({
            state: serializeState(state),
            color: data.color
        });
        state.free();
    }
});

function serializeState(state) {
    if (!state) return false;
    return {
        status: state.status,
        path: serializePath(state.path)
    };
}

function serializePath(path) {
    if (!path) return null;
    return {
        area: path.area,
        curve: path.curve,
        sign: path.sign,
        next: serializePath(path.next())
    };
}