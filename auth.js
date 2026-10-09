/* ==========================================================================
   auth.js — handles the Login/Signup page (index.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // If someone is already logged in, skip straight to their module.
  const existingSession = getSession();
  if (existingSession) {
    redirectToModule(existingSession.role);
    return;
  }

  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const message = document.getElementById('auth-message');

  tabLogin.addEventListener('click', () => switchTab('login'));
  tabSignup.addEventListener('click', () => switchTab('signup'));

  function switchTab(which) {
    tabLogin.classList.toggle('is-active', which === 'login');
    tabSignup.classList.toggle('is-active', which === 'signup');
    loginForm.classList.toggle('is-hidden', which !== 'login');
    signupForm.classList.toggle('is-hidden', which !== 'signup');
    setMessage('', '');
  }

  function setMessage(text, kind) {
    message.textContent = text;
    message.className = 'auth-message' + (kind ? ' is-' + kind : '');
  }

  function redirectToModule(role) {
    window.location.href = role === 'admin' ? 'admin.html' : 'user.html';
  }

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    const user = getUsers().find(u => u.email.toLowerCase() === email && u.password === password);

    if (!user) {
      setMessage('That email or password is incorrect.', 'error');
      return;
    }

    setSession(user);
    setMessage('Welcome back! Redirecting…', 'success');
    setTimeout(() => redirectToModule(user.role), 300);
  });

  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const phone = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!name || !email || !password) {
      setMessage('Please fill in name, email and password.', 'error');
      return;
    }
    if (password.length < 4) {
      setMessage('Password should be at least 4 characters.', 'error');
      return;
    }

    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email)) {
      setMessage('An account with this email already exists — try logging in.', 'error');
      return;
    }

    const newUser = {
      id: uid('u'),
      name, email, phone, password,
      role: 'user',
      joined: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);
    setSession(newUser);

    setMessage('Account created! Redirecting…', 'success');
    setTimeout(() => redirectToModule('user'), 300);
  });

});
