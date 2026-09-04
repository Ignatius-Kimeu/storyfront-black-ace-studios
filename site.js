/* Black Ace Studios - shared behaviour. Vanilla JS, no libraries. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- splash ---------- */
  var splash = document.getElementById('splash');
  if (splash) {
    var hide = function () { splash.classList.add('done'); };
    window.addEventListener('load', function () { setTimeout(hide, reduce ? 0 : 620); });
    // never let a stalled asset trap the visitor behind the splash
    setTimeout(hide, 3200);
  }

  /* ---------- mobile nav ---------- */
  var burger = document.querySelector('.burger');
  var mobnav = document.getElementById('mobnav');
  if (burger && mobnav) {
    burger.addEventListener('click', function () {
      var open = mobnav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobnav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        mobnav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---------- smart sticky header: hides going down, returns on any scroll up ---------- */
  var hdr = document.querySelector('.hdr');
  if (hdr) {
    var last = window.pageYOffset, ticking = false;
    var onScroll = function () {
      var y = window.pageYOffset;
      if (mobnav && mobnav.classList.contains('open')) { last = y; ticking = false; return; }
      if (y > last && y > 220) hdr.classList.add('hide');
      else hdr.classList.remove('hide');
      last = y < 0 ? 0 : y;
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
  }

  /* ---------- scroll reveal ---------- */
  var revealables = document.querySelectorAll('.rv');
  if (revealables.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(revealables, function (el) { el.classList.add('in'); });
    } else {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      Array.prototype.forEach.call(revealables, function (el) { ro.observe(el); });
    }
  }

  /* ---------- photo lightbox ---------- */
  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
  var lb = document.getElementById('lb');
  if (shots.length && lb) {
    var lbImg = lb.querySelector('.lb__stage img');
    var lbCap = lb.querySelector('.lb__cap');
    var lbCount = document.getElementById('lbCount');
    var idx = 0, opener = null;

    var show = function (i) {
      idx = (i + shots.length) % shots.length;
      var s = shots[idx];
      lbImg.src = s.dataset.full;
      lbImg.alt = s.dataset.alt || '';
      lbCap.innerHTML = '<b>' + s.dataset.group + '</b>' + s.dataset.caption;
      lbCount.textContent = (idx + 1) + ' / ' + shots.length;
      // warm the neighbours so prev/next feel instant
      [shots[(idx + 1) % shots.length], shots[(idx - 1 + shots.length) % shots.length]]
        .forEach(function (n) { if (n) { var p = new Image(); p.src = n.dataset.full; } });
    };
    var open = function (i, from) {
      opener = from || null;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
      show(i);
      document.getElementById('lbClose').focus();
    };
    var close = function () {
      lb.classList.remove('open');
      document.body.style.overflow = '';
      lbImg.removeAttribute('src');
      if (opener) opener.focus();
    };

    shots.forEach(function (s, i) { s.addEventListener('click', function () { open(i, s); }); });
    document.getElementById('lbClose').addEventListener('click', close);
    document.getElementById('lbPrev').addEventListener('click', function () { show(idx - 1); });
    document.getElementById('lbNext').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb__stage')) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'ArrowLeft') show(idx - 1);
    });
    // swipe on touch
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 55) show(dx < 0 ? idx + 1 : idx - 1);
      x0 = null;
    }, { passive: true });
  }

  /* ---------- films: autoplay muted on scroll in, one sound at a time ---------- */
  var films = Array.prototype.slice.call(document.querySelectorAll('.film video'));
  if (films.length) {
    if ('IntersectionObserver' in window) {
      var vo = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var v = en.target;
          if (en.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else { v.pause(); }
        });
      }, { threshold: 0.45 });
      films.forEach(function (v) { vo.observe(v); });
    }

    // sound toggles - turning one on turns off whichever other one is on
    var toggles = Array.prototype.slice.call(document.querySelectorAll('.vbtn--sound'));
    var iconOn = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 2.2v2.1a7.8 7.8 0 0 1 0 15.4v2.1a9.9 9.9 0 0 0 0-19.6z"/></svg>';
    var iconOff = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm18.6-.6-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4-2.7-2.7 2.7-2.7z"/></svg>';
    var paint = function (btn, on) {
      btn.innerHTML = on ? iconOn : iconOff;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', on ? 'Mute this film' : 'Play this film with sound');
    };
    toggles.forEach(function (btn) {
      var v = document.getElementById(btn.dataset.for);
      paint(btn, false);
      btn.addEventListener('click', function () {
        var turningOn = v.muted;
        if (turningOn) {
          toggles.forEach(function (other) {
            if (other === btn) return;
            var ov = document.getElementById(other.dataset.for);
            if (ov && !ov.muted) { ov.muted = true; paint(other, false); }
          });
        }
        v.muted = !turningOn ? true : false;
        if (turningOn) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        paint(btn, turningOn);
      });
    });

    /* fullscreen film player - the fullscreen icon and the video itself both open it */
    var fv = document.getElementById('fv');
    if (fv) {
      var fvVid = fv.querySelector('video');
      var fvClose = document.getElementById('fvClose');
      var openFilm = function (src, poster) {
        fvVid.src = src; fvVid.poster = poster || '';
        fv.classList.add('open'); document.body.style.overflow = 'hidden';
        fvVid.muted = false; fvVid.controls = true;
        var p = fvVid.play(); if (p && p.catch) p.catch(function () {});
        fvClose.focus();
      };
      var closeFilm = function () {
        fvVid.pause(); fvVid.removeAttribute('src'); fvVid.load();
        fv.classList.remove('open'); document.body.style.overflow = '';
      };
      Array.prototype.forEach.call(document.querySelectorAll('.vbtn--full'), function (btn) {
        btn.addEventListener('click', function () {
          var v = document.getElementById(btn.dataset.for);
          openFilm(v.currentSrc || v.querySelector('source').src, v.poster);
        });
      });
      films.forEach(function (v) {
        v.addEventListener('click', function () {
          openFilm(v.currentSrc || v.querySelector('source').src, v.poster);
        });
      });
      fvClose.addEventListener('click', closeFilm);
      fv.addEventListener('click', function (e) { if (e.target === fv) closeFilm(); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && fv.classList.contains('open')) closeFilm();
      });
    }
  }

  /* stamp the year in the footer so it never goes stale */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
