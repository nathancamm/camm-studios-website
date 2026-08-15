/**
 * Shared motion runtime. CSS transforms and opacity only.
 * IntersectionObserver drives reveals. One throttled rAF loop drives parallax.
 * Everything switches off under prefers-reduced-motion.
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

/* -- parallax layers ------------------------------------------------ */

function initParallax(): void {
  const layers = document.querySelectorAll<HTMLElement>('[data-parallax]');
  if (!layers.length || reduced) return;

  const active = new Set<HTMLElement>();
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement;
      if (entry.isIntersecting) active.add(el);
      else active.delete(el);
    }
  });
  layers.forEach((el) => io.observe(el));

  let ticking = false;
  const update = (): void => {
    ticking = false;
    const vh = window.innerHeight;
    for (const el of active) {
      const speed = Number(el.dataset.parallax ?? '0.1');
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)`;
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
initParallax();
initNav();
