/* Draws the hero piece onto a canvas and animates it.

   The piece (js/cloud-sea.js) hands back a grid of characters plus one palette
   index per cell. Each row is drawn as runs of same-coloured characters, which
   keeps it to a few thousand fillText calls a frame instead of 20,000.

   Swap pieces by dropping another file from ascii.rest in alongside this one
   and pointing PIECE at its global. */
(function () {
  var PIECE = window.CLOUD_SEA;

  window.initHeroArt = function () {
    var cv = document.getElementById("hero-art");
    if (!cv || !PIECE) { return; }

    var meta = PIECE.meta, W = meta.cols, H = meta.rows;
    var frame = PIECE.create();
    var color = new Uint8Array(W * H);
    var ctx = cv.getContext("2d", { alpha: false });
    var cell = 0, dpr = 1, started = 0, raf = null, lastDraw = -1;

    function layout() {
      var box = cv.parentNode;
      var cssW = box.clientWidth, cssH = box.clientHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(cssW * dpr);
      cv.height = Math.round(cssH * dpr);
      cv.style.width = cssW + "px";
      cv.style.height = cssH + "px";
      // Cover the band in both directions, like background-size: cover, then
      // crop whichever axis overflows. Glyphs are drawn larger than the cell
      // so the dots stay round rather than sparse.
      cell = Math.max(cssW / W, cssH / H);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.font = Math.round(cell * 1.9) + "px " + getComputedStyle(cv).fontFamily;
      // Hold the sun (col 150) in frame when the width overflows. On a
      // phone the crop is tight enough that the sun lands right behind the
      // summary, so there it is anchored off to the right and the darker
      // cloud field sits under the text instead.
      var artW = W * cell, artH = H * cell;
      var anchor = cssW < 700 ? 1.32 : 0.72;
      cv.dataset.ox = Math.min(0, Math.max(cssW - artW, cssW * anchor - 150 * cell));
      // sit the horizon (row 40) a little past the middle of the band, which
      // keeps the bright sky clear of the text block above it
      cv.dataset.oy = Math.min(0, Math.max(cssH - artH, cssH * 0.56 - 40 * cell));
      lastDraw = -1;
    }

    function draw(t) {
      var text = frame(t, { color: color });
      var rows = text.split("\n");
      var ox = +cv.dataset.ox, oy = +cv.dataset.oy;
      ctx.fillStyle = meta.ground;
      ctx.fillRect(0, 0, cv.width, cv.height);
      for (var r = 0; r < H; r++) {
        var y = oy + (r + 0.5) * cell;
        if (y < -cell || y > cv.height / dpr + cell) { continue; }
        var line = rows[r], x = 0;
        while (x < W) {
          var i = r * W + x;
          if (line[x] === " ") { x++; continue; }
          var c = color[i], run = x, s = "";
          while (run < W && line[run] !== " " && color[r * W + run] === c) { s += line[run]; run++; }
          ctx.fillStyle = meta.palette[c];
          ctx.fillText(s, ox + x * cell, y);
          x = run;
        }
      }
    }

    var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (!started) { started = now; }
      var t = (now - started) / 1000;
      var step = Math.floor(t * meta.fps);
      if (step === lastDraw) { return; }
      lastDraw = step;
      draw(step / meta.fps);
    }

    layout();
    if (still) {
      draw(2.6);
    } else {
      raf = requestAnimationFrame(tick);
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
          if (raf) { cancelAnimationFrame(raf); raf = null; }
        } else if (!raf) {
          started = 0; raf = requestAnimationFrame(tick);
        }
      });
    }

    var tid;
    window.addEventListener("resize", function () {
      clearTimeout(tid);
      tid = setTimeout(function () { layout(); if (still) { draw(2.6); } }, 150);
    });
  };
})();
