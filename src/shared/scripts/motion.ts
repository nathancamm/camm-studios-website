/**
 * Shared motion runtime. CSS transforms and opacity only.
 * IntersectionObserver drives reveals; one throttled rAF loop drives all
 * scroll-linked movement (parallax, rotation, progress). Everything switches
 * off under prefers-reduced-motion.
 */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* -- scroll reveals ------------------------------------------------- */

function initReveals(): void {
  const els = document.querySelectorAll<HTMLElement>('.reveal');
  if (!els.length) return;
  if (reduced) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
  );
  els.forEach((el) => io.observe(el));
}

/* -- word-by-word tagline reveal ------------------------------------ */

function initWordReveals(): void {
  const blocks = document.querySelectorAll<HTMLElement>('.wordreveal');
  if (!blocks.length || reduced) return;

  let words: HTMLElement[] = [];
  blocks.forEach((block) => {
    words = words.concat(Array.from(block.querySelectorAll<HTMLElement>('.w')));
  });

  let ticking = false;
  const update = (): void => {
    ticking = false;
    const trigger = window.innerHeight * 0.72;
    for (const w of words) {
      const top = w.getBoundingClientRect().top;
      w.classList.toggle('is-lit', top < trigger);
    }
  };
  const onScroll = (): void => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        window.addEventListener('scroll', onScroll, { passive: true });
        update();
      } else {
        window.removeEventListener('scroll', onScroll);
      }
    }
  });
  blocks.forEach((block) => io.observe(block));
}

/* -- scroll-linked movement: parallax, rotation, progress ------------ */

function initScrollMotion(): void {
  const parallax = document.querySelectorAll<HTMLElement>('[data-parallax]');
  const rotators = document.querySelectorAll<HTMLElement>('[data-rotate]');
  const progress = document.querySelector<HTMLElement>('.scroll-progress');
  if ((!parallax.length && !rotators.length && !progress) || reduced) return;

  const active = new Set<HTMLElement>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) active.add(el);
        else active.delete(el);
      }
    },
    { rootMargin: '20% 0px' },
  );
  parallax.forEach((el) => io.observe(el));
  rotators.forEach((el) => io.observe(el));

  let ticking = false;
  const update = (): void => {
    ticking = false;
    const vh = window.innerHeight;
    for (const el of active) {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - vh / 2;
      if (el.dataset.parallax !== undefined) {
        const speed = Number(el.dataset.parallax ?? '0.1');
        el.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)`;
      } else if (el.dataset.rotate !== undefined) {
        const per = Number(el.dataset.rotate ?? '12');
        el.style.transform = `rotate(${((-center / vh) * per).toFixed(2)}deg)`;
      }
    }
    if (progress) {
      const doc = document.documentElement;
      const max = doc.scrollHeight - vh;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progress.style.transform = `scaleX(${ratio.toFixed(4)})`;
    }
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

/* -- dial count-up ---------------------------------------------------- */

function initCounters(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-count]');
  if (!els.length || reduced) return;

  const run = (el: HTMLElement): void => {
    const target = Number(el.dataset.count ?? '0');
    const pad = (el.dataset.pad ?? '').length > 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(target * eased);
      el.textContent = pad ? String(value).padStart(2, '0') : String(value);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          run(entry.target as HTMLElement);
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.6 },
  );
  els.forEach((el) => io.observe(el));
}

/* -- fluid island nav ----------------------------------------------- */

function initNav(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const overlay = document.querySelector<HTMLElement>('[data-nav-overlay]');
  if (!toggle || !overlay) return;

  const setOpen = (open: boolean): void => {
    document.documentElement.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    overlay.toggleAttribute('inert', !open);
  };
  setOpen(false);

  toggle.addEventListener('click', () => {
    setOpen(!document.documentElement.classList.contains('nav-open'));
  });
  overlay.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false);
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
}

initReveals();
initWordReveals();
initScrollMotion();
initCounters();
initNav();
