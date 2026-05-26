import { esc, sanitizeHTML } from '../utils.js';
import * as db       from '../db.js';
import * as snackbar from './snackbar.js';

let els   = {};
let state = {};
let on    = {};
let _tags        = [];
let _reminderAt  = null;
let _attachments = [];

const TOGGLE_CMDS = [
  'bold','italic','underline','strikeThrough',
  'insertUnorderedList','insertOrderedList',
];

export function init(elements, appState, callbacks) {
  els   = elements;
  state = appState;
  on    = callbacks;

  // Resolve editor-internal elements
  const q = id => document.getElementById(id);
  els.highlightBtn     = q('highlight-btn');
  els.linkBtn          = q('link-btn');
  els.imageBtn         = q('image-btn');
  els.attachBtn        = q('attach-btn');
  els.reminderOverlay  = q('reminder-overlay');
  els.reminderDatetime = q('reminder-datetime');
  els.reminderSave     = q('reminder-save');
  els.reminderClear    = q('reminder-clear');
  els.reminderCancel   = q('reminder-cancel');
  els.shareOverlay     = q('share-overlay');
  els.shareLinkInput   = q('share-link-input');
  els.shareCopyBtn     = q('share-copy-btn');
  els.shareEmailBtn    = q('share-email-btn');
  els.shareClose       = q('share-close');

  // Populate course dropdown
  els.courseSelect.innerHTML = db.getCourses()
    .map(c => `<option value="${esc(c.id)}">${esc(c.title)}</option>`)
    .join('');

  // ── Header buttons ─────────────────────────────────────
  els.backBtn.addEventListener('click', saveAndBack);
  els.deleteBtn.addEventListener('click', deleteNote);
  els.cancelBtn.addEventListener('click', cancel);
  els.nextBtn.addEventListener('click', goNext);
  els.emailBtn.addEventListener('click', emailNote);
  els.shareBtn.addEventListener('click', openShareModal);
  els.reminderBtn.addEventListener('click', openReminderModal);
  els.noteTitle.addEventListener('input', syncNextBtn);

  // ── Rich-text toolbar ──────────────────────────────────
  els.toolbar.addEventListener('mousedown', e => e.preventDefault());
  els.toolbar.addEventListener('click', e => {
    const btn = e.target.closest('.toolbar-btn[data-cmd]');
    if (!btn) return;
    document.execCommand(btn.dataset.cmd, false, btn.dataset.val || null);
    els.noteText.focus();
    syncToolbar();
  });

  // Special toolbar buttons (no data-cmd)
  els.highlightBtn.addEventListener('mousedown', e => e.preventDefault());
  els.highlightBtn.addEventListener('click', toggleHighlight);

  els.linkBtn.addEventListener('mousedown', e => e.preventDefault());
  els.linkBtn.addEventListener('click', insertLink);

  els.imageBtn.addEventListener('mousedown', e => e.preventDefault());
  els.imageBtn.addEventListener('click', () => {
    els.fileInput.accept = 'image/*';
    els.fileInput.click();
  });

  els.attachBtn.addEventListener('mousedown', e => e.preventDefault());
  els.attachBtn.addEventListener('click', () => {
    els.fileInput.accept = '*/*';
    els.fileInput.click();
  });

  els.fileInput.addEventListener('change', handleFileChange);

  // ── Keyboard shortcuts ─────────────────────────────────
  els.noteText.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); document.execCommand('bold',      false, null); break;
        case 'i': e.preventDefault(); document.execCommand('italic',    false, null); break;
        case 'u': e.preventDefault(); document.execCommand('underline', false, null); break;
        case 'z': if (!e.shiftKey) { e.preventDefault(); document.execCommand('undo', false, null); } break;
        case 'y': e.preventDefault(); document.execCommand('redo', false, null); break;
        case 'k': e.preventDefault(); insertLink(); break;
      }
      syncToolbar();
    }
  });

  els.noteText.addEventListener('keyup',   syncToolbar);
  els.noteText.addEventListener('mouseup', syncToolbar);
  els.noteText.addEventListener('focus',   syncToolbar);
  els.noteText.addEventListener('input', () => {
    if (els.noteText.innerHTML === '<br>') els.noteText.innerHTML = '';
  });

  // ── Tag input ──────────────────────────────────────────
  els.tagInput.addEventListener('keydown', e => {
    const val = els.tagInput.value;
    if ((e.key === 'Enter' || e.key === ',') && val.trim()) {
      e.preventDefault();
      addTag(val.replace(/,/g, '').trim());
      els.tagInput.value = '';
    } else if (e.key === 'Backspace' && !val && _tags.length) {
      _tags.pop();
      renderTags();
    }
  });
  els.tagInput.addEventListener('blur', () => {
    const val = els.tagInput.value.trim().replace(/,/g, '');
    if (val) { addTag(val); els.tagInput.value = ''; }
  });
  els.tagArea.addEventListener('click', e => {
    const btn = e.target.closest('.tag-remove');
    if (btn) removeTag(parseInt(btn.dataset.idx, 10));
  });

  // ── Reminder modal ─────────────────────────────────────
  els.reminderSave.addEventListener('click', saveReminder);
  els.reminderClear.addEventListener('click', clearReminder);
  els.reminderCancel.addEventListener('click', () => els.reminderOverlay.classList.remove('open'));
  els.reminderOverlay.addEventListener('click', e => {
    if (e.target === els.reminderOverlay) els.reminderOverlay.classList.remove('open');
  });

  // ── Share modal ────────────────────────────────────────
  els.shareCopyBtn.addEventListener('click', copyShareLink);
  els.shareEmailBtn.addEventListener('click', shareByEmail);
  els.shareClose.addEventListener('click', () => els.shareOverlay.classList.remove('open'));
  els.shareOverlay.addEventListener('click', e => {
    if (e.target === els.shareOverlay) els.shareOverlay.classList.remove('open');
  });
}

// ── Open / close ───────────────────────────────────────

export function open(noteId, isNew, original) {
  state.editingNoteId = noteId;
  state.isNewNote     = isNew;
  state.originalNote  = original;

  const note = db.getNote(noteId);
  if (note) {
    els.courseSelect.value = note.courseId;
    els.noteTitle.value    = note.title || '';
    els.noteText.innerHTML = sanitizeHTML(note.text);
    _tags        = [...(note.tags || [])];
    _reminderAt  = note.reminderAt  || null;
    _attachments = [...(note.attachments || [])];
  } else {
    els.noteText.innerHTML = '';
    _tags        = [];
    _reminderAt  = null;
    _attachments = [];
  }

  renderTags();
  renderAttachments();
  syncNextBtn();
  syncToolbar();
  syncReminderBtn();
  document.body.classList.add('editor-open');
  els.editorView.classList.add('open');
  setTimeout(() => els.noteTitle.focus(), 300);
}

export function close() {
  state.editingNoteId = null;
  document.body.classList.remove('editor-open');
  els.editorView.classList.remove('open');
  els.reminderOverlay.classList.remove('open');
  els.shareOverlay.classList.remove('open');
  if (on.onClose) on.onClose();
}

// ── Toolbar sync ───────────────────────────────────────

function syncToolbar() {
  TOGGLE_CMDS.forEach(cmd => {
    const btn = els.toolbar.querySelector(`[data-cmd="${cmd}"]`);
    if (btn) btn.classList.toggle('active', document.queryCommandState(cmd));
  });
  const block = document.queryCommandValue('formatBlock').toLowerCase();
  els.toolbar.querySelectorAll('[data-cmd="formatBlock"]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === block);
  });
}

// ── Tags ───────────────────────────────────────────────

function addTag(tag) {
  tag = tag.toLowerCase().slice(0, 30);
  if (tag && !_tags.includes(tag) && _tags.length < 10) { _tags.push(tag); renderTags(); }
}

function removeTag(idx) {
  _tags.splice(idx, 1);
  renderTags();
}

function renderTags() {
  els.tagArea.querySelectorAll('.tag-pill').forEach(p => p.remove());
  _tags.forEach((tag, idx) => {
    const pill = document.createElement('span');
    pill.className = 'tag-pill editable';
    pill.innerHTML = `${esc(tag)}<button class="tag-remove" data-idx="${idx}" title="Remove tag">×</button>`;
    els.tagArea.insertBefore(pill, els.tagInput);
  });
}

// ── Save / restore ─────────────────────────────────────

function save() {
  db.updateNote(
    state.editingNoteId,
    els.courseSelect.value,
    els.noteTitle.value,
    sanitizeHTML(els.noteText.innerHTML),
    [..._tags],
    _reminderAt,
    [..._attachments],
  );
}

function saveAndBack() { save(); close(); }

function cancel() {
  if (state.isNewNote) {
    db.deleteNote(state.editingNoteId);
  } else if (state.originalNote) {
    db.updateNote(
      state.editingNoteId,
      state.originalNote.courseId,
      state.originalNote.title,
      state.originalNote.text,
      state.originalNote.tags        || [],
      state.originalNote.reminderAt  || null,
      state.originalNote.attachments || [],
    );
  }
  close();
}

async function deleteNote() {
  if (!on.onDeleteNote) return;
  const deleted = await on.onDeleteNote(state.editingNoteId);
  if (deleted) close();
}

function goNext() {
  save();
  const notes = db.getNotes();
  const idx   = notes.findIndex(n => n.id === state.editingNoteId);
  if (idx === -1 || idx >= notes.length - 1) return;
  const next = notes[idx + 1];
  open(next.id, false, {
    courseId:    next.courseId,
    title:       next.title,
    text:        next.text,
    tags:        [...(next.tags || [])],
    reminderAt:  next.reminderAt  || null,
    attachments: [...(next.attachments || [])],
  });
}

function syncNextBtn() {
  const notes = db.getNotes();
  const idx   = notes.findIndex(n => n.id === state.editingNoteId);
  els.nextBtn.disabled = idx === -1 || idx >= notes.length - 1;
}

function emailNote() {
  const course  = db.getCourse(els.courseSelect.value);
  const subject = els.noteTitle.value;
  const body    = `${course ? `Category: ${course.title}\n\n` : ''}${els.noteText.textContent || ''}`;
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ── Rich-text helpers ──────────────────────────────────

function insertLink() {
  const url = prompt('Enter link URL (https://...):');
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) {
    snackbar.show('Only https:// and http:// links are allowed.');
    return;
  }
  els.noteText.focus();
  document.execCommand('createLink', false, url);
  // Ensure all inserted links open in a new tab safely
  els.noteText.querySelectorAll('a').forEach(a => {
    a.target = '_blank';
    a.rel    = 'noopener noreferrer';
  });
  syncToolbar();
}

function toggleHighlight() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  const div   = document.createElement('div');
  div.appendChild(range.cloneContents());
  document.execCommand('insertHTML', false, `<mark>${div.innerHTML}</mark>`);
  els.noteText.focus();
}

// ── File attachments ───────────────────────────────────

async function handleFileChange() {
  for (const file of [...els.fileInput.files]) {
    await processFile(file);
  }
  els.fileInput.value = '';
}

async function processFile(file) {
  const MAX = 2 * 1024 * 1024;
  if (file.size > MAX) {
    snackbar.show(`"${file.name}" exceeds the 2 MB limit.`);
    return;
  }
  const dataUrl = await new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

  if (file.type.startsWith('image/')) {
    els.noteText.focus();
    document.execCommand('insertHTML', false,
      `<img src="${dataUrl}" alt="${esc(file.name)}">`);
    syncToolbar();
  } else {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    _attachments.push({ id, name: file.name, type: file.type, size: file.size, data: dataUrl });
    renderAttachments();
    snackbar.show(`"${file.name}" attached.`);
  }
}

function renderAttachments() {
  if (!_attachments.length) {
    els.attachmentPanel.classList.add('hidden');
    els.attachmentPanel.innerHTML = '';
    return;
  }
  els.attachmentPanel.classList.remove('hidden');
  els.attachmentPanel.innerHTML = _attachments.map((att, idx) => `
    <div class="attachment-chip">
      <span class="attachment-icon">${fileIcon(att.type)}</span>
      <span class="attachment-name" title="${esc(att.name)}">${esc(att.name)}</span>
      <span class="attachment-size">${fmtSize(att.size)}</span>
      <a  class="attachment-download" href="${att.data}" download="${esc(att.name)}" title="Download">⬇</a>
      <button class="attachment-remove" data-idx="${idx}" title="Remove">✕</button>
    </div>
  `).join('');

  els.attachmentPanel.querySelectorAll('.attachment-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      _attachments.splice(parseInt(btn.dataset.idx, 10), 1);
      renderAttachments();
    });
  });
}

function fileIcon(type) {
  if (type.startsWith('image/'))                                   return '🖼';
  if (type.startsWith('video/'))                                   return '🎬';
  if (type.startsWith('audio/'))                                   return '🎵';
  if (type.includes('pdf'))                                        return '📄';
  if (type.includes('spreadsheet') || type.includes('excel'))     return '📊';
  if (type.includes('document')   || type.includes('word'))       return '📝';
  return '📎';
}

function fmtSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Reminders ──────────────────────────────────────────

function syncReminderBtn() {
  els.reminderBtn.classList.toggle('has-reminder', !!_reminderAt);
}

function openReminderModal() {
  const base = _reminderAt ? new Date(_reminderAt) : new Date(Date.now() + 60 * 60 * 1000);
  // datetime-local requires YYYY-MM-DDTHH:mm (local time)
  const pad = n => String(n).padStart(2, '0');
  els.reminderDatetime.value =
    `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}` +
    `T${pad(base.getHours())}:${pad(base.getMinutes())}`;
  els.reminderOverlay.classList.add('open');
}

function saveReminder() {
  const val = els.reminderDatetime.value;
  if (!val) return;
  _reminderAt = new Date(val).getTime();
  syncReminderBtn();
  els.reminderOverlay.classList.remove('open');
  snackbar.show('Reminder saved.');
}

function clearReminder() {
  _reminderAt = null;
  syncReminderBtn();
  els.reminderOverlay.classList.remove('open');
  snackbar.show('Reminder cleared.');
}

// ── Sharing ────────────────────────────────────────────

function buildShareLink() {
  const note = db.getNote(state.editingNoteId);
  if (!note) return location.href;
  // Strip images from shared payload to keep URL manageable
  const text = sanitizeHTML(note.text || '').replace(/<img[^>]*>/g, '[image]');
  const payload = JSON.stringify({
    t: note.title  || '',
    c: note.course ? note.course.title : '',
    x: text,
    g: note.tags   || [],
  });
  try {
    const encoded = btoa(unescape(encodeURIComponent(payload)));
    return `${location.origin}${location.pathname}#share=${encoded}`;
  } catch {
    return location.href;
  }
}

function openShareModal() {
  // Try Web Share API first on mobile
  const note = db.getNote(state.editingNoteId);
  const link = buildShareLink();

  if (navigator.share && /Mobi/i.test(navigator.userAgent)) {
    navigator.share({
      title: note ? note.title || 'Note' : 'Note',
      text:  els.noteText.textContent || '',
      url:   link,
    }).catch(() => {});
    return;
  }

  els.shareLinkInput.value = link;
  els.shareOverlay.classList.add('open');
}

function copyShareLink() {
  const link = els.shareLinkInput.value;
  navigator.clipboard.writeText(link)
    .then(() => {
      const orig = els.shareCopyBtn.textContent;
      els.shareCopyBtn.textContent = '✓ Copied!';
      setTimeout(() => { els.shareCopyBtn.textContent = orig; }, 2000);
    })
    .catch(() => {
      els.shareLinkInput.select();
      document.execCommand('copy');
    });
}

function shareByEmail() {
  const note    = db.getNote(state.editingNoteId);
  const subject = encodeURIComponent(note ? note.title || 'Shared Note' : 'Shared Note');
  const body    = encodeURIComponent(
    `${(note && note.title) || ''}\n\n${els.noteText.textContent || ''}\n\n${els.shareLinkInput.value}`
  );
  window.open(`mailto:?subject=${subject}&body=${body}`);
}
