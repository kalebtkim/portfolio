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

  /* --- profile + latest post ------------------------------------------- */
  function decks() {
    var el = mount("decks");
    if (!el) { return; }

    var rows = (S.profile || []).map(function (r) {
      return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) +
        (r[2] ? '<span class="sep">|</span><span class="sub">' + esc(r[2]) + "</span>" : "") + "</dd><span></span></div>";
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
        '<span class="meta-chip">' + esc(post.date) + "</span></div>" +
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

  /* highlight the index entry for whichever card is in view */
  function spy(list) {
    if (!window.IntersectionObserver || !list.length) { return; }
    var links = {};
    [].forEach.call(document.querySelectorAll(".index a"), function (a) {
      links[a.getAttribute("href").slice(1)] = a;
    });
    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
      var current = list.filter(function (p) { return seen[p.id]; })[0];
      Object.keys(links).forEach(function (id) {
        if (current && id === current.id) { links[id].setAttribute("aria-current", "true"); }
        else { links[id].removeAttribute("aria-current"); }
      });
    }, { rootMargin: "-64px 0px -55% 0px" });
    list.forEach(function (p) {
      var n = document.getElementById(p.id);
      if (n) { io.observe(n); }
    });
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
      var head = '<div class="log-h"><span>No.</span><span>Date</span><span>Entry</span></div>';
      if (!list.length) {
        el.innerHTML = '<div class="log">' + head +
          '<div class="log-empty">No entries yet. Add one to the <code>posts</code> list ' +
          "in js/content.js.</div></div>";
        return;
      }
      el.innerHTML = '<div class="log">' + head + list.map(function (p, i) {
        var n = list.length - i;
        return '<a class="log-row" href="#' + esc(p.id) + '">' +
          '<span class="no">' + (n < 10 ? "0" : "") + n + "</span>" +
          '<span class="date">' + esc(p.date) + "</span>" +
          '<span class="entry"><span class="t">' + esc(p.title) + "</span>" +
          "<span class=\"x\">" + esc(p.excerpt || "") + "</span></span></a>";
      }).join("") + "</div>";
    }

    function renderPost(p) {
      el.innerHTML = '<p class="backrow"><a class="btn" href="blog.html">&#8592; Back to blog</a></p>' +
        '<article class="post-view"><h1>' + esc(p.title) + "</h1>" +
        '<dl class="post-meta">' +
        "<div><dt>Published</dt><dd>" + esc(p.date) + "</dd></div>" +
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
        esc(l[0]) + ": " + esc(l[1]) + " &#8599;</a>";
    }).join("");
    el.innerHTML = '<div class="in"><span class="lab">Contact</span><div class="items">' +
      '<button class="btn" data-copy-email type="button">Email: ' + emailMarkup() + "</button>" +
      links + '<a class="btn" href="#top">Back to top</a></div></div>';
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
})();
