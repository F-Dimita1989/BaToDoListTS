// app.js

// --- Gestione Personaggi Batman (indipendente) ---
const charForm = document.getElementById('char-form');
const charName = document.getElementById('char-name');
const charAlias = document.getElementById('char-alias');
const charImage = document.getElementById('char-image');
const charRole = document.getElementById('char-role');
const charHeroesContainer = document.getElementById('char-heroes-container');
const charVillainsContainer = document.getElementById('char-villains-container');
const charSearch = document.getElementById('char-search');
const btnAddChar = document.getElementById('btn-add-char');

function charRandomId() {
  try { if (crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (_) {}
  return 'c_' + Math.random().toString(36).slice(2, 10);
}

function loadCharacters() {
  try {
    const raw = localStorage.getItem('batman_characters');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function saveCharacters(chars) {
  localStorage.setItem('batman_characters', JSON.stringify(chars));
}

function createCard(c) {
  const card = document.createElement('div');
  card.className = 'character-card';
  card.innerHTML = `
    <div class="character-image ${c.image ? '' : 'placeholder'}">
      ${c.image ? `<img src="${c.image}" alt="${c.alias || c.name}" onerror="this.parentElement.classList.add('placeholder'); this.style.display='none'; this.parentElement.innerHTML='🦇';" />` : '🦇'}
    </div>
    <div class="character-name">${c.name}</div>
    <div class="character-alias">${c.alias || ''}</div>
    <div class="character-role">${c.role}</div>
    <div class="character-actions">
      <button class="btn btn-outline-warning btn-sm btn-edit">Modifica</button>
      <button class="btn btn-outline-warning btn-sm btn-delete">Elimina</button>
    </div>
    <div class="character-form" style="display: none;">
      <input type="text" class="form-control char-name" value="${c.name}" placeholder="Nome" />
      <input type="text" class="form-control char-alias" value="${c.alias || ''}" placeholder="Alias" />
      <input type="url" class="form-control char-image" value="${c.image || ''}" placeholder="URL immagine" />
      <select class="form-select char-role">
        <option ${c.role==='Eroe'?'selected':''}>Eroe</option>
        <option ${c.role==='Villain'?'selected':''}>Villain</option>
        <option ${c.role==='Alleato'?'selected':''}>Alleato</option>
      </select>
      <div class="d-flex gap-2 mt-2">
        <button class="btn btn-warning btn-sm btn-save">Salva</button>
        <button class="btn btn-outline-warning btn-sm btn-cancel">Annulla</button>
      </div>
    </div>`;

  // Eventi card
  const btnEdit = card.querySelector('.btn-edit');
  const btnDelete = card.querySelector('.btn-delete');
  const btnSave = card.querySelector('.btn-save');
  const btnCancel = card.querySelector('.btn-cancel');
  const form = card.querySelector('.character-form');

  btnEdit.addEventListener('click', () => {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  btnCancel.addEventListener('click', () => {
    form.style.display = 'none';
    card.querySelector('.char-name').value = c.name;
    card.querySelector('.char-alias').value = c.alias || '';
    card.querySelector('.char-image').value = c.image || '';
    card.querySelector('.char-role').value = c.role;
  });

  btnSave.addEventListener('click', () => {
    const newName = card.querySelector('.char-name').value.trim();
    const newAlias = card.querySelector('.char-alias').value.trim();
    const newImage = card.querySelector('.char-image').value.trim();
    const newRole = card.querySelector('.char-role').value;
    if (!newName) { alert('Il nome è obbligatorio'); return; }
    const updated = loadCharacters().map((x) => x.id === c.id ? { ...x, name: newName, alias: newAlias, role: newRole, image: newImage } : x);
    saveCharacters(updated);
    renderCharacters();
  });

  btnDelete.addEventListener('click', () => {
    if (confirm('Sei sicuro di voler eliminare questo personaggio?')) {
      const filtered = loadCharacters().filter(x => x.id !== c.id);
      saveCharacters(filtered);
      renderCharacters();
    }
  });

  return card;
}

function renderCharacters() {
  if (!charHeroesContainer || !charVillainsContainer) return;
  let chars = loadCharacters();
  const q = (charSearch?.value || '').toLowerCase().trim();
  if (q) {
    chars = chars.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.alias || '').toLowerCase().includes(q)
    );
  }
  charHeroesContainer.innerHTML = '';
  charVillainsContainer.innerHTML = '';
  for (const c of chars) {
    const card = createCard(c);
    if (c.role === 'Villain') {
      charVillainsContainer.appendChild(card);
    } else {
      charHeroesContainer.appendChild(card);
    }
  }
}

function addCharacter(e) {
  e?.preventDefault();
  const name = charName.value.trim();
  const alias = charAlias.value.trim();
  const image = (charImage && charImage.value.trim()) || '';
  const role = charRole.value;
  if (!name) { alert('Inserisci un nome'); return; }
  const chars = loadCharacters();
  chars.push({ id: charRandomId(), name, alias, role, image });
  saveCharacters(chars);
  charForm.reset();
  renderCharacters();
}

if (charForm) {
  charForm.addEventListener('submit', addCharacter);
  renderCharacters();
}

if (charSearch) {
  charSearch.addEventListener('input', renderCharacters);
}

if (btnAddChar) {
  btnAddChar.addEventListener('click', addCharacter);
}

// --- Gestione Todo con switch Array/Map ---

const input = document.getElementById('task-title');
const list = document.getElementById('task-list');
const totalCount = document.getElementById('stats');
const STORAGE_KEY_ARRAY = 'persona_todos_array';
const STORAGE_KEY_MAP = 'persona_todos_map';
const STORAGE_KEY_CHOICE = 'todo_storage_choice';

// Manager Array
const todoArrayManager = {
  tasks: [],

  loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY_ARRAY);
    if (stored) {
      const parsed = JSON.parse(stored);
      this.tasks = parsed.map(t => ({
        ...t,
        createdAt: new Date(t.createdAt),
        due: t.due || null,
        completed: t.completed || false,
        id: t.id,
        title: t.title || t.text || ''
      }));
    } else {
      this.tasks = [];
    }
  },

  saveTasks() {
    localStorage.setItem(STORAGE_KEY_ARRAY, JSON.stringify(this.tasks));
  },

  addTask(text) {
    if (!text) return;
    const id = Date.now().toString();
    this.tasks.push({ id, title: text, due: null, completed: false, createdAt: new Date() });
    this.saveTasks();
    this.render();
  },

  toggleDone(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.render();
    }
  },

  removeTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
    this.render();
  },

  clearAll() {
    this.tasks = [];
    this.saveTasks();
    this.render();
  },

  markAll() {
    this.tasks.forEach(t => t.completed = true);
    this.saveTasks();
    this.render();
  },

  removeCompleted() {
    this.tasks = this.tasks.filter(t => !t.completed);
    this.saveTasks();
    this.render();
  },

  render() {
    const container = list;
    if (!container) return;
    const sortBy = document.getElementById('sortBy')?.value || 'createdAt';
    const sortOrder = document.getElementById('sortOrder')?.value || 'desc';
    const activeFilter = document.querySelector('.chip.is-active')?.dataset.filter || 'all';
    const searchInput = document.getElementById('searchInput');
    const searchTerm = (searchInput?.value || '').toLowerCase();

    let filtered = this.tasks;

    if (activeFilter === 'active') filtered = filtered.filter(t => !t.completed);
    else if (activeFilter === 'completed') filtered = filtered.filter(t => t.completed);

    if (searchTerm) {
      filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(searchTerm));
    }

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'title': aVal = (a.title || '').toLowerCase(); bVal = (b.title || '').toLowerCase(); break;
        case 'due': aVal = a.due ? new Date(a.due) : new Date(2099, 11, 31); bVal = b.due ? new Date(b.due) : new Date(2099, 11, 31); break;
        case 'status': aVal = a.completed ? 1 : 0; bVal = b.completed ? 1 : 0; break;
        case 'createdAt':
        default: aVal = a.createdAt; bVal = b.createdAt; break;
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      else return aVal < bVal ? 1 : -1;
    });

    container.innerHTML = '';
    filtered.forEach(t => {
      const li = document.createElement('li');
      li.className = 'task' + (t.completed ? ' completed' : '');
      li.innerHTML = `
        <label class="task__checkbox">
          <input type="checkbox" class="task__toggle" ${t.completed ? 'checked' : ''} />
          <span class="check"></span>
        </label>
        <div class="task__content">
          <input class="task__title" type="text" value="${t.title}" />
          <input class="task__date" type="date" value="${t.due || ''}" />
        </div>
        <div class="task__actions">
          <button class="icon-btn edit" title="Modifica">✎</button>
          <button class="icon-btn delete" title="Elimina">🗑</button>
        </div>`;

      const checkbox = li.querySelector('.task__toggle');
      const deleteBtn = li.querySelector('.delete');
      const titleInput = li.querySelector('.task__title');
      const dateInput = li.querySelector('.task__date');

      checkbox.addEventListener('change', () => this.toggleDone(t.id));
      deleteBtn.addEventListener('click', () => this.removeTask(t.id));
      titleInput.addEventListener('blur', () => {
        const newTitle = titleInput.value.trim();
        if (newTitle && newTitle !== t.title) {
          t.title = newTitle;
          this.saveTasks();
        }
      });
      dateInput.addEventListener('change', () => {
        const newDate = dateInput.value;
        if (newDate !== t.due) {
          t.due = newDate;
          this.saveTasks();
        }
      });

      container.appendChild(li);
    });

    // Aggiorna statistiche
    const stats = document.getElementById('stats');
    if (stats) {
      const total = this.tasks.length;
      const completed = this.tasks.filter(t => t.completed).length;
      const active = total - completed;
      stats.innerHTML = `
        <span class="badge bg-warning text-dark me-2">Totale: ${total}</span>
        <span class="badge bg-success me-2">Completati: ${completed}</span>
        <span class="badge bg-primary me-2">Attivi: ${active}</span>`;
    }
  }
};

// Manager Map
const todoMapManager = {
  tasks: new Map(),

  loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY_MAP);
    if (stored) {
      const parsed = JSON.parse(stored);
      this.tasks.clear();
      parsed.forEach(t => {
        t.createdAt = new Date(t.createdAt);
        this.tasks.set(t.id, t);
      });
    } else {
      this.tasks.clear();
    }
  },

  saveTasks() {
    const arr = Array.from(this.tasks.values());
    localStorage.setItem(STORAGE_KEY_MAP, JSON.stringify(arr));
  },

  addTask(text) {
    if (!text) return;
    const id = Date.now().toString();
    this.tasks.set(id, { id, title: text, due: null, completed: false, createdAt: new Date() });
    this.saveTasks();
    this.render();
  },

  toggleDone(id) {
    const t = this.tasks.get(id);
    if (t) {
      t.completed = !t.completed;
      this.saveTasks();
      this.render();
    }
  },

  removeTask(id) {
    this.tasks.delete(id);
    this.saveTasks();
    this.render();
  },

  clearAll() {
    this.tasks.clear();
    this.saveTasks();
    this.render();
  },

  markAll() {
    for (const t of this.tasks.values()) {
      t.completed = true;
    }
    this.saveTasks();
    this.render();
  },

  removeCompleted() {
    for (const [id, t] of this.tasks.entries()) {
      if (t.completed) this.tasks.delete(id);
    }
    this.saveTasks();
    this.render();
  },

  render() {
    const container = list;
    if (!container) return;
    const sortBy = document.getElementById('sortBy')?.value || 'createdAt';
    const sortOrder = document.getElementById('sortOrder')?.value || 'desc';
    const activeFilter = document.querySelector('.chip.is-active')?.dataset.filter || 'all';
    const searchInput = document.getElementById('searchInput');
    const searchTerm = (searchInput?.value || '').toLowerCase();

    let filtered = Array.from(this.tasks.values());

    if (activeFilter === 'active') filtered = filtered.filter(t => !t.completed);
    else if (activeFilter === 'completed') filtered = filtered.filter(t => t.completed);

    if (searchTerm) {
      filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(searchTerm));
    }

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'title': aVal = (a.title || '').toLowerCase(); bVal = (b.title || '').toLowerCase(); break;
        case 'due': aVal = a.due ? new Date(a.due) : new Date(2099, 11, 31); bVal = b.due ? new Date(b.due) : new Date(2099, 11, 31); break;
        case 'status': aVal = a.completed ? 1 : 0; bVal = b.completed ? 1 : 0; break;
        case 'createdAt':
        default: aVal = a.createdAt; bVal = b.createdAt; break;
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      else return aVal < bVal ? 1 : -1;
    });

    container.innerHTML = '';
    filtered.forEach(t => {
      const li = document.createElement('li');
      li.className = 'task' + (t.completed ? ' completed' : '');
      li.innerHTML = `
        <label class="task__checkbox">
          <input type="checkbox" class="task__toggle" ${t.completed ? 'checked' : ''} />
          <span class="check"></span>
        </label>
        <div class="task__content">
          <input class="task__title" type="text" value="${t.title}" />
          <input class="task__date" type="date" value="${t.due || ''}" />
        </div>
        <div class="task__actions">
          <button class="icon-btn edit" title="Modifica">✎</button>
          <button class="icon-btn delete" title="Elimina">🗑</button>
        </div>`;

      const checkbox = li.querySelector('.task__toggle');
      const deleteBtn = li.querySelector('.delete');
      const titleInput = li.querySelector('.task__title');
      const dateInput = li.querySelector('.task__date');

      checkbox.addEventListener('change', () => this.toggleDone(t.id));
      deleteBtn.addEventListener('click', () => this.removeTask(t.id));
      titleInput.addEventListener('blur', () => {
        const newTitle = titleInput.value.trim();
        if (newTitle && newTitle !== t.title) {
          t.title = newTitle;
          this.saveTasks();
        }
      });
      dateInput.addEventListener('change', () => {
        const newDate = dateInput.value;
        if (newDate !== t.due) {
          t.due = newDate;
          this.saveTasks();
        }
      });

      container.appendChild(li);
    });

    // Aggiorna statistiche
    const stats = document.getElementById('stats');
    if (stats) {
      const total = this.tasks.size || this.tasks.length;
      const completed = filtered.filter(t => t.completed).length;
      const active = total - completed;
      stats.innerHTML = `
        <span class="badge bg-warning text-dark me-2">Totale: ${total}</span>
        <span class="badge bg-success me-2">Completati: ${completed}</span>
        <span class="badge bg-primary me-2">Attivi: ${active}</span>`;
    }
  }
};

// Central manager
const todoManager = {
  currentManager: todoArrayManager,
  currentStorageKey: STORAGE_KEY_ARRAY,

  loadTasks() {
    this.currentManager.loadTasks();
  },
  saveTasks() {
    this.currentManager.saveTasks();
  },
  addTask(text) {
    this.currentManager.addTask(text);
  },
  toggleDone(id) {
    this.currentManager.toggleDone(id);
  },
  removeTask(id) {
    this.currentManager.removeTask(id);
  },
  clearAll() {
    this.currentManager.clearAll();
  },
  markAll() {
    this.currentManager.markAll();
  },
  removeCompleted() {
    this.currentManager.removeCompleted();
  },
  render() {
    this.currentManager.render();
  },
  switchManager(useMap) {
    localStorage.setItem(STORAGE_KEY_CHOICE, useMap ? 'map' : 'array');
    if (useMap && this.currentManager === todoMapManager) return;
    if (!useMap && this.currentManager === todoArrayManager) return;

    // Recupera dati dallo stato corrente
    let allTasks = [];
    if (this.currentManager === todoArrayManager) {
      allTasks = this.currentManager.tasks.map(t => ({
        ...t,
        createdAt: t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt)
      }));
    } else {
      allTasks = Array.from(this.currentManager.tasks.values()).map(t => ({
        ...t,
        createdAt: t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt)
      }));
    }

    this.currentManager = useMap ? todoMapManager : todoArrayManager;
    this.currentStorageKey = useMap ? STORAGE_KEY_MAP : STORAGE_KEY_ARRAY;

    if (useMap) {
      this.currentManager.tasks.clear();
      allTasks.forEach(t => this.currentManager.tasks.set(t.id, t));
    } else {
      this.currentManager.tasks = allTasks;
    }

    this.currentManager.saveTasks();
    this.currentManager.render();
  }
};

// --- Event listeners UI ---

const inputTaskTitle = document.getElementById('task-title');

document.querySelector('form')?.addEventListener('submit', e => {
  e.preventDefault();
  const text = inputTaskTitle.value.trim();
  if (!text) return;
  todoManager.addTask(text);
  inputTaskTitle.value = '';
});

document.getElementById('mark-all-btn')?.addEventListener('click', () => todoManager.markAll());
document.getElementById('clear-completed')?.addEventListener('click', () => todoManager.removeCompleted());
document.getElementById('clear-all-btn')?.addEventListener('click', () => todoManager.clearAll());

document.getElementById('sortBy')?.addEventListener('change', () => todoManager.render());
document.getElementById('sortOrder')?.addEventListener('change', () => todoManager.render());
document.querySelectorAll('.chip').forEach(chip =>
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    todoManager.render();
  })
);

document.getElementById('storageTypeSelect')?.addEventListener('change', e => {
  todoManager.switchManager(e.target.value === 'map');
});

document.getElementById('searchInput')?.addEventListener('input', () => todoManager.render());

// --- Inizializzazione ---
const savedChoice = localStorage.getItem(STORAGE_KEY_CHOICE);
todoManager.switchManager(savedChoice === 'map');

renderCharacters();
todoManager.loadTasks();
todoManager.render();
