// AstroBurst — small behaviours shared by every page.
(function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');

  // Header background appears after scrolling a little.
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 30); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu.
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Fade sections in as they enter the viewport.
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Publications: year filter and search.
  var pubs = document.querySelectorAll('.pub');
  if (pubs.length) {
    var search = document.getElementById('pub-search');
    var chips = document.querySelectorAll('.chip');
    var recentOnly = false;
    var newest = 0;
    pubs.forEach(function (p) { newest = Math.max(newest, +p.dataset.year); });
    function apply() {
      var q = (search.value || '').toLowerCase().trim();
      document.querySelectorAll('.year-group').forEach(function (g) {
        var shown = 0;
        g.querySelectorAll('.pub').forEach(function (p) {
          var ok = (!recentOnly || +p.dataset.year > newest - 3) && (!q || p.textContent.toLowerCase().indexOf(q) !== -1);
          p.hidden = !ok; if (ok) shown++;
        });
        g.hidden = shown === 0;
      });
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on'); recentOnly = c.dataset.filter === 'recent'; apply();
      });
    });
    search.addEventListener('input', apply);
  }

  // Gallery lightbox.
  var links = Array.prototype.slice.call(document.querySelectorAll('.gallery a'));
  var box = document.querySelector('.lightbox');
  if (links.length && box) {
    var img = box.querySelector('img'), idx = 0;
    function show(i) { idx = (i + links.length) % links.length; img.src = links[idx].href; box.classList.add('show'); }
    function hide() { box.classList.remove('show'); img.removeAttribute('src'); }
    links.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); show(i); }); });
    box.querySelector('.close').addEventListener('click', hide);
    box.querySelector('.prev').addEventListener('click', function () { show(idx - 1); });
    box.querySelector('.next').addEventListener('click', function () { show(idx + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) hide(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('show')) return;
      if (e.key === 'Escape') hide();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }
})();
