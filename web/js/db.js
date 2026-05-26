// Notes, settings, and ID counters are scoped per user.
// Categories (courses key) are global and shared across accounts.

let _userId = 'guest';
export function setCurrentUser(id) { _userId = id; }

const COURSES_KEY = 'nk_courses';
function notesKey()    { return `nk_notes_${_userId}`; }
function settingsKey() { return `nk_settings_${_userId}`; }
function nextIdKey()   { return `nk_next_id_${_userId}`; }

const DEFAULT_COURSES = [
  { id: 'personal_dev',    title: 'Personal Development',   icon: '🌱' },
  { id: 'health_wellness', title: 'Health and Wellness',    icon: '💪' },
  { id: 'education',       title: 'Education and Learning', icon: '📖' },
  { id: 'work_career',     title: 'Work and Career',        icon: '💼' },
  { id: 'finance',         title: 'Finance and Budgeting',  icon: '💰' },
  { id: 'travel',          title: 'Travel and Adventure',   icon: '✈️' },
  { id: 'creative',        title: 'Creative Projects',      icon: '🎨' },
  { id: 'relationships',   title: 'Relationships and Social Life', icon: '❤️' },
  { id: 'home',            title: 'Home Management',        icon: '🏠' },
  { id: 'misc',            title: 'Miscellaneous',          icon: '✨' },
];

// Migrate from the old Pluralsight course data on first load.
(function seedCategories() {
  const stored = localStorage.getItem(COURSES_KEY);
  if (!stored || stored.includes('android_intents')) {
    localStorage.setItem(COURSES_KEY, JSON.stringify(DEFAULT_COURSES));
  }
})();

// ── Template notes ─────────────────────────────────────
// Seeded once per new user account (30 notes across 10 categories).

const NOTE_TEMPLATES = [
  // Personal Development
  {
    courseId: 'personal_dev', title: 'Goals',
    text: '<h3>Short-term Goals</h3><ul><li>Add a short-term goal here</li></ul><h3>Long-term Goals</h3><ul><li>Add a long-term goal here</li></ul>',
    tags: ['goals'],
  },
  {
    courseId: 'personal_dev', title: 'Books Read',
    text: '<h3>Book Title</h3><p><strong>Key Takeaway:</strong> Write the main idea or lesson here.</p><p><strong>Favourite Quote:</strong> Add a quote from the book.</p>',
    tags: ['books', 'reading'],
  },
  {
    courseId: 'personal_dev', title: 'Lessons Learned',
    text: '<p>Reflect on recent experiences. What happened, what did you learn, and how will you apply it?</p><ul><li>Experience: </li><li>Lesson: </li><li>Action: </li></ul>',
    tags: ['reflection'],
  },

  // Health and Wellness
  {
    courseId: 'health_wellness', title: 'Fitness Goals',
    text: '<h3>Current Goals</h3><ul><li>Goal 1</li><li>Goal 2</li></ul><h3>Weekly Plan</h3><ul><li>Mon – </li><li>Wed – </li><li>Fri – </li></ul><h3>Progress</h3><p>Track milestones and personal bests here.</p>',
    tags: ['fitness', 'exercise'],
  },
  {
    courseId: 'health_wellness', title: 'Diet and Nutrition',
    text: '<h3>Dietary Goals</h3><p>Describe your nutrition objectives.</p><h3>Meal Plan</h3><ul><li>Breakfast: </li><li>Lunch: </li><li>Dinner: </li><li>Snacks: </li></ul><h3>Recipes to Try</h3><ul><li>Add recipes here</li></ul>',
    tags: ['nutrition', 'diet'],
  },
  {
    courseId: 'health_wellness', title: 'Mental Health Journal',
    text: '<h3>How I\'m Feeling Today</h3><p>Write freely about your mood, thoughts, and emotions.</p><h3>Stress Management Techniques</h3><ul><li>Deep breathing exercises</li><li>10-minute meditation</li><li>Walk outside</li><li>Journaling</li></ul><h3>Wins This Week</h3><p>List things that went well, no matter how small.</p>',
    tags: ['mental-health', 'journal'],
  },

  // Education and Learning
  {
    courseId: 'education', title: 'Class Notes',
    text: '<h3>Topic</h3><p>Write the subject or lecture title here.</p><h3>Key Points</h3><ul><li>Point 1</li><li>Point 2</li><li>Point 3</li></ul><h3>Questions to Follow Up</h3><ul><li>Add questions here</li></ul>',
    tags: ['study', 'class'],
  },
  {
    courseId: 'education', title: 'Study Plan',
    text: '<h3>Exam / Topic</h3><p>Describe what you\'re preparing for.</p><h3>Study Schedule</h3><ul><li>Week 1 – Topics to cover: </li><li>Week 2 – Topics to cover: </li><li>Week 3 – Review</li></ul><h3>Resources</h3><ul><li>Textbook chapters: </li><li>Online resources: </li></ul>',
    tags: ['study', 'planning'],
  },
  {
    courseId: 'education', title: 'Research Ideas',
    text: '<p>Capture topics of interest for future study or projects.</p><ul><li>Topic: – <em>Why it interests me:</em> </li><li>Topic: – <em>Why it interests me:</em> </li></ul>',
    tags: ['research', 'ideas'],
  },

  // Work and Career
  {
    courseId: 'work_career', title: 'Meeting Notes',
    text: '<p><strong>Date:</strong> <strong>Attendees:</strong> </p><h3>Key Discussion Points</h3><ul><li>Point 1</li><li>Point 2</li></ul><h3>Decisions Made</h3><ul><li>Decision 1</li></ul><h3>Action Items</h3><ul><li>[ ] Action – Owner – Due date</li></ul>',
    tags: ['meetings', 'work'],
  },
  {
    courseId: 'work_career', title: 'Project Plan',
    text: '<h3>Project Overview</h3><p>Describe the project scope and objectives.</p><h3>Milestones</h3><ul><li>Milestone 1 – Due: </li><li>Milestone 2 – Due: </li></ul><h3>Responsibilities</h3><ul><li>Name – Task</li></ul><h3>Notes and Risks</h3><p>Any blockers or considerations.</p>',
    tags: ['projects', 'work'],
  },
  {
    courseId: 'work_career', title: 'Networking Contacts',
    text: '<h3>Contact</h3><ul><li><strong>Name:</strong> </li><li><strong>Company / Role:</strong> </li><li><strong>Met at:</strong> </li><li><strong>Follow-up:</strong> </li><li><strong>Notes:</strong> </li></ul>',
    tags: ['networking', 'career'],
  },

  // Finance and Budgeting
  {
    courseId: 'finance', title: 'Expense Tracking',
    text: '<h3>Monthly Budget</h3><ul><li>Income: </li><li>Rent / Mortgage: </li><li>Groceries: </li><li>Transport: </li><li>Entertainment: </li><li>Savings: </li></ul><h3>Notes</h3><p>Any unusual expenses or adjustments this month.</p>',
    tags: ['budget', 'expenses'],
  },
  {
    courseId: 'finance', title: 'Investment Ideas',
    text: '<p>Track potential investment ideas and research notes.</p><ul><li><strong>Idea:</strong> – <strong>Risk level:</strong> – <strong>Notes:</strong> </li></ul>',
    tags: ['investing', 'finance'],
  },
  {
    courseId: 'finance', title: 'Savings Goals',
    text: '<h3>Goal</h3><p>Describe what you\'re saving for and why.</p><h3>Plan</h3><ul><li>Target amount: </li><li>Monthly contribution: </li><li>Target date: </li></ul><h3>Progress</h3><ul><li>Saved so far: </li></ul>',
    tags: ['savings', 'goals'],
  },

  // Travel and Adventure
  {
    courseId: 'travel', title: 'Travel Plans',
    text: '<h3>Destination</h3><p></p><h3>Itinerary</h3><ul><li>Day 1 – </li><li>Day 2 – </li><li>Day 3 – </li></ul><h3>Packing List</h3><ul><li>Passport / ID</li><li>Accommodation details</li><li>Clothes</li><li>Chargers</li><li>Travel insurance</li></ul>',
    tags: ['travel', 'planning'],
  },
  {
    courseId: 'travel', title: 'Travel Experiences',
    text: '<h3>Destination</h3><p></p><h3>Highlights</h3><ul><li>Add your favourite moments</li></ul><h3>Lessons Learned</h3><p>What would you do differently?</p><h3>Would Recommend?</h3><p></p>',
    tags: ['travel', 'memories'],
  },
  {
    courseId: 'travel', title: 'Bucket List',
    text: '<h3>Places to Visit</h3><ul><li>🗺 Destination 1</li><li>🗺 Destination 2</li><li>🗺 Destination 3</li></ul><h3>Experiences to Have</h3><ul><li>⭐ Experience 1</li><li>⭐ Experience 2</li></ul>',
    tags: ['bucket-list', 'dreams'],
  },

  // Creative Projects
  {
    courseId: 'creative', title: 'Ideas',
    text: '<p>Brainstorm freely — no idea is too small.</p><ul><li>Idea 1: </li><li>Idea 2: </li><li>Idea 3: </li></ul><h3>Most Promising</h3><p>Expand on the idea with the most potential here.</p>',
    tags: ['ideas', 'creative'],
  },
  {
    courseId: 'creative', title: 'Project Progress',
    text: '<h3>Project Name</h3><p></p><h3>Current Status</h3><p>Describe where things stand.</p><h3>Next Steps</h3><ul><li>Step 1</li><li>Step 2</li></ul><h3>Deadline</h3><p></p>',
    tags: ['projects', 'creative'],
  },
  {
    courseId: 'creative', title: 'Feedback and Critiques',
    text: '<h3>Project / Work Reviewed</h3><p></p><h3>Positive Feedback</h3><ul><li></li></ul><h3>Areas for Improvement</h3><ul><li></li></ul><h3>Action Plan</h3><p>How will you apply this feedback?</p>',
    tags: ['feedback', 'improvement'],
  },

  // Relationships and Social Life
  {
    courseId: 'relationships', title: 'Important Dates',
    text: '<h3>Birthdays</h3><ul><li>Name – Date</li></ul><h3>Anniversaries</h3><ul><li>Event – Date</li></ul><h3>Upcoming Events</h3><ul><li>Event – Date – Notes</li></ul>',
    tags: ['dates', 'relationships'],
  },
  {
    courseId: 'relationships', title: 'Conversation Notes',
    text: '<p><strong>With:</strong> <strong>Date:</strong> </p><h3>Key Points Discussed</h3><ul><li></li></ul><h3>Follow-up</h3><p>Any action items or things to remember from this conversation.</p>',
    tags: ['conversations'],
  },
  {
    courseId: 'relationships', title: 'Relationship Goals',
    text: '<h3>Intentions</h3><p>Write your goals for a specific relationship or relationships in general.</p><ul><li>Goal 1: </li><li>Goal 2: </li></ul><h3>Progress Check</h3><p>Reflect on how things are going.</p>',
    tags: ['relationships', 'goals'],
  },

  // Home Management
  {
    courseId: 'home', title: 'To-Do List',
    text: '<h3>This Week</h3><ul><li>[ ] Task 1</li><li>[ ] Task 2</li><li>[ ] Task 3</li></ul><h3>This Month</h3><ul><li>[ ] Task A</li><li>[ ] Task B</li></ul><h3>Someday</h3><ul><li>[ ] Project 1</li></ul>',
    tags: ['todo', 'home'],
  },
  {
    courseId: 'home', title: 'Recipes',
    text: '<h3>Recipe Name</h3><p><strong>Serves:</strong> <strong>Time:</strong> </p><h3>Ingredients</h3><ul><li>Ingredient 1</li><li>Ingredient 2</li></ul><h3>Method</h3><ol><li>Step 1</li><li>Step 2</li></ol>',
    tags: ['recipes', 'cooking'],
  },
  {
    courseId: 'home', title: 'Gardening Notes',
    text: '<h3>Plants</h3><ul><li>Plant name – Care notes – Last watered</li></ul><h3>Seasonal Tasks</h3><ul><li>Spring: </li><li>Summer: </li><li>Autumn: </li><li>Winter: </li></ul>',
    tags: ['garden', 'plants'],
  },

  // Miscellaneous
  {
    courseId: 'misc', title: 'Quotes',
    text: '<p>Collect quotes that inspire or resonate with you.</p><blockquote>Add a quote here — Author</blockquote><blockquote>Add another quote — Author</blockquote>',
    tags: ['quotes', 'inspiration'],
  },
  {
    courseId: 'misc', title: 'Hobbies',
    text: '<h3>Current Hobbies</h3><ul><li>Hobby – What I love about it</li></ul><h3>Skills to Learn</h3><ul><li>Skill 1</li><li>Skill 2</li></ul><h3>Projects to Start</h3><ul><li>Project idea</li></ul>',
    tags: ['hobbies', 'interests'],
  },
  {
    courseId: 'misc', title: 'Dreams and Ideas',
    text: '<p>A space to capture spontaneous ideas and dreams before they fade.</p><ul><li>Dream / Idea: </li><li>Dream / Idea: </li><li>Dream / Idea: </li></ul>',
    tags: ['dreams', 'ideas'],
  },
];

// Seeds the 30 template notes for a brand-new user account (no-op if notes exist).
export function seedDefaultNotes() {
  const existing = JSON.parse(localStorage.getItem(notesKey())) || [];
  if (existing.length > 0) return;

  let nextId = parseInt(localStorage.getItem(nextIdKey()) || '1', 10);
  const now  = Date.now();
  const notes = NOTE_TEMPLATES.map((t, i) => ({
    id:          nextId + i,
    courseId:    t.courseId,
    title:       t.title,
    text:        t.text,
    tags:        t.tags || [],
    reminderAt:  null,
    attachments: [],
    createdAt:   now,
    updatedAt:   now,
  }));

  localStorage.setItem(notesKey(), JSON.stringify(notes));
  localStorage.setItem(nextIdKey(), String(nextId + notes.length));
}

// ── CRUD ───────────────────────────────────────────────

export function getCourses() {
  return JSON.parse(localStorage.getItem(COURSES_KEY)) || [];
}

export function getCourse(id) {
  return getCourses().find(c => c.id === id) || null;
}

export function getNotes() {
  const courses = getCourses();
  return (JSON.parse(localStorage.getItem(notesKey())) || [])
    .map(n => ({
      ...n,
      tags:   n.tags   || [],
      course: courses.find(c => c.id === n.courseId) || null,
    }))
    .sort((a, b) => {
      const cA = a.course ? a.course.title : '';
      const cB = b.course ? b.course.title : '';
      if (cA !== cB) return cA.localeCompare(cB);
      return (a.title || '').localeCompare(b.title || '');
    });
}

export function getNote(id) {
  const notes = JSON.parse(localStorage.getItem(notesKey())) || [];
  const note  = notes.find(n => n.id === id);
  return note
    ? { ...note, tags: note.tags || [], course: getCourse(note.courseId) }
    : null;
}

export function createNote(courseId, title, text) {
  const notes = JSON.parse(localStorage.getItem(notesKey())) || [];
  const id    = parseInt(localStorage.getItem(nextIdKey()) || '1', 10);
  localStorage.setItem(nextIdKey(), String(id + 1));
  const now  = Date.now();
  const note = {
    id,
    courseId:    courseId || DEFAULT_COURSES[0].id,
    title:       title || '',
    text:        text  || '',
    tags:        [],
    reminderAt:  null,
    attachments: [],
    createdAt:   now,
    updatedAt:   now,
  };
  notes.push(note);
  localStorage.setItem(notesKey(), JSON.stringify(notes));
  return note;
}

export function updateNote(id, courseId, title, text, tags, reminderAt = null, attachments = []) {
  const notes = JSON.parse(localStorage.getItem(notesKey())) || [];
  const idx   = notes.findIndex(n => n.id === id);
  if (idx === -1) return false;
  notes[idx] = {
    ...notes[idx],
    courseId,
    title:       (title || '').slice(0, 200),
    text,
    tags:        (tags || []).slice(0, 10).map(t => t.slice(0, 30)),
    reminderAt:  reminderAt  || null,
    attachments: attachments || [],
    updatedAt:   Date.now(),
  };
  localStorage.setItem(notesKey(), JSON.stringify(notes));
  return true;
}

export function deleteNote(id) {
  const notes = JSON.parse(localStorage.getItem(notesKey())) || [];
  localStorage.setItem(notesKey(), JSON.stringify(notes.filter(n => n.id !== id)));
}

export function getSettings() {
  return JSON.parse(localStorage.getItem(settingsKey())) || {
    userName:     '',
    emailAddress: '',
    favSocial:    'Twitter',
  };
}

export function saveSettings(settings) {
  const safe = {
    userName:     (settings.userName     || '').slice(0, 50),
    emailAddress: (settings.emailAddress || '').slice(0, 200),
    favSocial:    (settings.favSocial    || '').slice(0, 50),
  };
  localStorage.setItem(settingsKey(), JSON.stringify(safe));
}
