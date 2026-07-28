/**
 * Scroll-reveal for elements marked data-reveal — fade + 12px rise, 400ms, replacing the
 * original's animate.css entrances. Unlike the original, this respects prefers-reduced-motion:
 * if the visitor asked for less motion, elements are simply visible with no transition at all.
 *
 * The hidden starting state in global.css is scoped to `.js [data-reveal]`, and a blocking
 * inline script in BaseLayout's <head> is what adds that `.js` class — before this module even
 * runs. So if JS is disabled entirely, [data-reveal] elements never get hidden in the first
 * place. This script only has to handle the case where JS runs but reduced-motion or
 * IntersectionObserver support is missing: reveal everything immediately rather than leaving it
 * hidden with nothing left to trigger the reveal.
 */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const targets = document.querySelectorAll<HTMLElement>('[data-reveal]')

if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  targets.forEach((el) => el.classList.add('is-visible'))
} else {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        obs.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
  )
  targets.forEach((el) => observer.observe(el))
}
