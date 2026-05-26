const USERS_KEY   = 'nk_users';
const SESSION_KEY  = 'nk_session';
const LEGACY_SALT  = 'nk-salt-2024'; // kept only for migrating old accounts

// ── Hashing ────────────────────────────────────────────

async function generateSalt() {
  const buf = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function pbkdf2Hash(password, salt) {
  const enc     = new TextEncoder();
  const keyMat  = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits    = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100_000 },
    keyMat,
    256
  );
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Used only to verify and then upgrade pre-PBKDF2 accounts.
async function legacyHash(password) {
  const enc  = new TextEncoder();
  const data = enc.encode(LEGACY_SALT + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Storage helpers ────────────────────────────────────

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ── Session ────────────────────────────────────────────

export function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function setSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    id:          user.id,
    email:       user.email,
    displayName: user.displayName,
  }));
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ── Public API ─────────────────────────────────────────

export function emailExists(email) {
  email = email.toLowerCase().trim();
  return getUsers().some(u => u.email === email);
}

export async function signUp(email, displayName, password) {
  email = email.toLowerCase().trim();
  const users = getUsers();
  if (users.some(u => u.email === email)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }
  const salt = await generateSalt();
  const user = {
    id:           Date.now().toString(),
    email,
    displayName:  displayName.trim().slice(0, 50),
    passwordSalt: salt,
    passwordHash: await pbkdf2Hash(password, salt),
  };
  users.push(user);
  saveUsers(users);
  setSession(user);
  return { ok: true, user };
}

export async function login(email, password) {
  email = email.toLowerCase().trim();
  const users = getUsers();
  const idx   = users.findIndex(u => u.email === email);
  if (idx === -1) return { ok: false, error: 'No account found with this email.' };

  const user = users[idx];
  let valid  = false;

  if (user.passwordSalt) {
    // Modern PBKDF2 path
    valid = (await pbkdf2Hash(password, user.passwordSalt)) === user.passwordHash;
  } else {
    // Legacy SHA-256 path — verify then upgrade in place
    if ((await legacyHash(password)) === user.passwordHash) {
      valid = true;
      const salt = await generateSalt();
      users[idx] = { ...user, passwordSalt: salt, passwordHash: await pbkdf2Hash(password, salt) };
      saveUsers(users);
    }
  }

  if (!valid) return { ok: false, error: 'Incorrect password.' };
  setSession(users[idx]);
  return { ok: true, user: users[idx] };
}

export async function resetPassword(email, newPassword) {
  email = email.toLowerCase().trim();
  const users = getUsers();
  const idx   = users.findIndex(u => u.email === email);
  if (idx === -1) return { ok: false, error: 'No account found with this email.' };
  const salt = await generateSalt();
  users[idx] = { ...users[idx], passwordSalt: salt, passwordHash: await pbkdf2Hash(newPassword, salt) };
  saveUsers(users);
  return { ok: true };
}
