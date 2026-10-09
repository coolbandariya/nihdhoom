/**
 * Site-wide interaction layer, installed once from main.jsx.
 *
 * - Magnetic hover: primary buttons and cards drift a few pixels toward the
 *   pointer. Implemented with one delegated pointer listener that writes the
 *   CSS `translate` property, so it never fights component transforms.
 * - Scroll reveal: cards and sections fade up the first time they enter the
 *   viewport. Content is visible by default; only elements below the fold are
 *   held back, so nothing is hidden if JavaScript or the observer is missing.
 * - Lazy images: every image without an explicit loading hint is lazy-loaded
 *   and fades in once decoded. The hero image (fetchpriority="high") is left
 *   eager.
 *
 * Everything is disabled for `prefers-reduced-motion: reduce` and magnetic
 * hover only runs on fine pointers (mouse / trackpad).
 */

const MAGNETIC_SELECTOR = [
  '[data-magnetic]',
  '.ui-btn.is-primary',
  '.ui-btn.is-lg',
  '.home-primary',
  '.home-secondary',
  '.home-text-button',
  '.workspace-action',
  '.market-primary-action',
  '.map-layers-button',
].join(',');

const MAGNETIC_CARD_SELECTOR = [
  '.home-workflow-card',
  '.home-role-card',
  '.home-status-grid > button',
  '.ui-stat',
  '.proof-step',
].join(',');

const REVEAL_SELECTOR = [
  '.field-home > section',
  '.workspace-hero',
  '.ui-intro',
  '.ui-card',
  '.ui-row-card',
  '.ui-stats',
  '.residue-journey-card',
  '.market-card',
  '.market-hero-card',
  '.proof-steps',
  '.ops-console',
  '.evidence-review',
].join(',');

let installed = false;

export function installInteractions() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false;

  if (!reduceMotion && finePointer) installMagnetic();
  installLazyImages(reduceMotion);
  if (!reduceMotion && 'IntersectionObserver' in window) installReveal();
}

/* ---------------- Magnetic hover ---------------- */

function installMagnetic() {
  let active: HTMLElement | null = null;
  let frame = 0;

  const release = (el: HTMLElement | null) => {
    if (!el) return;
    // Ease back to rest, then drop the inline style.
    el.style.setProperty('translate', '0px 0px');
    window.setTimeout(() => {
      if (el === active) return;
      el.style.removeProperty('translate');
      el.classList.remove('is-magnetic');
    }, 420);
  };

  document.addEventListener('pointermove', (event) => {
    const target = event.target as Element | null;
    const strongHit = target?.closest<HTMLElement>(MAGNETIC_SELECTOR) ?? null;
    const cardHit = strongHit ? null : target?.closest<HTMLElement>(MAGNETIC_CARD_SELECTOR) ?? null;
    const el = strongHit || cardHit;

    if (el !== active) {
      release(active);
      active = el;
    }
    if (!el || (el as HTMLButtonElement).disabled) return;

    const rect = el.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    // Buttons pull harder than cards; both are clamped to a few pixels.
    const strength = strongHit ? 0.28 : 0.06;
    const limit = strongHit ? 8 : 5;
    const x = Math.max(-limit, Math.min(limit, dx * strength));
    const y = Math.max(-limit, Math.min(limit, dy * strength));

    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      el.classList.add('is-magnetic');
      el.style.setProperty('translate', `${x.toFixed(1)}px ${y.toFixed(1)}px`);
    });
  }, { passive: true });

  document.addEventListener('pointerleave', () => { release(active); active = null; });
  window.addEventListener('blur', () => { release(active); active = null; });
}

/* ---------------- Lazy images ---------------- */

function installLazyImages(reduceMotion: boolean) {
  const prepare = (img: HTMLImageElement) => {
    if (img.dataset.lazyReady) return;
    img.dataset.lazyReady = '1';
    const eager = img.getAttribute('fetchpriority') === 'high' || img.loading === 'eager';
    if (!eager && !img.hasAttribute('loading')) img.loading = 'lazy';
    if (!img.hasAttribute('decoding')) img.decoding = 'async';
    if (reduceMotion || eager) return;
    if (img.complete && img.naturalWidth > 0) return; // already painted; no fade
    img.classList.add('lazy-fade');
    const done = () => img.classList.add('is-loaded');
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  };

  const scan = (root: ParentNode) => {
    if (root instanceof HTMLImageElement) prepare(root);
    root.querySelectorAll?.('img').forEach((img) => prepare(img as HTMLImageElement));
  };

  scan(document);
  new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType === 1) scan(node as Element);
    }));
  }).observe(document.body, { childList: true, subtree: true });
}

/* ---------------- Scroll reveal ---------------- */

function installReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target as HTMLElement;
      el.dataset.reveal = 'in';
      observer.unobserve(el);
      // Hand transitions back to the component once the fade has finished.
      window.setTimeout(() => { el.dataset.reveal = 'done'; }, 700);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  const prepare = (el: HTMLElement) => {
    if (el.dataset.reveal) return;
    // Only hold back what is currently below the fold; visible content never flickers.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) {
      el.dataset.reveal = 'done';
      return;
    }
    el.dataset.reveal = 'pending';
    observer.observe(el);
  };

  const scan = (root: ParentNode) => {
    if (root instanceof HTMLElement && root.matches(REVEAL_SELECTOR)) prepare(root);
    root.querySelectorAll?.(REVEAL_SELECTOR).forEach((el) => prepare(el as HTMLElement));
  };

  requestAnimationFrame(() => scan(document));
  new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType === 1) scan(node as Element);
    }));
  }).observe(document.body, { childList: true, subtree: true });
}
