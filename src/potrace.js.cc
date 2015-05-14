#include <string.h>
#include <errno.h>
#include <stdlib.h>

#include "potracelib.h"

/* auxiliary bitmap functions */

/* macros for writing individual bitmap pixels */
#define BM_WORDSIZE ((int)sizeof(potrace_word))
#define BM_WORDBITS (8*BM_WORDSIZE)
#define BM_HIBIT (((potrace_word)1)<<(BM_WORDBITS-1))
#define bm_scanline(bm, y) ((bm)->map + (y)*(bm)->dy)
#define bm_index(bm, x, y) (&bm_scanline(bm, y)[(x)/BM_WORDBITS])
#define bm_mask(x) (BM_HIBIT >> ((x) & (BM_WORDBITS-1)))
#define bm_range(x, a) ((int)(x) >= 0 && (int)(x) < (a))
#define bm_safe(bm, x, y) (bm_range(x, (bm)->w) && bm_range(y, (bm)->h))
#define BM_USET(bm, x, y) (*bm_index(bm, x, y) |= bm_mask(x))
#define BM_UCLR(bm, x, y) (*bm_index(bm, x, y) &= ~bm_mask(x))
#define BM_UPUT(bm, x, y, b) ((b) ? BM_USET(bm, x, y) : BM_UCLR(bm, x, y))
#define BM_PUT(bm, x, y, b) (bm_safe(bm, x, y) ? BM_UPUT(bm, x, y, b) : 0)

/* return new un-initialized bitmap. NULL with errno on error */
static potrace_bitmap_t *bm_new(int w, int h) {
  potrace_bitmap_t *bm;
  int dy = (w + BM_WORDBITS - 1) / BM_WORDBITS;

  bm = (potrace_bitmap_t *) malloc(sizeof(potrace_bitmap_t));
  if (!bm) {
    return NULL;
  }
  bm->w = w;
  bm->h = h;
  bm->dy = dy;
  bm->map = (potrace_word *) malloc(dy * h * BM_WORDSIZE);
  if (!bm->map) {
    free(bm);
    return NULL;
  }
  return bm;
}

/* free a bitmap */
static void bm_free(potrace_bitmap_t *bm) {
  if (bm != NULL) {
    free(bm->map);
  }
  free(bm);
}

extern "C" {

  potrace_bitmap_t *Potrace_createBitmap(int w, int h) {
    return bm_new(w, h);
  }

  void Potrace_freeBitmap(potrace_bitmap_t *bm) {
    bm_free(bm);
  }

  potrace_state_t *Potrace_traceBitmap(potrace_bitmap_t *bm, int turdsize, double alphamax, int opticurve) {
    potrace_param_t *param;
    potrace_state_t *st;
    param = potrace_param_default();
    param->turdsize = turdsize;
    param->alphamax = alphamax;
    param->opticurve = opticurve;
    st = potrace_trace(param, bm);
    if (!st || st->status != POTRACE_STATUS_OK) {
      // error!
      return NULL;
    }
    potrace_param_free(param);
    return st;
  }

  void Potrace_freeState(potrace_state_t *st) {
    potrace_state_free(st);
  }

  void Potrace_bitmapPut(potrace_bitmap_t *bm, int x, int y, potrace_word b) {
      BM_UPUT(bm, x, y, b);
  }
}
