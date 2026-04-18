const token = localStorage.getItem('auth_token');
if (!token) window.location.href = 'login.html';

const username = localStorage.getItem('auth_username') || '';
document.getElementById('username-display').textContent = `👋 ${username}`;
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_username');
  window.location.href = 'login.html';
});

const CATEGORY_COLORS = {
  travail:       { bg: '#dbeafe', text: '#1d4ed8' },
  perso:         { bg: '#dcfce7', text: '#15803d' },
  administratif: { bg: '#fef9c3', text: '#a16207' },
  sport:         { bg: '#fee2e2', text: '#b91c1c' },
  achat:         { bg: '#f3e8ff', text: '#7e22ce' },
};

const CATEGORY_LABELS = {
  travail:       '💼 Travail',
  perso:         '🏠 Perso',
  administratif: '📋 Administratif',
  sport:         '⚽ Sport',
  achat:         '🛒 Achat',
};

let todos = [];
let currentFilter = 'all';
let currentCat    = 'all';

const form           = document.getElementById('todo-form');
const input          = document.getElementById('todo-input');
const categorySelect = document.getElementById('category-select');
const list           = document.getElementById('todo-list');
const itemsLeft      = document.getElementById('items-left');
const clearBtn       = document.getElementById('clear-completed');
const filterBtns     = document.querySelectorAll('.filter-btn');
const catBtns        = document.querySelectorAll('.cat-btn');

function headers() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, { headers: headers(), ...options });
  if (res.status === 401) { window.location.href = 'login.html'; return; }
  if (res.status === 204)  return null;
  return res.json();
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const filtered = todos.filter(t => {
    const statusOk = currentFilter === 'all' || (currentFilter === 'active' ? !t.done : t.done);
    const catOk    = currentCat === 'all' || t.category === currentCat;
    return statusOk && catOk;
  });

  list.innerHTML = '';
  filtered.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' completed' : '');

    const checkbox = document.createElement('input');
    checkbox.type    = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.id      = 'item-' + todo.id;
    checkbox.addEventListener('change', () => toggle(todo));

    const label = document.createElement('label');
    label.htmlFor     = 'item-' + todo.id;
    label.textContent = todo.text;

    const badge = document.createElement('span');
    badge.className = 'cat-badge';
    const col = CATEGORY_COLORS[todo.category] || { bg: '#f0f0f0', text: '#666' };
    badge.style.background = col.bg;
    badge.style.color      = col.text;
    badge.textContent      = CATEGORY_LABELS[todo.category] || todo.category;

    const del = document.createElement('button');
    del.className   = 'delete-btn';
    del.textContent = '✕';
    del.title       = 'Supprimer';
    del.addEventListener('click', () => remove(todo.id));

    li.append(checkbox, label, badge, del);
    list.appendChild(li);
  });

  const remaining = todos.filter(t => !t.done).length;
  itemsLeft.textContent = `${remaining} tâche${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`;
}

async function loadTodos() {
  todos = await apiFetch('/todos') || [];
  render();
}

async function addTodo(text, category) {
  const todo = await apiFetch('/todos', {
    method: 'POST',
    body: JSON.stringify({ text, category }),
  });
  if (todo) { todos.unshift(todo); render(); }
}

async function toggle(todo) {
  const updated = await apiFetch(`/todos/${todo.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ done: !todo.done }),
  });
  if (updated) {
    const idx = todos.findIndex(t => t.id === todo.id);
    if (idx !== -1) { todos[idx] = updated; render(); }
  }
}

async function remove(id) {
  await apiFetch(`/todos/${id}`, { method: 'DELETE' });
  todos = todos.filter(t => t.id !== id);
  render();
}

async function clearCompleted() {
  await apiFetch('/todos/completed', { method: 'DELETE' });
  todos = todos.filter(t => !t.done);
  render();
}

async function clearCompleted() {
  await apiFetch('/todos/completed', { method: 'DELETE' });
  todos = todos.filter(t => !t.done);
  render();
}

// ── Events ────────────────────────────────────────────────────────────────────
form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (text) { addTodo(text, categorySelect.value); input.value = ''; }
});

clearBtn.addEventListener('click', clearCompleted);

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

catBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    catBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCat = btn.dataset.cat;
    render();
  });
});

loadTodos();
