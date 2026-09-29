function setMode(mode) {
  const isRegister = mode === 'register';
  document.getElementById('tabLogin').classList.toggle('active', !isRegister);
  document.getElementById('tabRegister').classList.toggle('active', isRegister);
  document.getElementById('tabIndicator').style.transform = isRegister ? 'translateX(100%)' : 'translateX(0)';
  document.getElementById('tabPanels').style.transform = isRegister ? 'translateX(-50%)' : 'translateX(0)';
  adjustPanelsHeight();
}

function adjustPanelsHeight() {
  const isRegister = document.getElementById('tabRegister').classList.contains('active');
  const activo = document.getElementById(isRegister ? 'panelRegister' : 'panelLogin');
  document.getElementById('panelsOuter').style.height = activo.offsetHeight + 'px';
}

window.addEventListener('load', adjustPanelsHeight);
window.addEventListener('resize', adjustPanelsHeight);
