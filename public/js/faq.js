document.addEventListener('DOMContentLoaded', () => {
  const btnVolver = document.getElementById('btnVolver');
  if (btnVolver) {
    btnVolver.addEventListener('click', () => {
      // Si hay historial previo, regresa a la página anterior; de lo contrario, va a foro.html
      if (document.referrer && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'foro.html';
      }
    });
  }

  // Lógica del buscador de FAQs que ya tenías
  const searchInput = document.getElementById('faqSearch');
  const items = document.querySelectorAll('.faq-item');
  const noResultsMsg = document.getElementById('noResults');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      let coincidencias = 0;

      items.forEach(item => {
        const pregunta = item.querySelector('.faq-pregunta').textContent.toLowerCase();
        const respuesta = item.querySelector('.faq-respuesta').textContent.toLowerCase();

        if (pregunta.includes(query) || respuesta.includes(query)) {
          item.style.display = 'block';
          coincidencias++;
          if (query.length > 2) item.open = true;
        } else {
          item.style.display = 'none';
          item.open = false;
        }
      });

      if (noResultsMsg) {
        noResultsMsg.style.display = (coincidencias === 0 && query !== '') ? 'block' : 'none';
      }
    });
  }
});