let el = null;
let timer = null;

export function init(element) {
  el = element;
}

export function show(msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('show'), 3000);
}
