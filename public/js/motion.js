/* motion.js — indicador deslizante para pestañas y menús (Motion.slider). */
(function () {
  'use strict';

  function slider(container, itemSel, attr) {
    if (!container) return;
    var ink = document.createElement('span');
    ink.className = 'ink';
    ink.setAttribute('aria-hidden', 'true');
    container.insertBefore(ink, container.firstChild);
    container.classList.add('has-ink');
    var ready = false;

    function place() {
      var a = container.querySelector(itemSel + '[' + attr + '="true"]');
      if (!a) { ink.style.opacity = '0'; return; }
      ink.style.opacity = '1';
      ink.style.width = a.offsetWidth + 'px';
      ink.style.height = a.offsetHeight + 'px';
      ink.style.transform = 'translate(' + a.offsetLeft + 'px,' + a.offsetTop + 'px)';
      if (!ready) {
        ready = true;
        // La primera posición se fija sin animar; las siguientes sí se deslizan.
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { container.classList.add('is-ready'); });
        });
      }
    }

    new MutationObserver(place).observe(container, { subtree: true, attributes: true, attributeFilter: [attr] });
    window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    place();
  }

  window.Motion = { slider: slider };
})();
