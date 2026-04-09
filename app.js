const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const categorySelect = document.getElementById('category-select');
const list = document.getElementById('todo-list');
const itemsLeft = document.getElementById('items-left');
const clearBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');
const catBtns = document.querySelectorAll('.cat-btn');

const CATEGORY_COLORS = {
  travail:       { bg: '#dbeafe', text: '#1d4ed8' },
  perso:         { bg: '#dcfce7', text: '#15803d' },
  administratif: { bg: '#fef9c3', text: '#a16207' },
  sport:         { bg: '#fee2e2', text: '#b91c1c' },
  achat:         { bg: '#f3e8ff', text: '#7e22ce' },
};

const CATEGORY_LABELS = {
  travail: '💼 Travail',
  perso: '🏠 Perso',
  administratif: '📋 Administratif',
  sport: '⚽ Sport',
  achat: '🛒 Achat',
};

let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentFilter = 'all';
let currentCat = 'all';

function save() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function render() {
  const filtered = todos.filter(t => {
    const statusOk = currentFilter === 'all' || (currentFilter === 'active' ? !t.done : t.done);
    const catOk = currentCat === 'all' || t.category === currentCat;
    return statusOk && catOk;
  });

  list.innerHTML = '';
  filtered.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' completed' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.id = 'item-' + todo.id;
    checkbox.addEventListener('change', () => toggle(todo.id));

    const label = document.createElement('label');
    label.htmlFor = 'item-' + todo.id;
    label.textContent = todo.text;

    const badge = document.createElement('span');
    badge.className = 'cat-badge';
    const col = CATEGORY_COLORS[todo.category] || { bg: '#f0f0f0', text: '#666' };
    badge.style.background = col.bg;
    badge.style.color = col.text;
    badge.textContent = CATEGORY_LABELS[todo.category] || todo.category;

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.textContent = '✕';
    del.title = 'Supprimer';
    del.addEventListener('click', () => remove(todo.id));

    li.append(checkbox, label, badge, del);
    list.appendChild(li);
  });

  const remaining = todos.filter(t => !t.done).length;
  itemsLeft.textContent = `${remaining} tâche${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`;
}

function add(text, category) {
  todos.push({ id: Date.now(), text, category, done: false });
  save();
  render();
}

function toggle(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) { todo.done = !todo.done; save(); render(); }
}

function remove(id) {
  todos = todos.filter(t => t.id !== id);
  save();
  render();
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (text) { add(text, categorySelect.value); input.value = ''; }
});

clearBtn.addEventListener('click', () => {
  todos = todos.filter(t => !t.done);
  save();
  render();
});

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

render();
