export const state = {
  view: 'notes',       // 'notes' | 'courses'
  editingNoteId: null,
  isNewNote: false,
  originalNote: null,  // { courseId, title, text, tags } snapshot for cancel/revert
  searchQuery: '',
};
