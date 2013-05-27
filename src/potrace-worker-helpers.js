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