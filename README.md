# Potrace.js

Potrace vector tracing library Emscripten'd into JS.

**NOTE: this is a work in progress. It currently has basically no documentation. Use at your own risk and without any expectations of support.**

## Installing

You'll need [emscripten](https://github.com/kripken/emscripten).

I used [this vagrant vm](https://github.com/rhelmer/emscripten-vagrant), but I had to install zlib headers (`aptitude install zlib1g-dev`) before potrace would configure.

*Note: make sure the emscripten binaries are on your PATH first*

```
cd potrace
emconfigure ./configure
emmake make

cd ../src
./build.sh
```

## Potrace

Source is available [here](http://potrace.sourceforge.net/), potracelib docs [here](http://potrace.sourceforge.net/potracelib.pdf).


## License

Copyright 2015 Cameron Lakenen

Copyright 2001-2015 Peter Selinger

This project is a derivative work of the code from the Potrace project (http://potrace.sourceforge.net/), which is licensed GPLv2+. This code therefore is also licensed under the terms of the GNU Public License, version 2+.
