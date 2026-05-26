import { esc } from '../utils.js';

export function renderCourses(container, courses, notes) {
  if (!courses.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📓</span>
        <p>No categories in your Note Guide yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="courses-grid">
      ${courses.map(cat => {
        const count = notes.filter(n => n.courseId === cat.id).length;
        return `
          <div class="course-card">
            <div class="course-card-icon">${cat.icon || '📁'}</div>
            <div class="course-title">${esc(cat.title)}</div>
            <span class="course-badge">${count} note${count !== 1 ? 's' : ''}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
