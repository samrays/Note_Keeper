# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

This repository contains two implementations of the same note-taking app:

- **`app/`** — Original Android app (Java, Gradle, API 15–28)
- **`web/`** — Web rebuild (vanilla JS SPA, ES modules, no bundler)

---

## Android app (`app/`)

### Build & run

```bash
# Debug APK
./gradlew assembleDebug

# Release APK
./gradlew assembleRelease

# Clean
./gradlew clean
```

### Tests

All tests are **instrumented** (Espresso) and require a connected device or running emulator:

```bash
# Run all instrumented tests
./gradlew connectedAndroidTest

# Run unit tests (JUnit, no device needed)
./gradlew test
```

Test classes live in `app/src/androidTest/java/com/example/sam/notekeeper/`.

### Architecture

**Entry point:** `Main2Activity` (declared as `LAUNCHER` in the manifest). `NoteListActivity` is an older standalone list activity that is no longer the launcher but still exists.

**Data flow:**
1. `NoteKeeperOpenHelper` manages the SQLite database (`NoteKeeper.db`, v2). On `onCreate` it calls `DatabaseDataWorker` to seed courses and sample notes. On upgrade to v2 it adds indexes.
2. `DataManager` is a singleton in-memory cache. `loadFromDatabase()` must be called at startup (done in `Main2Activity.initializeDisplayContent`) before the in-memory lists are usable.
3. `NoteActivity` bypasses `DataManager` for reads/writes and queries SQLite directly via `CursorLoader` (async). Writes go through `AsyncTask`.

**Key classes:**
- `NoteKeeperDatabaseContract` — single source of truth for all table/column name constants; use `getQName()` for qualified `table.column` references in JOIN queries.
- `NoteRecyclerAdapter` — Cursor-based adapter; call `changeCursor()` to swap data (closes the old cursor).
- `CourseRecyclerAdapter` — List-based adapter for the courses grid.
- `NoteKeeperProvider` — ContentProvider stub. Only `query()` on `course_info` is implemented; all other operations throw `UnsupportedOperationException`.

**Schema:**
```
course_info  (_id, course_id UNIQUE, course_title)
note_info    (_id, note_title, note_text, course_id)
```

Both tables have an index on their title columns (added in DB version 2).

**Settings** are stored in `SharedPreferences` via `PreferenceManager` (keys: `user_display_name`, `user_email_address`, `user_favourite_social`).

---

## Web app (`web/`)

### Running

ES modules require a local HTTP server (browsers block `file://` module imports):

```bash
cd web
npm run dev        # runs: npx serve .
# then open http://localhost:3000
```

All data is persisted to `localStorage`.

### Module structure

```
js/
  db.js                  ← data layer (localStorage)
  state.js               ← single shared mutable state object
  utils.js               ← esc() HTML-escaping helper
  components/
    sidebar.js           ← drawer open/close/nav, header refresh
    snackbar.js          ← show(msg) with auto-dismiss
    settings.js          ← settings modal open/close/save
    editor.js            ← note editor slide-in panel
  views/
    notes.js             ← renders note card list into a container
    courses.js           ← renders course grid into a container
  main.js                ← wires all modules together, owns renderContent()
```

**`js/db.js`** — Named ES module exports wrapping `localStorage`. Seeds 4 courses on first load (`nk_courses` key). Notes use an auto-incrementing ID in `nk_next_id`. `getNotes()` always returns notes joined with their course object, sorted by course title then note title.

**`js/state.js`** — Single exported `state` object (`view`, `editingNoteId`, `isNewNote`, `originalNote`). Passed by reference into components so mutations are shared.

**`js/main.js`** — Owns `renderContent()` (switches between `renderNotes` / `renderCourses` views) and the `newNote` / `openNote` actions. Passes callbacks into each component so components stay decoupled from each other.

**Components** receive an `elements` map and a `callbacks` map from `main.js` — they never query the DOM themselves and don't import other components.

**Editor behaviour:** Cancel on a new note deletes it from DB; cancel on an existing note restores the `originalNote` snapshot. The Next button navigates through notes in the same sorted order as the list and is disabled when at the last note. Email opens a `mailto:` link with the note title as subject.
