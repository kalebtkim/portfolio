/* The dim light that follows the cursor over anything interactive.

   One listener on the document instead of one per element, so this keeps
   working for the project cards and index entries that render.js builds
   after this file has already run. CSS owns the look; all this does is
   report where the pointer is, in element coordinates. */
(function () {
  "use strict";

  var SEL = ".brand, .nav a, .acts a, .index a, a.log-row, .btn";

  document.addEventListener("pointermove", function (e) {
    var el = e.target && e.target.closest ? e.target.closest(SEL) : null;
    if (!el) { return; }
    var r = el.getBoundingClientRect();
    el.style.setProperty("--gx", (e.clientX - r.left) + "px");
    el.style.setProperty("--gy", (e.clientY - r.top) + "px");
  }, { passive: true });
}());
