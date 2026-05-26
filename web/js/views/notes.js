import { esc } from '../utils.js';

function stripHTML(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return div.textContent || '';
}

export function renderNotes(container, notes, searchQuery, { onNoteClick, onDeleteNote }) {
  let displayed = notes;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayed = notes.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      stripHTML(n.text).toLowerCase().includes(q) ||
      (n.tags || []).some(tag => tag.toLowerCase().includes(q))
    );
  }

  if (displayed.length === 0) {
    const isSearch = searchQuery.trim().length > 0;
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">${isSearch ? '🔍' : '📝'}</span>
        <p>${isSearch
          ? `No notes match "<strong>${esc(searchQuery)}</strong>".`
          : 'No notes yet.<br>Tap <strong>＋</strong> to create your first note.'
        }</p>
      </div>
    `;
    return;
  }

  container.innerHTML = displayed.map(note => `
    <div class="note-card" data-id="${note.id}">
      <div class="note-card-body">
        <div class="note-title">
          ${esc(note.title || '(Untitled)')}
          ${note.reminderAt ? `<span class="note-reminder-icon" title="Reminder: ${esc(new Date(note.reminderAt).toLocaleString())}">🔔</span>` : ''}
        </div>
        <div class="note-course">${esc(note.course ? note.course.title : '')}</div>
        ${note.tags.length
          ? `<div class="note-tags">${note.tags.map(t => `<span class="tag-pill">${esc(t)}</span>`).join('')}</div>`
          : ''}
      </div>
      <button class="note-delete-btn" data-id="${note.id}" title="Delete note">🗑</button>
    </div>
  `).join('');

  container.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.note-delete-btn')) return;
      onNoteClick(parseInt(card.dataset.id, 10));
    });
  });

  container.querySelectorAll('.note-delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      onDeleteNote(parseInt(btn.dataset.id, 10));
    });
  });
}
