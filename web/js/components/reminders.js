import * as db       from '../db.js';
import * as snackbar from './snackbar.js';

// Tracks which note reminders have already fired in this browser session.
const _fired = new Set();

export function init() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  check();
  setInterval(check, 60_000);
}

export function check() {
  const now = Date.now();
  db.getNotes().forEach(note => {
    if (!note.reminderAt || _fired.has(note.id)) return;
    if (note.reminderAt <= now) {
      _fired.add(note.id);
      fire(note);
    }
  });
}

function fire(note) {
  const title = note.title || 'Untitled note';
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`Reminder: ${title}`, {
      body: stripHTML(note.text || '').slice(0, 120),
    });
  }
  snackbar.show(`🔔 Reminder: ${title}`);
}

function stripHTML(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || '';
}
