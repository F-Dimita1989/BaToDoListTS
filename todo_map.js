const tasks = new Map();
const input = document.getElementById('taskInput');
const list = document.getElementById('taskList');
const totalCount = document.getElementById('totalCount');
const doneCount = document.getElementById('doneCount');

const STORAGE_KEY = 'persona_todos';

function loadTasks() {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        parsedTasks.forEach(taskData => {
            taskData.createdAt = new Date(taskData.createdAt);
            tasks.set(taskData.id, taskData);
        });
    }
}

function saveTasks() {
    const tasksArray = Array.from(tasks.entries()).map(([id, task]) => ({ id, ...task }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksArray));
}

document.getElementById('addBtn').addEventListener('click', addTask);
document.getElementById('clearBtn').addEventListener('click', clearAll);
document.getElementById('markAllBtn').addEventListener('click', markAll);
document.getElementById('removeCompletedBtn').addEventListener('click', removeCompleted);

function addTask() {
    const text = input.value.trim();
    if (!text) return;
    const id = Date.now().toString();
    tasks.set(id, { id, text, done: false, createdAt: new Date() });
    input.value = '';
    saveTasks();
    render();
}

function toggleDone(id) {
    const t = tasks.get(id);
    if (t) t.done = !t.done;
    saveTasks();
    render();
}

function removeTask(id) {
    tasks.delete(id);
    saveTasks();
    render();
}

function clearAll() {
    tasks.clear();
    saveTasks();
    render();
}

function markAll() {
    for (let t of tasks.values()) t.done = true;
    saveTasks();
    render();
}

function removeCompleted() {
    for (let [id, t] of tasks) {
        if (t.done) tasks.delete(id);
    }
    saveTasks();
    render();
}

function render() {
    const doneCount = [...tasks.values()].filter(t => t.done).length;

    const sortOrder = document.getElementById('sortOrder');
    const filterStatus = document.getElementById('filterStatus');
    const searchInput = document.getElementById('searchInput');

    let displayedTasks = [...tasks.values()];

    if (filterStatus.value === 'completed') {
        displayedTasks = displayedTasks.filter(t => t.done);
    } else if (filterStatus.value === 'pending') {
        displayedTasks = displayedTasks.filter(t => !t.done);
    }

    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        displayedTasks = displayedTasks.filter(t => t.text.toLowerCase().includes(searchTerm));
    }

    if (sortOrder.value === 'date-asc') {
        displayedTasks.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortOrder.value === 'date-desc') {
        displayedTasks.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortOrder.value === 'status') {
        displayedTasks.sort((a, b) => a.done - b.done);
    }

    list.innerHTML = '';
    for (let t of displayedTasks) {
        const li = document.createElement('li');
        li.textContent = t.text;
        if (t.done) li.classList.add('done');
        li.tabIndex = 0; // Rende l'elemento navigabile con la tastiera
        li.classList.add('fade-in-item'); // Aggiunge la classe per l'animazione

        const doneBtn = document.createElement('button');
        doneBtn.textContent = '☑';
        doneBtn.setAttribute('aria-label', `Mark \"${t.text}\" as done`);
        doneBtn.onclick = () => toggleDone(t.id);

        const delBtn = document.createElement('button');
        delBtn.textContent = 'X';
        delBtn.setAttribute('aria-label', `Remove \"${t.text}\"`);
        delBtn.onclick = () => removeTask(t.id);

        li.appendChild(doneBtn);
        li.appendChild(delBtn);
        list.appendChild(li);
    }

    totalCount.textContent = tasks.size;
    doneCount.textContent = [...tasks.values()].filter(t => t.done).length;

    const progressBarFill = document.querySelector('.progress-bar-fill');
    if (progressBarFill) {
        const totalTasks = tasks.size;
        const completedTasks = [...tasks.values()].filter(t => t.done).length;
        const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        progressBarFill.style.width = `${progressPercentage}%;`;
    }
}

async function fetchInitialTasks() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        data.forEach(item => {
            const id = item.id.toString();
            tasks.set(id, { id, text: item.title, done: item.completed, createdAt: new Date() });
        });
        saveTasks();
        render();
    } catch (error) {
        console.error('Errore nel recupero dei task iniziali:', error);
    }
}

function addFakeTask() {
    const id = (Date.now() + 1).toString();
    tasks.set(id, { id, text: "Compito di esempio (fake post)", done: false, createdAt: new Date() });
    saveTasks();
    render();
}

loadTasks();
fetchInitialTasks();
addFakeTask();

render();