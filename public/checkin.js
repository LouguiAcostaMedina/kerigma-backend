(function () {
  const card = document.querySelector('.card');
  const checkinUrl = card ? card.getAttribute('data-checkin-url') : '';
  const statusEl = document.getElementById('status');
  const buttons = document.querySelectorAll('.member-btn');

  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      button.disabled = true;
      statusEl.className = 'status';
      statusEl.textContent = '';
      try {
        const response = await fetch(checkinUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId: button.dataset.memberId }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          button.classList.add('done');
          statusEl.className = 'status success';
          statusEl.textContent = result.message || 'Asistencia registrada. ¡Gracias!';
        } else {
          button.disabled = false;
          statusEl.className = 'status error';
          statusEl.textContent = result.message || 'No se pudo registrar la asistencia';
        }
      } catch (error) {
        button.disabled = false;
        statusEl.className = 'status error';
        statusEl.textContent = 'Error de conexión. Intente nuevamente.';
      }
    });
  });
})();
