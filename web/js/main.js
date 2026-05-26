import { state }         from './state.js';
import * as db           from './db.js';
import * as auth         from './auth/auth.js';
import * as authView     from './auth/auth-view.js';
import * as snackbar     from './components/snackbar.js';
import * as sidebar      from './components/sidebar.js';
import * as settings     from './components/settings.js';
import * as editor       from './components/editor.js';
import * as confirm      from './components/confirm.js';
import * as reminders    from './components/reminders.js';
import { renderNotes }   from './views/notes.js';
import { renderCourses } from './views/courses.js';

// ── View switching ─────────────────────────────────────

function switchView(view) {
  state.view        = view;
  state.searchQuery = '';
  document.getElementById('search-input').value = '';
  document.getElementById('search-clear').classList.add('hidden');
  document.getElementById('app-title').textContent = view === 'notes' ? 'Notes' : 'Note Guide';
  document.querySelectorAll('#bottom-nav .bottom-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  renderContent();
}

// ── Content rendering ──────────────────────────────────

function renderContent() {
  const container       = document.getElementById('content');
  const searchContainer = document.getElementById('search-container');

  if (state.view === 'notes') {
    searchContainer.classList.remove('hidden');
    renderNotes(container, db.getNotes(), state.searchQuery, {
      onNoteClick:   openNote,
      onDeleteNote:  deleteNote,
    });
  } else {
    searchContainer.classList.add('hidden');
    renderCourses(container, db.getCourses(), db.getNotes());
  }
}

// ── Note actions ───────────────────────────────────────

function newNote() {
  const courses = db.getCourses();
  const note    = db.createNote(courses.length ? courses[0].id : '', '', '');
  editor.open(note.id, true, null);
}

function openNote(noteId) {
  const note = db.getNote(noteId);
  if (!note) return;
  editor.open(note.id, false, {
    courseId:    note.courseId,
    title:       note.title,
    text:        note.text,
    tags:        [...(note.tags || [])],
    reminderAt:  note.reminderAt  || null,
    attachments: [...(note.attachments || [])],
  });
}

async function deleteNote(noteId) {
  const note = db.getNote(noteId);
  if (!note) return false;
  const confirmed = await confirm.ask(
    `Delete "${note.title || 'Untitled'}"? This cannot be undone.`
  );
  if (confirmed) {
    db.deleteNote(noteId);
    snackbar.show('Note deleted');
  }
  return confirmed;
}

// ── Auth ───────────────────────────────────────────────

function onAuthSuccess(user) {
  db.setCurrentUser(user.id);

  // Pre-seed settings with the user's auth display name + email
  const s = db.getSettings();
  if (!s.userName && !s.emailAddress) {
    db.saveSettings({ ...s, userName: user.displayName, emailAddress: user.email });
  }

  db.seedDefaultNotes();
  sidebar.refreshHeader();
  renderContent();
}

// ── Search ─────────────────────────────────────────────

function bindSearch() {
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');

  searchInput.addEventListener('input', () => {
    state.searchQuery = searchInput.value;
    searchClear.classList.toggle('hidden', !searchInput.value);
    if (state.view === 'notes') renderContent();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    searchClear.classList.add('hidden');
    renderContent();
  });
}

// ── Share-link import ──────────────────────────────────

function initImportModal() {
  const hash = location.hash;
  if (!hash.startsWith('#share=')) return;
  try {
    const decoded = decodeURIComponent(escape(atob(hash.slice(7))));
    const data    = JSON.parse(decoded);
    const overlay = document.getElementById('import-overlay');
    const message = document.getElementById('import-message');
    const saveBtn = document.getElementById('import-save');
    const cancelBtn = document.getElementById('import-cancel');

    message.textContent = `"${data.t || 'Untitled'}"${data.c ? ` — category: ${data.c}` : ''}`;
    overlay.classList.add('open');

    function dismiss() {
      overlay.classList.remove('open');
      history.replaceState(null, '', location.pathname + location.search);
    }

    saveBtn.onclick = () => {
      const courses = db.getCourses();
      const note = db.createNote(courses[0]?.id || '', data.t || '', data.x || '');
      db.updateNote(note.id, note.courseId, data.t || '', data.x || '', data.g || []);
      dismiss();
      snackbar.show('Note saved to your notes.');
      if (state.view === 'notes') renderContent();
    };
    cancelBtn.onclick = dismiss;
  } catch {
    history.replaceState(null, '', location.pathname + location.search);
  }
}

// ── Init ───────────────────────────────────────────────

function init() {
  snackbar.init(document.getElementById('snackbar'));
  confirm.init();
  bindSearch();

  authView.init(onAuthSuccess);

  sidebar.init(
    {
      sidebar:   document.getElementById('sidebar'),
      overlay:   document.getElementById('overlay'),
      menuBtn:   document.getElementById('menu-btn'),
      nav:       document.getElementById('sidebar-nav'),
      avatar:    document.getElementById('user-avatar'),
      userName:  document.getElementById('user-name'),
      userEmail: document.getElementById('user-email'),
    },
    {
      onNavChange(view) { switchView(view); },
      onAction(action) {
        if (action === 'share') {
          const url = `${location.origin}${location.pathname}`;
          if (navigator.share) {
            navigator.share({ title: 'Note Keeper', url }).catch(() => {});
          } else {
            navigator.clipboard.writeText(url)
              .then(() => snackbar.show('App link copied to clipboard'))
              .catch(() => snackbar.show('Share: ' + url));
          }
        } else if (action === 'send') {
          snackbar.show('Send to a friend');
        } else if (action === 'logout') {
          auth.logout();
          state.view        = 'notes';
          state.searchQuery = '';
          authView.show();
        }
      },
    }
  );

  settings.init(
    {
      overlay:     document.getElementById('settings-overlay'),
      settingsBtn: document.getElementById('settings-btn'),
      cancelBtn:   document.getElementById('settings-cancel'),
      saveBtn:     document.getElementById('settings-save'),
      nameInput:   document.getElementById('setting-name'),
      emailInput:  document.getElementById('setting-email'),
      socialInput: document.getElementById('setting-social'),
    },
    {
      onOpen: () => db.getSettings(),
      onSave(s) {
        db.saveSettings(s);
        sidebar.refreshHeader();
        snackbar.show('Settings saved');
      },
    }
  );

  editor.init(
    {
      editorView:   document.getElementById('editor-view'),
      backBtn:      document.getElementById('back-btn'),
      deleteBtn:    document.getElementById('delete-btn'),
      cancelBtn:    document.getElementById('cancel-btn'),
      nextBtn:      document.getElementById('next-btn'),
      emailBtn:     document.getElementById('email-btn'),
      courseSelect: document.getElementById('course-select'),
      noteTitle:    document.getElementById('note-title'),
      noteText:        document.getElementById('note-text'),
      toolbar:         document.getElementById('editor-toolbar'),
      tagArea:         document.getElementById('tag-area'),
      tagInput:        document.getElementById('tag-input'),
      shareBtn:        document.getElementById('share-btn'),
      reminderBtn:     document.getElementById('reminder-btn'),
      fileInput:       document.getElementById('file-input'),
      attachmentPanel: document.getElementById('attachment-panel'),
    },
    state,
    {
      onClose:       renderContent,
      onDeleteNote:  deleteNote,
    }
  );

  document.getElementById('bottom-nav').querySelectorAll('.bottom-nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.getElementById('fab').addEventListener('click', newNote);

  // Reminders
  reminders.init();

  // Shared-note import (URL hash)
  initImportModal();

  // Check existing session
  const currentUser = auth.getCurrentUser();
  if (currentUser) {
    onAuthSuccess(currentUser);
  } else {
    authView.show();
  }
}

document.addEventListener('DOMContentLoaded', init);
