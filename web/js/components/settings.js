let els = {};
let on  = {};

export function init(elements, callbacks) {
  els = elements;
  on  = callbacks;

  els.settingsBtn.addEventListener('click', open);
  els.cancelBtn.addEventListener('click', close);
  els.saveBtn.addEventListener('click', commit);
  els.overlay.addEventListener('click', e => {
    if (e.target === els.overlay) close();
  });
}

export function open() {
  const s = on.onOpen ? on.onOpen() : {};
  els.nameInput.value   = s.userName     || '';
  els.emailInput.value  = s.emailAddress || '';
  els.socialInput.value = s.favSocial    || '';
  els.overlay.classList.add('open');
}

export function close() {
  els.overlay.classList.remove('open');
}

function commit() {
  if (on.onSave) {
    on.onSave({
      userName:     els.nameInput.value.trim(),
      emailAddress: els.emailInput.value.trim(),
      favSocial:    els.socialInput.value.trim(),
    });
  }
  close();
}
