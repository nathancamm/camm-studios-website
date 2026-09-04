const html = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const menuPanel = document.querySelector<HTMLElement>('.nav-panel');

html.classList.add('has-js');

function setMenu(open: boolean) {
  if (!menuButton || !menuPanel) return;
  menuButton.setAttribute('aria-expanded', String(open));
  const label = menuButton.querySelector<HTMLElement>('.sr-only');
  if (label) label.textContent = open ? 'Close menu' : 'Open menu';
  html.classList.toggle('menu-open', open);
  document
    .querySelectorAll<HTMLElement>('main, .site-footer')
    .forEach((element) => {
      element.inert = open;
    });
}

menuButton?.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

menuPanel?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});

document.addEventListener('keydown', (event) => {
  if (
    !menuButton ||
    !menuPanel ||
    menuButton.getAttribute('aria-expanded') !== 'true'
  )
    return;
  if (event.key === 'Escape') {
    setMenu(false);
    menuButton.focus();
  } else if (event.key === 'Tab') {
    const links = [...menuPanel.querySelectorAll<HTMLAnchorElement>('a[href]')];
    const first = menuButton;
    const last = links.at(-1) ?? menuButton;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => {
  if (event.matches) setMenu(false);
});

function splitWords(element: HTMLElement, className: string) {
  if (element.dataset.wordsReady === 'true') return;
  const words = element.textContent?.trim().split(/\s+/) ?? [];
  element.textContent = '';
  words.forEach((word, index) => {
    const span = document.createElement('span');
    span.className = className;
    span.style.setProperty('--word-index', String(index));
    span.textContent = word;
    element.append(span, document.createTextNode(' '));
  });
  element.dataset.wordsReady = 'true';
}

document
  .querySelectorAll<HTMLElement>('[data-word-reveal]')
  .forEach((element) => {
    splitWords(element, 'word');
  });

const readingSections = [
  ...document.querySelectorAll<HTMLElement>('[data-reading-reveal]'),
];
readingSections.forEach((element) => splitWords(element, 'reading-word'));

if (reduceMotion.matches || !('IntersectionObserver' in window)) {
  html.classList.add('reduce-motion');
  document
    .querySelectorAll<HTMLElement>('[data-reveal]')
    .forEach((element) => element.classList.add('is-visible'));
  document
    .querySelectorAll<HTMLElement>('.reading-word')
    .forEach((word) => word.classList.add('is-lit'));
} else {
  html.classList.add('motion-ready');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  document
    .querySelectorAll<HTMLElement>('[data-reveal]')
    .forEach((element) => revealObserver.observe(element));

  let readingScheduled = false;
  const updateReading = () => {
    const startLine = window.innerHeight * 0.82;
    const endLine = window.innerHeight * 0.28;
    readingSections.forEach((section) => {
      const bounds = section.getBoundingClientRect();
      const distance = Math.max(1, startLine - endLine + bounds.height * 0.22);
      const progress = Math.max(
        0,
        Math.min(1, (startLine - bounds.top) / distance),
      );
      const words = [...section.querySelectorAll<HTMLElement>('.reading-word')];
      const activeCount = Math.round(progress * words.length);
      words.forEach((word, index) =>
        word.classList.toggle('is-lit', index < activeCount),
      );
    });
    readingScheduled = false;
  };

  const scheduleReading = () => {
    if (readingScheduled) return;
    readingScheduled = true;
    requestAnimationFrame(updateReading);
  };

  window.addEventListener('scroll', scheduleReading, { passive: true });
  window.addEventListener('resize', scheduleReading, { passive: true });
  scheduleReading();
}

const motionToggle =
  document.querySelector<HTMLButtonElement>('.motion-toggle');
motionToggle?.addEventListener('click', () => {
  const paused = html.classList.toggle('motion-paused');
  motionToggle.setAttribute('aria-pressed', String(paused));
  motionToggle.textContent = paused ? 'Resume motion' : 'Pause motion';
  window.dispatchEvent(new Event('camm:motionchange'));
});
