#!/bin/sh
mkdir -p build

# build potrace.js.o
emcc -I ../potrace/src potrace.js.cc -o build/potrace.js.o

#copy objects
cp ../potrace/src/*.o build

#potrace objects
POTRACE_OBJS="curve.o trace.o decompose.o potracelib.o"

#potrace.js objects
JS_OBJS="potrace.js.o"

#c++ exported functions
POTRACE_JS="'_Potrace_createBitmap','_Potrace_freeBitmap','_Potrace_traceBitmap','_Potrace_freeState','_Potrace_Path_getNext','_Potrace_bitmapPut','_Potrace_wordSize'"

#build
cd build
emcc -O2 -s ASM_JS=1 $POTRACE_OBJS $JS_OBJS -o ../potrace.js \
	-s WARN_ON_UNDEFINED_SYMBOLS=1 -s EXPORTED_FUNCTIONS="[$POTRACE_JS]"
