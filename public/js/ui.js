function togglePw(btn) {
  const wrap = btn.closest('.pw-wrap');
  const input = wrap.querySelector('input');
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.querySelector('.eye-open').style.display = isHidden ? 'none' : 'block';
  btn.querySelector('.eye-closed').style.display = isHidden ? 'block' : 'none';
}
