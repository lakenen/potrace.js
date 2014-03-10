# Potrace.js

Potrace vector tracing library Emscripten'd into JS.

## Installing

You'll need [emscripten](https://github.com/kripken/emscripten).

I used [this vagrant vm](https://github.com/rhelmer/emscripten-vagrant), but I had to install zlib headers (`aptitude install zlib1g-dev`) before potrace would configure.

I used 

```
cd potrace
emconfigure ./configure
emmake make

cd ../src
./build.sh
```

## Potrace

Source is available [here](http://potrace.sourceforge.net/), potracelib docs [here](http://potrace.sourceforge.net/potracelib.pdf).
