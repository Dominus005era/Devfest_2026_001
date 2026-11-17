/* =========================================================
   DevFest Prayagraj 2026 — interactions
   Vanilla JS, no dependencies.
   ========================================================= */
(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = window.matchMedia('(pointer: fine)').matches;
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  const body = document.body;

  /* ---------------------------------------------------------
     Preloader
     --------------------------------------------------------- */
  const preloader = $('#preloader');
  const loaderBar = $('#loaderBar');
  const loaderPercent = $('#loaderPercent');
  let loaded = false;
  let progress = 0;

  const setProgress = (value) => {
    progress = clamp(value, 0, 100);
    if (loaderBar) loaderBar.style.width = progress + '%';
    if (loaderPercent) loaderPercent.textContent = String(Math.round(progress)).padStart(2, '0');
  };

  const progressTick = window.setInterval(() => {
    if (loaded) return;
    if (progress < 86) setProgress(progress + Math.random() * 9);
  }, 160);

  const finishPreloader = () => {
    if (loaded) return;
    loaded = true;
    clearInterval(progressTick);
    setProgress(100);
    window.setTimeout(() => {
      preloader?.classList.add('is-done');
      body.classList.remove('is-preloading');
      body.classList.add('is-loaded');
      window.setTimeout(() => {
        if (preloader) preloader.style.display = 'none';
        initReveals();
        initCounters();
      }, 90);
    }, 420);
  };

  window.addEventListener('load', finishPreloader, { once: true });
  window.setTimeout(finishPreloader, 2600);
  setProgress(12);

  /* ---------------------------------------------------------
     Custom cursor
     --------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    const cursor = $('#cursor');
    const dot = $('.cursor__dot', cursor);
    const ring = $('.cursor__ring', cursor);
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let active = false;

    body.classList.add('has-cursor');

    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!active) { active = true; cursor.classList.add('is-active'); }
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    }, { passive: true });

    const animateRing = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    };
    requestAnimationFrame(animateRing);

    const hoverables = 'a, button, input, .chip, .swatch, .tab, .heritage__scroller, .hero-poster, .stream-card';
    document.addEventListener('pointerover', (e) => {
      if (e.target.closest(hoverables)) cursor.classList.add('is-hover');
    });
    document.addEventListener('pointerout', (e) => {
      if (e.target.closest(hoverables)) cursor.classList.remove('is-hover');
    });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
    document.addEventListener('pointerenter', () => { if (active) cursor.classList.add('is-active'); });
    window.addEventListener('blur', () => cursor.classList.remove('is-active'));
  }

  /* ---------------------------------------------------------
     Scroll progress, sticky header, back-to-top
     --------------------------------------------------------- */
  const header = $('#siteHeader');
  const progressBar = $('#scrollProgress');
  const toTop = $('#toTop');
  let scrollQueued = false;

  const onScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
    header?.classList.toggle('is-scrolled', scrollTop > 12);
    toTop?.classList.toggle('is-visible', scrollTop > 700);
    scrollQueued = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  toTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------- */
  let revealObserver = null;
  const initReveals = () => {
    if (revealObserver) return;
    const items = $$('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => {
      // hero copy is above the fold: show it without waiting for a scroll
      if (el.closest('.hero__copy')) el.classList.add('is-visible');
      else revealObserver.observe(el);
    });
  };

  /* ---------------------------------------------------------
     Stat counters
     --------------------------------------------------------- */
  let countersStarted = false;
  const initCounters = () => {
    if (countersStarted) return;
    countersStarted = true;
    const counters = $$('[data-count]');
    if (!counters.length) return;

    const run = (el) => {
      const target = Number(el.dataset.count);
      if (!Number.isFinite(target)) return;
      if (reduceMotion) { el.textContent = String(target); return; }
      const start = performance.now();
      const duration = 1400;
      const tick = (now) => {
        const p = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) { counters.forEach(run); return; }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => obs.observe(el));
  };

  /* ---------------------------------------------------------
     Mobile menu
     --------------------------------------------------------- */
  const menu = $('#mobileMenu');
  const menuToggle = $('#menuToggle');
  const menuClose = $('#menuClose');

  const setMenu = (open) => {
    if (!menu) return;
    body.classList.toggle('menu-open', open);
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) window.setTimeout(() => menuClose?.focus(), 300);
    else menuToggle?.focus();
  };

  menuToggle?.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  menuClose?.addEventListener('click', () => setMenu(false));
  $$('.mobile-menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu?.classList.contains('is-open')) setMenu(false);
  });

  /* ---------------------------------------------------------
     Active nav link
     --------------------------------------------------------- */
  const navLinks = $$('.desktop-nav a');
  const navSections = navLinks
    .map((link) => $(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && navSections.length) {
    const navObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = '#' + entry.target.id;
        navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === id));
      });
    }, { rootMargin: '-42% 0px -52% 0px', threshold: 0 });
    navSections.forEach((s) => navObs.observe(s));
  }

  /* ---------------------------------------------------------
     Mouse parallax on hero stickers
     --------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    const stickers = $$('[data-parallax]');
    let pX = 0, pY = 0, targetX = 0, targetY = 0;
    window.addEventListener('pointermove', (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    const tick = () => {
      pX += (targetX - pX) * 0.06;
      pY += (targetY - pY) * 0.06;
      stickers.forEach((el) => {
        const depth = Number(el.dataset.parallax) || 0.05;
        el.style.translate = `${(-pX * depth * 160).toFixed(2)}px ${(-pY * depth * 120).toFixed(2)}px`;
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------
     Magnetic buttons + card tilt
     --------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; });
    });

    const tiltCards = $$('.tilt, .hero-poster');
    tiltCards.forEach((card) => {
      const base = card.classList.contains('hero-poster') ? 2.2 : 0;
      let raf = 0;
      card.addEventListener('pointermove', (e) => {
        if (window.innerWidth < 900) return;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          const ry = px * 10;
          const rx = -py * 8;
          card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotate(${base}deg) translateY(-4px)`;
          raf = 0;
        });
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------------------
     Countdown
     --------------------------------------------------------- */
  const targetDate = new Date('2026-12-19T09:00:00+05:30').getTime();
  const cd = {
    days: $('#cdDays'), hours: $('#cdHours'), mins: $('#cdMins'), secs: $('#cdSecs')
  };
  const pad = (n) => String(n).padStart(2, '0');

  const updateCountdown = () => {
    const diff = targetDate - Date.now();
    if (diff <= 0) {
      if (cd.days) cd.days.textContent = '00';
      if (cd.hours) cd.hours.textContent = '00';
      if (cd.mins) cd.mins.textContent = '00';
      if (cd.secs) cd.secs.textContent = '00';
      return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (cd.days) cd.days.textContent = pad(days);
    if (cd.hours) cd.hours.textContent = pad(hours);
    if (cd.mins) cd.mins.textContent = pad(mins);
    if (cd.secs) cd.secs.textContent = pad(secs);
  };
  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  /* ---------------------------------------------------------
     Add to calendar (.ics)
     --------------------------------------------------------- */
  const downloadICS = () => {
    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GDG Prayagraj//DevFest Prayagraj 2026//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VTIMEZONE',
      'TZID:Asia/Kolkata',
      'BEGIN:STANDARD',
      'DTSTART:19700101T000000',
      'TZOFFSETFROM:+0530',
      'TZOFFSETTO:+0530',
      'TZNAME:IST',
      'END:STANDARD',
      'END:VTIMEZONE',
      'BEGIN:VEVENT',
      'UID:devfest-prayagraj-2026@gdgprayagraj.com',
      `DTSTAMP:${dtstamp}`,
      'DTSTART;TZID=Asia/Kolkata:20261219T090000',
      'DTEND;TZID=Asia/Kolkata:20261219T180000',
      'SUMMARY:DevFest Prayagraj 2026',
      'LOCATION:Motilal Nehru National Institute of Technology Allahabad (MNNIT)\\, Teliarganj\\, Prayagraj\\, Uttar Pradesh 211004',
      'DESCRIPTION:DevFest Prayagraj 2026 by GDG Prayagraj. Talks\\, hands-on labs and community at MNNIT\\, Prayagraj. Registration details at https://gdg.community.dev/gdg-prayagraj/',
      'URL:https://gdg.community.dev/gdg-prayagraj/',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:DevFest Prayagraj is tomorrow',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devfest-prayagraj-2026.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Calendar file downloaded. See you at the Sangam.');
  };
  $$('.js-calendar').forEach((btn) => btn.addEventListener('click', downloadICS));

  /* ---------------------------------------------------------
     Programme tabs
     --------------------------------------------------------- */
  const tabs = $$('.tab');
  const agendaItems = $$('.agenda-item');
  const setFilter = (filter) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.filter === filter;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    agendaItems.forEach((item) => {
      const show = filter === 'all' || item.dataset.room === filter;
      item.classList.toggle('is-filtered', !show);
      if (show) {
        item.classList.remove('is-entering');
        void item.offsetWidth;
        item.classList.add('is-entering');
      }
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setFilter(tab.dataset.filter));
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = tabs[index + 1] || tabs[0];
      if (e.key === 'ArrowLeft') next = tabs[index - 1] || tabs[tabs.length - 1];
      if (next) { e.preventDefault(); next.focus(); next.click(); }
    });
  });

  /* ---------------------------------------------------------
     FAQ accordion
     --------------------------------------------------------- */
  const accItems = $$('.acc-item');
  accItems.forEach((item, i) => {
    const trigger = $('.acc-trigger', item);
    const panel = $('.acc-panel', item);
    if (!trigger || !panel) return;
    if (i === 0) {
      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    } else {
      trigger.setAttribute('aria-expanded', 'false');
    }
    trigger.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      accItems.forEach((other) => {
        other.classList.remove('is-open');
        const t = $('.acc-trigger', other);
        if (t) t.setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------------------------------------------------------
     Heritage scroller
     --------------------------------------------------------- */
  const scroller = $('#heritageScroller');
  const heritageProgress = $('#heritageProgress');
  const prevBtn = $('#heritagePrev');
  const nextBtn = $('#heritageNext');

  if (scroller) {
    const step = () => {
      const card = $('.heritage-card', scroller);
      return card ? card.getBoundingClientRect().width + 18 : 380;
    };
    prevBtn?.addEventListener('click', () => scroller.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    nextBtn?.addEventListener('click', () => scroller.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }));

    const updateHeritageProgress = () => {
      const max = scroller.scrollWidth - scroller.clientWidth;
      const pct = max > 0 ? (scroller.scrollLeft / max) * 100 : 0;
      if (heritageProgress) heritageProgress.style.width = pct + '%';
    };
    scroller.addEventListener('scroll', updateHeritageProgress, { passive: true });
    window.addEventListener('resize', updateHeritageProgress);
    updateHeritageProgress();

    scroller.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); scroller.scrollBy({ left: step(), behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); scroller.scrollBy({ left: -step(), behavior: 'smooth' }); }
    });

    if (finePointer) {
      let down = false, startX = 0, startLeft = 0, moved = false;
      scroller.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return;
        down = true; moved = false;
        startX = e.clientX; startLeft = scroller.scrollLeft;
        scroller.classList.add('is-dragging');
        scroller.setPointerCapture(e.pointerId);
      });
      scroller.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 4) moved = true;
        scroller.scrollLeft = startLeft - dx;
      });
      const endDrag = () => {
        if (!down) return;
        down = false;
        scroller.classList.remove('is-dragging');
      };
      scroller.addEventListener('pointerup', endDrag);
      scroller.addEventListener('pointercancel', endDrag);
      scroller.addEventListener('click', (e) => {
        if (moved) { e.preventDefault(); moved = false; }
      }, true);
    }
  }

  /* ---------------------------------------------------------
     Badge generator
     --------------------------------------------------------- */
  const canvas = $('#badgeCanvas');
  const nameInput = $('#badgeName');
  const roleChips = $$('#roleChips .chip');
  const swatches = $$('#themeSwatches .swatch');
  const downloadBtn = $('#downloadBadge');
  const shareBtn = $('#shareBadge');

  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const PAPER = '#F4F1E9';
    const INK = '#1E1E1E';
    const YELLOW = '#FFD427';

    const themes = {
      blue:   { bg: '#C3ECF6', accent: '#4285F4', pop: '#57CAFF', label: 'SANGAM BLUE' },
      green:  { bg: '#CCF6C5', accent: '#34A853', pop: '#5CDB6D', label: 'YAMUNA GREEN' },
      yellow: { bg: '#FFE7A5', accent: '#F9AB00', pop: '#FFD427', label: 'KUMBH YELLOW' },
      red:    { bg: '#F8D8D8', accent: '#EA4335', pop: '#FF7DAF', label: 'FORT RED' }
    };

    const state = { name: 'Your Name', role: 'Attendee', theme: 'blue' };
    const logo = new Image();
    let logoReady = false;
    logo.onload = () => { logoReady = true; drawBadge(); };
    logo.src = 'assets/brand/devfest-2026-no-date.png';

    const roundRect = (x, y, w, h, r) => {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    };

    const measure = (text, font) => {
      ctx.font = font;
      return ctx.measureText(text).width;
    };

    const fitFont = (text, maxWidth, start, min, weight, family = 'Figtree') => {
      let size = start;
      while (size > min) {
        const font = `${weight} ${size}px ${family}`;
        if (measure(text, font) <= maxWidth) return size;
        size -= 4;
      }
      return min;
    };

    const wrapName = (name, maxWidth, size) => {
      const font = `800 ${size}px Figtree`;
      ctx.font = font;
      if (ctx.measureText(name).width <= maxWidth) return [name];
      const words = name.split(/\s+/).filter(Boolean);
      if (words.length === 1) return [name];
      const lines = [];
      let current = '';
      words.forEach((word) => {
        const test = current ? current + ' ' + word : word;
        if (ctx.measureText(test).width <= maxWidth || !current) {
          current = test;
        } else {
          lines.push(current);
          current = word;
        }
      });
      if (current) lines.push(current);
      if (lines.length <= 2) return lines;
      return [lines.slice(0, lines.length - 1).join(' '), lines[lines.length - 1]];
    };

    const drawWaveSticker = (cx, cy, r, color) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.lineCap = 'round';
      ctx.lineWidth = 4;
      [-13, 0, 13].forEach((oy) => {
        ctx.beginPath();
        for (let x = -r * 0.56; x <= r * 0.56; x += 2) {
          const y = oy + Math.sin((x / r) * Math.PI * 2.4) * 4;
          if (x === -r * 0.56) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.restore();
    };

    const drawBadge = () => {
      const t = themes[state.theme] || themes.blue;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, W, H);

      // paper speckle
      ctx.save();
      let seed = 7;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      ctx.fillStyle = 'rgba(30,30,30,.045)';
      for (let i = 0; i < 500; i++) {
        ctx.fillRect(rand() * W, rand() * H, 1.6, 1.6);
      }
      ctx.restore();

      // halftone top-right
      ctx.save();
      ctx.fillStyle = 'rgba(30,30,30,.18)';
      for (let y = 70; y < 250; y += 17) {
        for (let x = 690; x < 950; x += 17) {
          ctx.beginPath();
          ctx.arc(x, y, 1.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // outer border
      ctx.lineWidth = 7;
      ctx.strokeStyle = INK;
      roundRect(26, 26, W - 52, H - 52, 44);
      ctx.stroke();

      // corner brackets
      ctx.lineWidth = 12;
      ctx.strokeStyle = t.accent;
      const pad = 58, len = 54;
      [[pad, pad, 1, 1], [W - pad, pad, -1, 1], [pad, H - pad, 1, -1], [W - pad, H - pad, -1, -1]].forEach(([x, y, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(x + sx * len, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + sy * len);
        ctx.stroke();
      });

      // side current bar
      ctx.fillStyle = t.accent;
      roundRect(44, 210, 14, 820, 7);
      ctx.fill();

      // Devanagari watermark
      ctx.save();
      ctx.translate(838, 520);
      ctx.rotate(-0.16);
      ctx.font = '400 168px "Tiro Devanagari Hindi"';
      ctx.fillStyle = 'rgba(30,30,30,.08)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('संगम', 0, 0);
      ctx.restore();

      // header
      ctx.fillStyle = INK;
      ctx.textBaseline = 'alphabetic';
      ctx.font = '400 22px "DM Mono"';
      ctx.textAlign = 'left';
      ctx.fillText('DEVFEST · PRAYAGRAJ', 92, 104);
      ctx.textAlign = 'right';
      ctx.fillText('19 / 12 / 26', W - 92, 104);

      ctx.strokeStyle = 'rgba(30,30,30,.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(92, 128);
      ctx.lineTo(W - 92, 128);
      ctx.stroke();

      // official wordmark
      if (logoReady) {
        const lw = 520;
        const lh = lw * (logo.height / logo.width || 0.148);
        ctx.drawImage(logo, (W - lw) / 2, 158, lw, lh);
      } else {
        ctx.font = '800 92px Figtree';
        ctx.textAlign = 'center';
        ctx.fillStyle = INK;
        ctx.fillText('DevFest', W / 2, 250);
      }

      // Prayagraj pill
      const pillText = 'PRAYAGRAJ';
      const pillFont = '800 30px Figtree';
      const pillW = measure(pillText, pillFont) + 72;
      const pillX = (W - pillW) / 2;
      ctx.fillStyle = YELLOW;
      roundRect(pillX, 278, pillW, 58, 29);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = pillFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pillText, W / 2, 308);

      // label
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(30,30,30,.56)';
      ctx.font = '400 20px "DM Mono"';
      ctx.fillText('THIS BADGE BELONGS TO', W / 2, 425);

      // name
      const rawName = (state.name || '').trim() || 'Your Name';
      let fontSize = rawName.length > 17 ? 88 : 112;
      fontSize = fitFont(rawName, 760, fontSize, 56, 800);
      const lines = wrapName(rawName, 760, fontSize);
      if (lines.length > 1) fontSize = Math.min(fontSize, 84);
      ctx.fillStyle = INK;
      ctx.font = `800 ${fontSize}px Figtree`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lineHeight = fontSize * 1.02;
      const startY = lines.length === 1 ? 535 : 520 - lineHeight / 2 + lineHeight / 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, W / 2, startY + i * lineHeight);
      });

      // role pill
      const roleFont = '500 23px "DM Mono"';
      const roleText = state.role.toUpperCase();
      const roleW = measure(roleText, roleFont) + 74;
      const roleY = 655;
      ctx.fillStyle = t.bg;
      roundRect((W - roleW) / 2, roleY, roleW, 62, 31);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = roleFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(roleText, W / 2, roleY + 32);

      // current label
      ctx.fillStyle = 'rgba(30,30,30,.5)';
      ctx.font = '400 18px "DM Mono"';
      ctx.fillText(`CURRENT // ${t.label}`, W / 2, 760);

      // river lines
      const rivers = [
        { color: '#4285F4', y: 840, amp: 18, phase: 0 },
        { color: '#34A853', y: 890, amp: 22, phase: 1.2 },
        { color: '#F9AB00', y: 940, amp: 16, phase: 2.4 },
        { color: '#EA4335', y: 978, amp: 12, phase: 3.2 }
      ];
      ctx.save();
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      rivers.forEach((river) => {
        ctx.strokeStyle = river.color;
        ctx.beginPath();
        for (let x = 46; x <= W - 46; x += 10) {
          const y = river.y + Math.sin((x / W) * Math.PI * 3.2 + river.phase) * river.amp;
          if (x === 46) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.restore();

      // river sticker
      drawWaveSticker(848, 770, 44, YELLOW);

      // bottom rule
      ctx.strokeStyle = 'rgba(30,30,30,.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(92, 1028);
      ctx.lineTo(W - 92, 1028);
      ctx.stroke();

      // venue / date
      ctx.fillStyle = INK;
      ctx.font = '500 20px "DM Mono"';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('MNNIT · TELIARGANJ, PRAYAGRAJ', 92, 1072);
      ctx.textAlign = 'right';
      ctx.fillText('2026', W - 92, 1072);

      // barcode
      ctx.save();
      ctx.fillStyle = INK;
      const code = rawName + state.role;
      let bx = 92;
      for (let i = 0; i < 34; i++) {
        const width = 2 + ((code.charCodeAt(i % code.length) || 3) % 4);
        ctx.fillRect(bx, 1100, width, 46);
        bx += width + 5;
        if (bx > 430) break;
      }
      ctx.restore();

      // footer
      ctx.fillStyle = 'rgba(30,30,30,.55)';
      ctx.font = '400 16px "DM Mono"';
      ctx.textAlign = 'right';
      ctx.fillText('WHERE IDEAS FIND THEIR CONFLUENCE.', W - 92, 1132);

      // bottom accent line
      ctx.fillStyle = t.accent;
      roundRect(92, 1180, W - 184, 8, 4);
      ctx.fill();
    };

    const updateAria = () => {
      canvas.setAttribute('aria-label', `DevFest Prayagraj 2026 badge for ${state.name}, ${state.role}, ${state.theme} theme`);
    };

    nameInput?.addEventListener('input', () => {
      state.name = nameInput.value.slice(0, 26);
      drawBadge();
      updateAria();
    });

    roleChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        state.role = chip.dataset.role;
        roleChips.forEach((c) => {
          const active = c === chip;
          c.classList.toggle('is-active', active);
          c.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        drawBadge();
        updateAria();
      });
    });

    swatches.forEach((swatch) => {
      swatch.addEventListener('click', () => {
        state.theme = swatch.dataset.theme;
        swatches.forEach((s) => {
          const active = s === swatch;
          s.classList.toggle('is-active', active);
          s.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        drawBadge();
        updateAria();
      });
    });

    const fileSlug = () => (state.name || 'badge').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'badge';

    const getBlob = () => new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

    downloadBtn?.addEventListener('click', async () => {
      try {
        const blob = await getBlob();
        if (!blob) throw new Error('No blob');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devfest-prayagraj-26-${fileSlug()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 2000);
        toast('Badge downloaded. Bring it on 19 December.');
      } catch (err) {
        toast('Could not build the badge. Try again in a moment.');
      }
    });

    shareBtn?.addEventListener('click', async () => {
      const text = `I'm going to DevFest Prayagraj 2026 — 19 December at MNNIT, Prayagraj. Where ideas find their confluence.`;
      try {
        const blob = await getBlob();
        if (blob && navigator.canShare) {
          const file = new File([blob], `devfest-prayagraj-26-${fileSlug()}.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'DevFest Prayagraj 2026', text });
            return;
          }
        }
        if (navigator.share) {
          await navigator.share({ title: 'DevFest Prayagraj 2026', text, url: location.href });
          return;
        }
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `devfest-prayagraj-26-${fileSlug()}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 2000);
        }
        let copied = false;
        try {
          await navigator.clipboard.writeText(`${text} ${location.href}`);
          copied = true;
        } catch (e) { /* clipboard is optional */ }
        toast(copied ? 'Badge saved & caption copied — attach it to your post.' : 'Badge saved. Add your own caption.');
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        toast('Sharing is unavailable — download the badge instead.');
      }
    });

    const bootBadge = async () => {
      try { await document.fonts.ready; } catch (e) { /* fonts API optional */ }
      drawBadge();
      updateAria();
    };
    bootBadge();
    window.setTimeout(bootBadge, 600);
  }

  /* ---------------------------------------------------------
     Toast
     --------------------------------------------------------- */
  let toastEl = null;
  let toastTimer = 0;
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove('is-visible'), 3800);
  }

  /* ---------------------------------------------------------
     Hero confluence canvas
     --------------------------------------------------------- */
  const heroCanvas = $('#confluenceCanvas');
  if (heroCanvas && !reduceMotion) {
    const hero = $('.hero');
    const hctx = heroCanvas.getContext('2d');
    let dpr = 1, w = 0, h = 0;
    let running = true;
    let visible = true;
    let pointerX = 0.5, pointerY = 0.5;
    let smoothX = 0.5, smoothY = 0.5;
    let t = 0;

    const streams = [
      { color: '66,133,244', alpha: 0.2, base: 0.2, amp: 0.055, speed: 0.7, width: 1.3 },
      { color: '52,168,83', alpha: 0.18, base: 0.34, amp: 0.07, speed: -0.55, width: 1.2 },
      { color: '249,171,0', alpha: 0.18, base: 0.48, amp: 0.06, speed: 0.85, width: 1.1 },
      { color: '234,67,53', alpha: 0.1, base: 0.62, amp: 0.045, speed: -0.45, width: 1 }
    ];

    const dots = [];
    const dotColors = ['66,133,244', '52,168,83', '249,171,0', '234,67,53'];
    for (let i = 0; i < 64; i++) {
      dots.push({
        p: Math.random(),
        speed: 0.00002 + Math.random() * 0.00005,
        layer: i % 4,
        radius: 1 + Math.random() * 2.2,
        offset: Math.random() * Math.PI * 2
      });
    }

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      heroCanvas.width = Math.round(w * dpr);
      heroCanvas.height = Math.round(h * dpr);
      hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      if (!running) return;
      if (!visible) { requestAnimationFrame(draw); return; }
      t += 1;
      smoothX += (pointerX - smoothX) * 0.04;
      smoothY += (pointerY - smoothY) * 0.04;
      hctx.clearRect(0, 0, w, h);

      streams.forEach((s, idx) => {
        const midY = h * (s.base + (smoothY - 0.5) * 0.05);
        const amp = h * s.amp * (1 + Math.abs(smoothX - 0.5) * 0.5);
        hctx.beginPath();
        for (let x = -30; x <= w + 30; x += 14) {
          const nx = x / w;
          const y = midY
            + Math.sin(nx * 5.4 + t * 0.0035 * s.speed + idx * 1.7) * amp
            + Math.sin(nx * 13.2 - t * 0.005 * s.speed + idx) * amp * 0.34
            + (smoothY - 0.5) * Math.sin(nx * Math.PI) * 26;
          if (x === -30) hctx.moveTo(x, y); else hctx.lineTo(x, y);
        }
        hctx.strokeStyle = `rgba(${s.color},${s.alpha})`;
        hctx.lineWidth = s.width;
        hctx.stroke();
      });

      // drifting points along the currents
      dots.forEach((dot) => {
        dot.p += dot.speed * (1 + Math.abs(smoothX - 0.5));
        if (dot.p > 1.05) dot.p = -0.05;
        const s = streams[dot.layer];
        const x = dot.p * w;
        const midY = h * (s.base + (smoothY - 0.5) * 0.05);
        const amp = h * s.amp;
        const y = midY
          + Math.sin((x / w) * 5.4 + t * 0.0035 * s.speed + dot.layer * 1.7) * amp
          + Math.sin((x / w) * 13.2 - t * 0.005 * s.speed + dot.layer) * amp * 0.34
          + Math.sin(t * 0.01 + dot.offset) * 5;
        hctx.beginPath();
        hctx.arc(x, y, dot.radius, 0, Math.PI * 2);
        hctx.fillStyle = `rgba(${dotColors[dot.layer]},.28)`;
        hctx.fill();
      });

      requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener('resize', () => {
      resize();
    });
    window.addEventListener('pointermove', (e) => {
      pointerX = e.clientX / window.innerWidth;
      pointerY = e.clientY / window.innerHeight;
    }, { passive: true });
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) requestAnimationFrame(draw); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => { visible = entry.isIntersecting; });
      }, { threshold: 0 }).observe(hero);
    }
  }

  /* ---------------------------------------------------------
     Small niceties
     --------------------------------------------------------- */
  // Mark hero poster as interactive for keyboard users
  const poster = $('#heroPoster');
  if (poster) {
    poster.setAttribute('tabindex', '0');
    poster.setAttribute('role', 'img');
    poster.setAttribute('aria-label', 'DevFest Prayagraj 2026 poster: 19 December 2026 at MNNIT Teliarganj, Prayagraj');
  }

  // Prevent placeholder links from jumping
  $$('a[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

})();
