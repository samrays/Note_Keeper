import * as db from '../db.js';

let els = {};
let on  = {};

export function init(elements, callbacks) {
  els = elements;
  on  = callbacks;

  els.menuBtn.addEventListener('click', toggle);
  els.overlay.addEventListener('click', close);
  els.nav.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (li) handleNavClick(li);
  });

  refreshHeader();
}

export function open() {
  els.sidebar.classList.add('open');
  els.overlay.classList.add('visible');
}

export function close() {
  els.sidebar.classList.remove('open');
  els.overlay.classList.remove('visible');
}

export function toggle() {
  els.sidebar.classList.contains('open') ? close() : open();
}

export function refreshHeader() {
  const s = db.getSettings();
  els.avatar.textContent    = (s.userName || 'U').charAt(0).toUpperCase();
  els.userName.textContent  = s.userName;
  els.userEmail.textContent = s.emailAddress;
}

function handleNavClick(li) {
  const view   = li.dataset.view;
  const action = li.dataset.action;

  if (view) {
    els.nav.querySelectorAll('li').forEach(item => item.classList.remove('active'));
    li.classList.add('active');
    if (on.onNavChange) on.onNavChange(view);
  } else if (action) {
    if (on.onAction) on.onAction(action);
  }

  close();
}
