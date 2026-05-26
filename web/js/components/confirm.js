let els = {};
let pendingResolve = null;

export function init() {
  els = {
    overlay:   document.getElementById('confirm-overlay'),
    message:   document.getElementById('confirm-message'),
    cancelBtn: document.getElementById('confirm-cancel'),
    okBtn:     document.getElementById('confirm-ok'),
  };

  els.cancelBtn.addEventListener('click', () => settle(false));
  els.okBtn.addEventListener('click', () => settle(true));
  els.overlay.addEventListener('click', e => {
    if (e.target === els.overlay) settle(false);
  });
}

export function ask(message) {
  els.message.textContent = message;
  els.overlay.classList.add('open');
  return new Promise(resolve => { pendingResolve = resolve; });
}

function settle(result) {
  els.overlay.classList.remove('open');
  if (pendingResolve) {
    pendingResolve(result);
    pendingResolve = null;
  }
}
