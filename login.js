// Redirect if already authenticated
if (localStorage.getItem('auth_token')) {
  window.location.href = 'index.html';
}

const tabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    loginForm.hidden = target !== 'login';
    registerForm.hidden = target !== 'register';
    loginError.textContent = '';
    registerError.textContent = '';
  });
});

async function apiPost(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Erreur serveur');
  return data;
}

function saveAuth(data) {
  localStorage.setItem('auth_token', data.access_token);
  localStorage.setItem('auth_username', data.username);
  window.location.href = 'index.html';
}

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  loginError.textContent = '';
  try {
    const data = await apiPost('/auth/login', {
      username: document.getElementById('login-username').value.trim(),
      password: document.getElementById('login-password').value,
    });
    saveAuth(data);
  } catch (err) {
    loginError.textContent = err.message;
  }
});

registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  registerError.textContent = '';
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  if (password !== confirm) {
    registerError.textContent = 'Les mots de passe ne correspondent pas.';
    return;
  }
  try {
    const data = await apiPost('/auth/register', {
      username: document.getElementById('reg-username').value.trim(),
      password,
    });
    saveAuth(data);
  } catch (err) {
    registerError.textContent = err.message;
  }
});
