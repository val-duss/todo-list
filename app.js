const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const itemsLeft = document.getElementById('items-left');
const clearBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentFilter = 'all';

function save() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function render() {
  const filtered = todos.filter(t => {
    if (currentFilter === 'active') return !t.done;
    if (currentFilter === 'completed') return t.done;
    return true;
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

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.textContent = '✕';
    del.title = 'Supprimer';
    del.addEventListener('click', () => remove(todo.id));

    li.append(checkbox, label, del);
    list.appendChild(li);
  });

  const remaining = todos.filter(t => !t.done).length;
  itemsLeft.textContent = `${remaining} tâche${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`;
}

function add(text) {
  todos.push({ id: Date.now(), text, done: false });
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
  if (text) { add(text); input.value = ''; }
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

render();
