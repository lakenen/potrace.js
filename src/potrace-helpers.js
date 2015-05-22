
var _createBitmap = Module.cwrap('Potrace_createBitmap', 'number', ['number', 'number']);
var _traceBitmap = Module.cwrap('Potrace_traceBitmap', 'number', ['number', 'number', 'number', 'number']);
var _freeBitmap = Module.cwrap('Potrace_freeBitmap', null, ['number']);
var _freeState = Module.cwrap('Potrace_freeState', null, ['number']);
var _bitmapPut = Module.cwrap('Potrace_bitmapPut', null, ['number']);

var POTRACE_CURVETO = 1;
var POTRACE_CORNER = 2;

var POTRACE_STATUS_OK = 0;
var POTRACE_STATUS_INCOMPLETE = 1;

// var CONTRAST = 1;

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

    var threshold = 0.28;

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
            // r = data[px]/255;
            // g = data[px+1]/255;
            // b = data[px+2]/255;

            // TODO: use alpha
            a = data[px+3]/255;

            // avg
            // l = (r + g + b) / 3;

            // luminosity
            // l = 0.21*r + 0.72*g + 0.07*b;

            // max decomposition
            // l = Math.max(r, g, b);

            // min decomposition
            // l = Math.min(r, g, b);

            // grayscale and apply contrast

            // c = (l - 0.5) * CONTRAST + 0.5;
            // c = c > threshold ? 0 : Math.round(a * 1);
            // set bit appropriately for threshold

            c = a ? 1 : 0
            if (blank && c !== 0) blank = false;
            _bitmapPut(this.ptr, x, y, c);

            // // DEBUG
            // tmpctx.fillStyle = c ? '#000' : '#fff';
            // // tmpctx.fillStyle = '#'+(~~(255*l)).toString(16)+(~~(255*l)).toString(16)+(~~(255*l)).toString(16);
            // tmpctx.fillRect(x, y, 1, 1);
        }
    }
    this.blank = blank;
};

PotraceBitmap.prototype.trace = function (params) {
    if (this.blank) {
        return false;
    }
    if (!params) {
        params = {};
    }
    params.turdsize = params.turdsize || 2
    params.alphamax = params.alphamax || 1
    params.opticurve = params.opticurve || 1
    var statePtr = _traceBitmap(this.ptr, params.turdsize, params.alphamax, params.opticurve);
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
