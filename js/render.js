/* Renders the data in js/content.js into whichever mount points the page has.
   index.html has #decks, #projects and #contact; blog.html has #blog-list and
   #contact. Nothing here needs editing to add content — see content.js. */
(function () {
  var S = window.SITE || {};
  var esc = function (v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  /* 2026-11-21 becomes 11/21/2026. Dates stay ISO in content.js so they
     still sort, and only the display changes. Split rather than parsed:
     new Date("2026-11-21") reads as UTC midnight, which anywhere west of
     Greenwich renders as the day before. */
  var usDate = function (v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v == null ? "" : v).trim());
    return m ? m[2] + "/" + m[3] + "/" + m[1] : String(v == null ? "" : v);
  };
  var paras = function (b) {
    return blocks(b).map(function (p) {
      if (p && p.img) {
        return '<figure class="post-fig' + (p.light ? " light" : "") + '">' +
          '<img src="' + esc(p.img) + '" alt="' + esc(p.caption || "") + '" loading="lazy">' +
          (p.caption ? "<figcaption>" + esc(p.caption) + "</figcaption>" : "") + "</figure>";
      }
      return "<p>" + esc(p) + "</p>";
    }).join("");
  };
  /* --- authoring helpers --------------------------------------------------
     A body may be one string with blank lines between paragraphs, or a list.
     A line of the form ![caption](img/file.png) becomes a figure; add
     {light} after it to sit the picture on a white card. */
  var slug = function (t) {
    return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  };
  var blocks = function (body) {
    if (Array.isArray(body)) { return body; }
    return String(body || "").trim().split(/\n\s*\n/).map(function (chunk) {
      var line = chunk.trim();
      var m = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*(\{light\})?$/);
      if (m) { return { img: m[2], caption: m[1], light: !!m[3] }; }
      return line.replace(/\s*\n\s*/g, " ");
    }).filter(Boolean);
  };
  var plain = function (body) {
    return blocks(body).filter(function (b) { return typeof b === "string"; });
  };
  /* fields you can leave out, worked out from what you did write */
  var fill = function (item, i) {
    var o = {}, k;
    for (k in item) { if (Object.prototype.hasOwnProperty.call(item, k)) { o[k] = item[k]; } }
    var text = plain(o.body);
    o.id = o.id || slug(o.title || o.name) || "item-" + (i + 1);
    var cut = function (str, n) {
      if (str.length <= n) { return str; }
      var t = str.slice(0, n);
      return t.slice(0, Math.max(t.lastIndexOf(" "), n - 20)).replace(/[,;:.\s]+$/, "") + "\u2026";
    };
    o.excerpt = o.excerpt || cut(text[0] || "", 190);
    /* the home panel shows a longer run of the real writing, clearly trimmed */
    o.teaser = cut(text.join(" "), 330);
    o.blurb = o.blurb || cut((text[0] || "").split(/(?<=\.)\s/)[0], 54);
    if (!o.read) {
      var words = text.join(" ").split(/\s+/).length;
      o.read = Math.max(1, Math.round(words / 200)) + " min read";
    }
    return o;
  };
  var prepped = function (list) { return (list || []).map(fill); };

  var at = function () { return '<i class="at"></i>'; };
  var dot = function () { return '<i class="dot"></i>'; };
  var mount = function (id) { return document.getElementById(id); };

  /* the address, shown as pieces with images standing in for @ and . */
  function emailMarkup() {
    var e = S.email || [];
    return esc(e[0]) + at() + esc(e[1]) + dot() + esc(e[2]);
  }

  /* Reads a logo's own dominant colour off a canvas, so the glow behind
     each mark matches the file without anyone writing the colour down.
     Pixels are weighted by saturation, so a maroon square with white
     lettering reports maroon rather than pink. */
  function dominant(img) {
    var size = 24;
    var c = document.createElement("canvas");
    c.width = c.height = size;
    c.getContext("2d").drawImage(img, 0, 0, size, size);

    var px = c.getContext("2d").getImageData(0, 0, size, size).data;
    var r = 0, g = 0, b = 0, total = 0;

    for (var i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 24) { continue; }
      var hi = Math.max(px[i], px[i + 1], px[i + 2]);
      var lo = Math.min(px[i], px[i + 1], px[i + 2]);
      var weight = (hi - lo) / 255 + 0.06;      /* saturation, plus a floor */
      r += px[i] * weight; g += px[i + 1] * weight; b += px[i + 2] * weight;
      total += weight;
    }
    if (!total) { return null; }
    return lift(r / total, g / total, b / total);
  }

  /* A logo's own colour is usually too dark to glow against a dark page.
     This keeps the hue and pushes it to a fixed brightness and saturation,
     so maroon stays maroon but actually emits light. */
  function lift(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var hi = Math.max(r, g, b), lo = Math.min(r, g, b), h = 0, d = hi - lo;

    if (d) {
      if (hi === r)      { h = ((g - b) / d + (g < b ? 6 : 0)) / 6; }
      else if (hi === g) { h = ((b - r) / d + 2) / 6; }
      else               { h = ((r - g) / d + 4) / 6; }
    }

    var sat = 0.70, light = 0.50;
    var q = light + sat - light * sat;
    var pp = 2 * light - q;

    var channel = function (t) {
      if (t < 0) { t += 1; }
      if (t > 1) { t -= 1; }
      if (t < 1 / 6) { return pp + (q - pp) * 6 * t; }
      if (t < 1 / 2) { return q; }
      if (t < 2 / 3) { return pp + (q - pp) * (2 / 3 - t) * 6; }
      return pp;
    };

    /* carried as rgba: the glow should read as a hint of the colour, not
       a lamp behind a 32px badge */
    return "rgba(" + Math.round(channel(h + 1 / 3) * 255) + "," +
           Math.round(channel(h) * 255) + "," +
           Math.round(channel(h - 1 / 3) * 255) + ",0.34)";
  }

  function glows() {
    var marks = document.querySelectorAll("img.mark");
    Array.prototype.forEach.call(marks, function (img) {
      var paint = function () {
        try {
          var c = dominant(img);
          if (c) { img.style.setProperty("--glow", c); }
        } catch (e) { /* a tainted canvas just means no glow */ }
      };
      if (img.complete && img.naturalWidth) { paint(); }
      else { img.addEventListener("load", paint); }
    });
  }

  /* --- profile + latest post ------------------------------------------- */
  function decks() {
    var el = mount("decks");
    if (!el) { return; }

    var rows = (S.profile || []).map(function (r) {
      var mark = r[3]
        ? '<img class="mark" src="' + esc(r[3]) + '" alt="' + esc(r[4] || "") + '">'
        : "<span></span>";
      return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) +
        (r[2] ? '<span class="sep">|</span><span class="sub">' + esc(r[2]) + "</span>" : "") +
        "</dd>" + mark + "</div>";
    }).join("");

    var linkRows = (S.links || []).map(function (l) {
      return "<div><dt>" + esc(l[0]) + "</dt><dd>" + esc(l[1]) + "</dd>" +
        '<a class="btn" href="' + esc(l[2]) + '" target="_blank" rel="noopener">Open &#8599;</a></div>';
    }).join("");

    var emailRow = "<div><dt>Email</dt><dd class=\"addr\">" + emailMarkup() + "</dd>" +
      '<button class="btn" data-copy-email type="button">Copy</button></div>';

    var post = prepped(S.posts)[0];
    var postCard = post
      ? '<div class="card-h"><span>Latest post</span>' +
        '<span class="meta-chip">' + esc(usDate(post.date)) + "</span></div>" +
        '<div class="post"><h3>' + esc(post.title) + "</h3>" +
        '<p class="teaser">' + esc(post.teaser) + "</p>" +
        '<p><a class="btn" href="blog.html#' + esc(post.id) + '">Read post</a></p></div>'
      : '<div class="card-h"><span>Latest post</span></div>' +
        '<div class="post"><h3>Nothing published yet</h3>' +
        '<p class="empty">First post is on its way. Add one in js/content.js and it shows up here.</p>' +
        '<p><a class="btn" href="blog.html">Go to blog</a></p></div>';

    el.innerHTML =
      '<section class="card"><h2>Profile</h2><dl>' + rows + linkRows + emailRow + "</dl></section>" +
      '<section class="card">' + postCard + "</section>";

    glows();
  }

  /* --- projects: index bar and cards ------------------------------------ */
  function projects() {
    var el = mount("projects");
    if (!el) { return; }
    var list = prepped(S.projects);

    var index = '<nav class="card index" aria-label="Project index"><div class="card-h">' +
      '<span>Index</span><span class="tag">' + list.length + "</span></div>" +
      (list.length
        ? "<ol>" + list.map(function (p) {
            return '<li><a href="#' + esc(p.id) + '"><span class="n">' + esc(p.name) +
              '</span><span class="d">' + esc(p.blurb || "") + "</span></a></li>";
          }).join("") + "</ol>"
        : '<p class="empty-note">Nothing listed yet.</p>') + "</nav>";

    var cards = list.length
      ? list.map(function (p) {
          var btns = (p.links || []).map(function (l) {
            return '<a class="btn" href="' + esc(l[1]) + '" target="_blank" rel="noopener">' +
              esc(l[0]) + " &#8599;</a>";
          }).join(" ");
          return '<article class="card" id="' + esc(p.id) + '">' +
            '<div class="card-h"><span>' + esc(p.name) + "</span>" +
            (p.tag ? '<span class="tag">' + esc(p.tag) + "</span>" : "<span></span>") + "</div>" +
            '<div class="proj-body' + (p.image ? "" : " solo") + '">' +
            (p.image ? '<figure><img src="' + esc(p.image) + '" alt="" loading="lazy"></figure>' : "") +
            '<div class="proj-text"><h3>' + esc(p.title || p.name) + "</h3>" + paras(p.body) +
            (p.result ? '<p class="res"><b>Result</b>' + esc(p.result) + "</p>" : "") +
            (p.stack ? '<dl class="stack"><dt>Stack</dt><dd>' + esc(p.stack) + "</dd></dl>" : "") +
            (btns ? '<p class="btns">' + btns + "</p>" : "") +
            "</div></div></article>";
        }).join("")
      : '<section class="card"><div class="card-h"><span>Projects</span></div>' +
        '<div class="post"><h3>Nothing here yet</h3>' +
        '<p class="empty">Add a project to the <code>projects</code> list in ' +
        "js/content.js and it shows up here and in the index.</p></div></section>";

    el.innerHTML =
      '<div class="sec-h"><h2>Projects</h2><span class="count">' + list.length +
      (list.length === 1 ? " entry" : " entries") + "</span></div>" +
      '<div class="proj-layout">' + index + '<div class="proj-list">' + cards + "</div></div>";

    spy(list);
  }

  /* Mark the nav link for wherever you are. A link to another file is
     current only when that file IS this page; an in-page anchor becomes
     current while its section is in view, the same way the project index
     works. Runs on both pages from the one function. */
  function navspy() {
    var links = [].slice.call(document.querySelectorAll(".nav a"));
    if (!links.length) { return; }

    var here = location.pathname.split("/").pop() || "index.html";
    var hashed = [];

    links.forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var cut = href.indexOf("#");
      var file = (cut === -1 ? href : href.slice(0, cut)).split("/").pop();
      var id = cut === -1 ? "" : href.slice(cut + 1);

      if (file && file !== here) { return; }       /* another page entirely */
      if (!id) { a.setAttribute("aria-current", "page"); return; }
      var sec = document.getElementById(id);
      if (sec) { hashed.push({ a: a, sec: sec, id: id }); }
    });

    if (!hashed.length || !window.IntersectionObserver) { return; }

    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
      var on = hashed.filter(function (h) { return seen[h.id]; })[0];
      hashed.forEach(function (h) {
        if (on && h === on) { h.a.setAttribute("aria-current", "true"); }
        else { h.a.removeAttribute("aria-current"); }
      });
    }, { rootMargin: "-64px 0px -55% 0px" });

    hashed.forEach(function (h) { io.observe(h.sec); });
  }

  /* Highlight the index entry for whichever card you are reading.

     This used to ask an IntersectionObserver for the first card touching
     a band near the top of the screen, which got the last entries wrong:
     a tall card only has to clip the band by a pixel to keep winning
     over the card actually filling the screen, and a card near the foot
     of the page may never reach the band at all before scrolling stops.

     So it measures instead: the current card is whichever one covers
     the most of the screen. */
  function spy(list) {
    var links = {};
    [].forEach.call(document.querySelectorAll(".index a"), function (a) {
      links[a.getAttribute("href").slice(1)] = a;
    });
    var nodes = list.map(function (p) {
      return { id: p.id, el: document.getElementById(p.id) };
    }).filter(function (n) { return n.el; });
    if (!nodes.length) { return; }

    var TOP = 120;   /* the fixed bar, plus a little breathing room */

    /* Whichever card covers the most screen is the one being read. Not
       "the first card past a line": the last cards never cross one,
       because the page stops scrolling while they are still low on the
       screen, which is why they could never be selected. Area has no
       such dead zone, and needs no special case at the foot of the
       page. */
    function pick() {
      var vh = window.innerHeight, best = null, bestSeen = -1;

      nodes.forEach(function (n) {
        var r = n.el.getBoundingClientRect();
        var seen = Math.min(r.bottom, vh) - Math.max(r.top, TOP);
        if (seen > bestSeen) { bestSeen = seen; best = n; }
      });

      var id = best ? best.id : nodes[0].id;

      /* Area alone still cannot reach the final entry when the last card
         is shorter than the one above it: at the foot of the page both
         are fully on screen and the taller one always wins. Once there
         is nothing left to scroll, you are looking at the last card. */
      if (window.innerHeight + window.pageYOffset >=
          document.documentElement.scrollHeight - 2) {
        id = nodes[nodes.length - 1].id;
      }

      Object.keys(links).forEach(function (k) {
        if (k === id) { links[k].setAttribute("aria-current", "true"); }
        else { links[k].removeAttribute("aria-current"); }
      });
    }

    var queued = false;
    function onScroll() {
      if (queued) { return; }
      queued = true;
      window.requestAnimationFrame(function () { queued = false; pick(); });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    pick();
  }

  /* --- blog page -------------------------------------------------------- */
  function blog() {
    var el = mount("blog-list");
    if (!el) { return; }
    var list = prepped(S.posts);

    function byId(id) {
      return list.filter(function (p) { return p.id === id; })[0];
    }

    function renderList() {
      var head = '<div class="log-h"><span>#</span><span>Date</span><span>Entry</span></div>';
      if (!list.length) {
        el.innerHTML = '<div class="log">' + head +
          '<div class="log-empty">No entries yet. Add one to the <code>posts</code> list ' +
          "in js/content.js.</div></div>";
        return;
      }
      el.innerHTML = '<div class="log">' + head + list.map(function (p, i) {
        var n = list.length - i;
        return '<a class="log-row" href="#' + esc(p.id) + '">' +
          '<span class="no">' + n + "</span>" +
          '<span class="date">' + esc(usDate(p.date)) + "</span>" +
          '<span class="entry"><span class="t">' + esc(p.title) + "</span>" +
          "<span class=\"x\">" + esc(p.excerpt || "") + "</span></span></a>";
      }).join("") + "</div>";
    }

    function renderPost(p) {
      el.innerHTML = '<p class="backrow"><a class="btn" href="blog.html">&#8592; Back to blog</a></p>' +
        '<article class="post-view"><h1>' + esc(p.title) + "</h1>" +
        '<dl class="post-meta">' +
        "<div><dt>Published</dt><dd>" + esc(usDate(p.date)) + "</dd></div>" +
        (S.author ? "<div><dt>Author</dt><dd>" + esc(S.author) + "</dd></div>" : "") +
        (p.read ? "<div><dt>Length</dt><dd>" + esc(p.read) + "</dd></div>" : "") +
        "</dl><div class=\"post-body\">" + paras(p.body && p.body.length ? p.body : p.excerpt) +
        "</div></article>";
    }

    function route() {
      var id = decodeURIComponent(location.hash.slice(1));
      var p = id && byId(id);
      document.body.classList.toggle("reading", !!p);
      if (p) { renderPost(p); } else { renderList(); }
      window.scrollTo(0, 0);
    }
    window.addEventListener("hashchange", route);
    route();
  }

  /* --- contact bar ------------------------------------------------------ */
  function contact() {
    var el = mount("contact");
    if (!el) { return; }
    var links = (S.links || []).map(function (l) {
      return '<a class="btn" href="' + esc(l[2]) + '" target="_blank" rel="noopener">' +
        '<span class="k">' + esc(l[0]) + '</span>' +
        '<span class="v">: ' + esc(l[1]) + " &#8599;</span></a>";
    }).join("");
    el.innerHTML = '<div class="in"><span class="lab">Contact</span><div class="items">' +
      '<button class="btn" data-copy-email type="button">' +
      '<span class="k">Email</span><span class="v">: ' + emailMarkup() + "</span></button>" +
      links + '<a class="btn" href="#top"><span class="v">Back to </span>' +
      '<span class="k">top</span></a></div></div>';
  }

  /* --- copy buttons ----------------------------------------------------- */
  function copyButtons() {
    var parts = S.email || [];
    [].forEach.call(document.querySelectorAll("[data-copy-email]"), function (b) {
      var original = b.innerHTML;
      b.addEventListener("click", function () {
        var addr = parts[0] + String.fromCharCode(64) + parts[1] + "." + parts[2];
        var legacy = function () {
          var t = document.createElement("textarea");
          t.value = addr;
          t.setAttribute("readonly", "");
          t.style.cssText = "position:fixed;top:0;left:0;opacity:0";
          document.body.appendChild(t);
          t.select();
          var ok = false;
          try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
          document.body.removeChild(t);
          return ok;
        };
        var done = function (ok) {
          b.textContent = ok ? "Copied" : "Copy failed";
          setTimeout(function () { b.innerHTML = original; }, 1600);
        };
        if (navigator.clipboard) {
          navigator.clipboard.writeText(addr).then(function () { done(true); },
                                                   function () { done(legacy()); });
        } else { done(legacy()); }
      });
    });
  }

  decks();
  projects();
  blog();
  contact();
  copyButtons();
  navspy();
})();
