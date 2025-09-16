// app.ts - Applicazione principale con gestione Todo e Personaggi Batman

import { Task, Character, TaskManager } from './types.js';

// --- Gestione Personaggi Batman (indipendente) ---
const charForm = document.getElementById('char-form') as HTMLFormElement;
const charName = document.getElementById('char-name') as HTMLInputElement;
const charAlias = document.getElementById('char-alias') as HTMLInputElement;
const charImage = document.getElementById('char-image') as HTMLInputElement;
const charRole = document.getElementById('char-role') as HTMLSelectElement;
const charHeroesContainer = document.getElementById('char-heroes-container') as HTMLDivElement;
const charVillainsContainer = document.getElementById('char-villains-container') as HTMLDivElement;
const charSearch = document.getElementById('char-search') as HTMLInputElement;
const btnAddChar = document.getElementById('btn-add-char') as HTMLButtonElement;

function charRandomId(): string {
  try { 
    if (crypto && crypto.randomUUID) return crypto.randomUUID(); 
  } catch (_) {}
  return 'c_' + Math.random().toString(36).slice(2, 10);
}

function loadCharacters(): Character[] {
  try {
    const raw = localStorage.getItem('batman_characters');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function saveCharacters(chars: Character[]): void {
  localStorage.setItem('batman_characters', JSON.stringify(chars));
}

function createCard(c: Character): HTMLDivElement {
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
  const btnEdit = card.querySelector('.btn-edit') as HTMLButtonElement;
  const btnDelete = card.querySelector('.btn-delete') as HTMLButtonElement;
  const btnSave = card.querySelector('.btn-save') as HTMLButtonElement;
  const btnCancel = card.querySelector('.btn-cancel') as HTMLButtonElement;
  const form = card.querySelector('.character-form') as HTMLDivElement;

  btnEdit.addEventListener('click', () => {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  btnCancel.addEventListener('click', () => {
    form.style.display = 'none';
    (card.querySelector('.char-name') as HTMLInputElement).value = c.name;
    (card.querySelector('.char-alias') as HTMLInputElement).value = c.alias || '';
    (card.querySelector('.char-image') as HTMLInputElement).value = c.image || '';
    (card.querySelector('.char-role') as HTMLSelectElement).value = c.role;
  });

  btnSave.addEventListener('click', () => {
    const newName = (card.querySelector('.char-name') as HTMLInputElement).value.trim();
    const newAlias = (card.querySelector('.char-alias') as HTMLInputElement).value.trim();
    const newImage = (card.querySelector('.char-image') as HTMLInputElement).value.trim();
    const newRole = (card.querySelector('.char-role') as HTMLSelectElement).value as Character['role'];
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

function renderCharacters(): void {
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

function addCharacter(e?: Event): void {
  e?.preventDefault();
  const name = charName.value.trim();
  const alias = charAlias.value.trim();
  const image = (charImage && charImage.value.trim()) || '';
  const role = charRole.value as Character['role'];
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

const list = document.getElementById('task-list') as HTMLUListElement;
const STORAGE_KEY_ARRAY = 'persona_todos_array';
const STORAGE_KEY_MAP = 'persona_todos_map';
const STORAGE_KEY_CHOICE = 'todo_storage_choice';

// Manager Array
const todoArrayManager: TaskManager = {
  tasks: [],

  loadTasks(): void {
    const stored = localStorage.getItem(STORAGE_KEY_ARRAY);
    if (stored) {
      const parsed = JSON.parse(stored);
      this.tasks = parsed.map((t: any) => ({
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

  saveTasks(): void {
    localStorage.setItem(STORAGE_KEY_ARRAY, JSON.stringify(this.tasks));
  },

  addTask(text: string): void {
    if (!text) return;
    const id = Date.now().toString();
    (this.tasks as Task[]).push({ id, title: text, due: null, completed: false, createdAt: new Date() });
    this.saveTasks();
    this.render();
  },

  toggleDone(id: string): void {
    const task = (this.tasks as Task[]).find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.render();
    }
  },

  removeTask(id: string): void {
    this.tasks = (this.tasks as Task[]).filter(t => t.id !== id);
    this.saveTasks();
    this.render();
  },

  clearAll(): void {
    this.tasks = [];
    this.saveTasks();
    this.render();
  },

  markAll(): void {
    (this.tasks as Task[]).forEach(t => t.completed = true);
    this.saveTasks();
    this.render();
  },

  removeCompleted(): void {
    this.tasks = (this.tasks as Task[]).filter(t => !t.completed);
    this.saveTasks();
    this.render();
  },

  render(): void {
    const container = list;
    if (!container) return;
    const sortBy = (document.getElementById('sortBy') as HTMLSelectElement)?.value || 'createdAt';
    const sortOrder = (document.getElementById('sortOrder') as HTMLSelectElement)?.value || 'desc';
    const activeFilter = document.querySelector('.chip.is-active')?.getAttribute('data-filter') || 'all';
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const searchTerm = (searchInput?.value || '').toLowerCase();

    let filtered = this.tasks as Task[];

    if (activeFilter === 'active') filtered = filtered.filter(t => !t.completed);
    else if (activeFilter === 'completed') filtered = filtered.filter(t => t.completed);

    if (searchTerm) {
      filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(searchTerm));
    }

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
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

      const checkbox = li.querySelector('.task__toggle') as HTMLInputElement;
      const deleteBtn = li.querySelector('.delete') as HTMLButtonElement;
      const titleInput = li.querySelector('.task__title') as HTMLInputElement;
      const dateInput = li.querySelector('.task__date') as HTMLInputElement;

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
      const total = (this.tasks as Task[]).length;
      const completed = (this.tasks as Task[]).filter(t => t.completed).length;
      const active = total - completed;
      stats.innerHTML = `
        <span class="badge bg-warning text-dark me-2">Totale: ${total}</span>
        <span class="badge bg-success me-2">Completati: ${completed}</span>
        <span class="badge bg-primary me-2">Attivi: ${active}</span>`;
    }
  }
};

// Manager Map
const todoMapManager: TaskManager = {
  tasks: new Map<string, Task>(),

  loadTasks(): void {
    const stored = localStorage.getItem(STORAGE_KEY_MAP);
    if (stored) {
      const parsed = JSON.parse(stored);
      (this.tasks as Map<string, Task>).clear();
      parsed.forEach((t: any) => {
        t.createdAt = new Date(t.createdAt);
        (this.tasks as Map<string, Task>).set(t.id, t);
      });
    } else {
      (this.tasks as Map<string, Task>).clear();
    }
  },

  saveTasks(): void {
    const arr = Array.from((this.tasks as Map<string, Task>).values());
    localStorage.setItem(STORAGE_KEY_MAP, JSON.stringify(arr));
  },

  addTask(text: string): void {
    if (!text) return;
    const id = Date.now().toString();
    (this.tasks as Map<string, Task>).set(id, { id, title: text, due: null, completed: false, createdAt: new Date() });
    this.saveTasks();
    this.render();
  },

  toggleDone(id: string): void {
    const t = (this.tasks as Map<string, Task>).get(id);
    if (t) {
      t.completed = !t.completed;
      this.saveTasks();
      this.render();
    }
  },

  removeTask(id: string): void {
    (this.tasks as Map<string, Task>).delete(id);
    this.saveTasks();
    this.render();
  },

  clearAll(): void {
    (this.tasks as Map<string, Task>).clear();
    this.saveTasks();
    this.render();
  },

  markAll(): void {
    for (const t of (this.tasks as Map<string, Task>).values()) {
      t.completed = true;
    }
    this.saveTasks();
    this.render();
  },

  removeCompleted(): void {
    for (const [id, t] of (this.tasks as Map<string, Task>).entries()) {
      if (t.completed) (this.tasks as Map<string, Task>).delete(id);
    }
    this.saveTasks();
    this.render();
  },

  render(): void {
    const container = list;
    if (!container) return;
    const sortBy = (document.getElementById('sortBy') as HTMLSelectElement)?.value || 'createdAt';
    const sortOrder = (document.getElementById('sortOrder') as HTMLSelectElement)?.value || 'desc';
    const activeFilter = document.querySelector('.chip.is-active')?.getAttribute('data-filter') || 'all';
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const searchTerm = (searchInput?.value || '').toLowerCase();

    let filtered = Array.from((this.tasks as Map<string, Task>).values());

    if (activeFilter === 'active') filtered = filtered.filter(t => !t.completed);
    else if (activeFilter === 'completed') filtered = filtered.filter(t => t.completed);

    if (searchTerm) {
      filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(searchTerm));
    }

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
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

      const checkbox = li.querySelector('.task__toggle') as HTMLInputElement;
      const deleteBtn = li.querySelector('.delete') as HTMLButtonElement;
      const titleInput = li.querySelector('.task__title') as HTMLInputElement;
      const dateInput = li.querySelector('.task__date') as HTMLInputElement;

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
      const total = (this.tasks as Map<string, Task>).size;
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

  loadTasks(): void {
    this.currentManager.loadTasks();
  },
  saveTasks(): void {
    this.currentManager.saveTasks();
  },
  addTask(text: string): void {
    this.currentManager.addTask(text);
  },
  toggleDone(id: string): void {
    this.currentManager.toggleDone(id);
  },
  removeTask(id: string): void {
    this.currentManager.removeTask(id);
  },
  clearAll(): void {
    this.currentManager.clearAll();
  },
  markAll(): void {
    this.currentManager.markAll();
  },
  removeCompleted(): void {
    this.currentManager.removeCompleted();
  },
  render(): void {
    this.currentManager.render();
  },
  switchManager(useMap: boolean): void {
    localStorage.setItem(STORAGE_KEY_CHOICE, useMap ? 'map' : 'array');
    if (useMap && this.currentManager === todoMapManager) return;
    if (!useMap && this.currentManager === todoArrayManager) return;

    // Recupera dati dallo stato corrente
    let allTasks: Task[] = [];
    if (this.currentManager === todoArrayManager) {
      allTasks = (this.currentManager.tasks as Task[]).map(t => ({
        ...t,
        createdAt: t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt)
      }));
    } else {
      allTasks = Array.from((this.currentManager.tasks as Map<string, Task>).values()).map(t => ({
        ...t,
        createdAt: t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt)
      }));
    }

    this.currentManager = useMap ? todoMapManager : todoArrayManager;
    this.currentStorageKey = useMap ? STORAGE_KEY_MAP : STORAGE_KEY_ARRAY;

    if (useMap) {
      (this.currentManager.tasks as Map<string, Task>).clear();
      allTasks.forEach(t => (this.currentManager.tasks as Map<string, Task>).set(t.id, t));
    } else {
      this.currentManager.tasks = allTasks;
    }

    this.currentManager.saveTasks();
    this.currentManager.render();
  }
};

// --- Event listeners UI ---

const inputTaskTitle = document.getElementById('task-title') as HTMLInputElement;

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

document.getElementById('storageTypeSelect')?.addEventListener('change', (e) => {
  const target = e.target as HTMLSelectElement;
  todoManager.switchManager(target.value === 'map');
});

document.getElementById('searchInput')?.addEventListener('input', () => todoManager.render());

// --- Inizializzazione ---
const savedChoice = localStorage.getItem(STORAGE_KEY_CHOICE);
todoManager.switchManager(savedChoice === 'map');

renderCharacters();
todoManager.loadTasks();
todoManager.render();
