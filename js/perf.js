/* Pause looping CSS animations in sections that are off screen (see css/perf.css). */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { e.target.classList.toggle('nx-off', !e.isIntersecting); });
  }, { rootMargin: '150px 0px' });
  function start() {
    document.querySelectorAll('main > *, section, footer').forEach(function (el) { io.observe(el); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
