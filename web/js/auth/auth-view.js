import * as auth from './auth.js';

let els = {};
let onSuccess = null;
let pendingResetEmail = '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function init(onAuthSuccess) {
  onSuccess = onAuthSuccess;

  els = {
    overlay:              document.getElementById('auth-overlay'),
    // login
    loginPanel:           document.getElementById('login-panel'),
    loginForm:            document.getElementById('login-form'),
    loginEmail:           document.getElementById('login-email'),
    loginPassword:        document.getElementById('login-password'),
    loginError:           document.getElementById('login-error'),
    toSignup:             document.getElementById('to-signup'),
    toReset:              document.getElementById('to-reset'),
    // signup
    signupPanel:          document.getElementById('signup-panel'),
    signupForm:           document.getElementById('signup-form'),
    signupName:           document.getElementById('signup-name'),
    signupEmail:          document.getElementById('signup-email'),
    signupPassword:       document.getElementById('signup-password'),
    signupConfirm:        document.getElementById('signup-confirm'),
    signupError:          document.getElementById('signup-error'),
    toLogin:              document.getElementById('to-login'),
    // reset step 1
    resetPanel:           document.getElementById('reset-panel'),
    resetForm:            document.getElementById('reset-form'),
    resetEmailInput:      document.getElementById('reset-email-input'),
    resetError:           document.getElementById('reset-error'),
    backToLogin:          document.getElementById('back-to-login'),
    // reset step 2
    resetConfirmPanel:    document.getElementById('reset-confirm-panel'),
    resetConfirmForm:     document.getElementById('reset-confirm-form'),
    resetNewPassword:     document.getElementById('reset-new-password'),
    resetConfirmPassword: document.getElementById('reset-confirm-password'),
    resetConfirmError:    document.getElementById('reset-confirm-error'),
  };

  els.loginForm.addEventListener('submit', handleLogin);
  els.signupForm.addEventListener('submit', handleSignup);
  els.resetForm.addEventListener('submit', handleResetStep1);
  els.resetConfirmForm.addEventListener('submit', handleResetStep2);

  els.toSignup.addEventListener('click', () => showMode('signup'));
  els.toLogin.addEventListener('click', () => showMode('login'));
  els.toReset.addEventListener('click', () => showMode('reset'));
  els.backToLogin.addEventListener('click', () => showMode('login'));
}

export function show() {
  showMode('login');
  els.overlay.classList.remove('hidden');
}

export function hide() {
  els.overlay.classList.add('hidden');
}

function showMode(mode) {
  clearErrors();
  const map = {
    login:          els.loginPanel,
    signup:         els.signupPanel,
    reset:          els.resetPanel,
    'reset-confirm': els.resetConfirmPanel,
  };
  Object.entries(map).forEach(([key, panel]) => {
    panel.classList.toggle('hidden', key !== mode);
  });
}

function clearErrors() {
  [els.loginError, els.signupError, els.resetError, els.resetConfirmError]
    .forEach(el => { if (el) el.textContent = ''; });
}

async function handleLogin(e) {
  e.preventDefault();
  const email = els.loginEmail.value.trim();
  if (!EMAIL_RE.test(email)) {
    els.loginError.textContent = 'Please enter a valid email address.';
    return;
  }
  const result = await auth.login(email, els.loginPassword.value);
  if (!result.ok) { els.loginError.textContent = result.error; return; }
  hide();
  onSuccess(auth.getCurrentUser());
}

async function handleSignup(e) {
  e.preventDefault();
  const name  = els.signupName.value.trim();
  const email = els.signupEmail.value.trim();
  if (!name) {
    els.signupError.textContent = 'Display name is required.';
    return;
  }
  if (name.length > 50) {
    els.signupError.textContent = 'Display name must be 50 characters or fewer.';
    return;
  }
  if (!EMAIL_RE.test(email)) {
    els.signupError.textContent = 'Please enter a valid email address.';
    return;
  }
  if (els.signupPassword.value.length < 6) {
    els.signupError.textContent = 'Password must be at least 6 characters.';
    return;
  }
  if (els.signupPassword.value !== els.signupConfirm.value) {
    els.signupError.textContent = 'Passwords do not match.';
    return;
  }
  const result = await auth.signUp(email, name, els.signupPassword.value);
  if (!result.ok) { els.signupError.textContent = result.error; return; }
  hide();
  onSuccess(auth.getCurrentUser());
}

async function handleResetStep1(e) {
  e.preventDefault();
  const email = els.resetEmailInput.value.trim();
  if (!EMAIL_RE.test(email)) {
    els.resetError.textContent = 'Please enter a valid email address.';
    return;
  }
  if (!auth.emailExists(email)) {
    els.resetError.textContent = 'No account found with this email.';
    return;
  }
  pendingResetEmail = email;
  showMode('reset-confirm');
}

async function handleResetStep2(e) {
  e.preventDefault();
  if (els.resetNewPassword.value.length < 6) {
    els.resetConfirmError.textContent = 'Password must be at least 6 characters.';
    return;
  }
  if (els.resetNewPassword.value !== els.resetConfirmPassword.value) {
    els.resetConfirmError.textContent = 'Passwords do not match.';
    return;
  }
  const result = await auth.resetPassword(pendingResetEmail, els.resetNewPassword.value);
  if (!result.ok) { els.resetConfirmError.textContent = result.error; return; }
  els.resetNewPassword.value = '';
  els.resetConfirmPassword.value = '';
  showMode('login');
}
