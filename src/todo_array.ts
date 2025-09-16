// todo_array.ts - Gestione Todo con Array

import { Task } from './types.js';

let tasks: Task[] = [];
const input = document.getElementById('taskInput') as HTMLInputElement;
const list = document.getElementById('taskList') as HTMLUListElement;
const totalCount = document.getElementById('totalCount') as HTMLElement;
const doneCount = document.getElementById('doneCount') as HTMLElement;

const STORAGE_KEY = 'persona_todos_array';

function loadTasks(): void {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        // Converti createdAt in oggetto Date per ogni task
        tasks = parsedTasks.map((taskData: any) => ({
            ...taskData,
            createdAt: new Date(taskData.createdAt)
        }));
    }
}

function saveTasks(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

document.getElementById('addBtn')?.addEventListener('click', addTask);
document.getElementById('clearBtn')?.addEventListener('click', clearAll);
document.getElementById('markAllBtn')?.addEventListener('click', markAll);
document.getElementById('removeCompletedBtn')?.addEventListener('click', removeCompleted);

function addTask(): void {
    const text = input.value.trim();
    if (!text) return;
    const id = Date.now().toString();
    tasks.push({ id, title: text, due: null, completed: false, createdAt: new Date() });
    input.value = '';
    saveTasks();
    render();
}

function toggleDone(id: string): void {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
        const task = tasks[taskIndex];
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            render();
        }
    }
}

function removeTask(id: string): void {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
}

function clearAll(): void {
    tasks = [];
    saveTasks();
    render();
}

function markAll(): void {
    tasks.forEach(t => t.completed = true);
    saveTasks();
    render();
}

function removeCompleted(): void {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    render();
}

function render(): void {
    const currentDoneCount = tasks.filter(t => t.completed).length;

    const sortOrder = document.getElementById('sortOrder') as HTMLSelectElement;
    const filterStatus = document.getElementById('filterStatus') as HTMLSelectElement;
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;

    let displayedTasks = [...tasks];

    if (filterStatus.value === 'completed') {
        displayedTasks = displayedTasks.filter(t => t.completed);
    } else if (filterStatus.value === 'pending') {
        displayedTasks = displayedTasks.filter(t => !t.completed);
    }

    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        displayedTasks = displayedTasks.filter(t => t.title.toLowerCase().includes(searchTerm));
    }

    if (sortOrder.value === 'date-asc') {
        displayedTasks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } else if (sortOrder.value === 'date-desc') {
        displayedTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sortOrder.value === 'status') {
        displayedTasks.sort((a, b) => Number(a.completed) - Number(b.completed));
    }

    list.innerHTML = '';
    for (let t of displayedTasks) {
        const li = document.createElement('li');
        li.textContent = t.title;
        if (t.completed) li.classList.add('done');
        li.tabIndex = 0;
        li.classList.add('fade-in-item');

        const doneBtn = document.createElement('button');
        doneBtn.textContent = '☑';
        doneBtn.setAttribute('aria-label', `Mark "${t.title}" as done`);
        doneBtn.onclick = () => toggleDone(t.id);

        const delBtn = document.createElement('button');
        delBtn.textContent = 'X';
        delBtn.setAttribute('aria-label', `Remove "${t.title}"`);
        delBtn.onclick = () => removeTask(t.id);

        li.appendChild(doneBtn);
        li.appendChild(delBtn);
        list.appendChild(li);
    }

    totalCount.textContent = tasks.length.toString();
    doneCount.textContent = currentDoneCount.toString();

    const progressBarFill = document.querySelector('.progress-bar-fill') as HTMLElement;
    if (progressBarFill) {
        const totalTasks = tasks.length;
        const completedTasks = currentDoneCount;
        const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        progressBarFill.style.width = `${progressPercentage}%`;
    }
}

async function fetchInitialTasks(): Promise<void> {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        data.forEach((item: any) => {
            // Evita duplicati se i task sono già stati caricati da localStorage
            if (!tasks.some(t => t.id === item.id.toString())) {
                const id = item.id.toString();
                tasks.push({ id, title: item.title, due: null, completed: item.completed, createdAt: new Date() });
            }
        });
        saveTasks();
        render();
    } catch (error) {
        console.error('Errore nel recupero dei task iniziali:', error);
    }
}

function addFakeTask(): void {
    const id = (Date.now() + 1).toString();
    tasks.push({ id, title: "Compito di esempio (fake post)", due: null, completed: false, createdAt: new Date() });
    saveTasks();
    render();
}

loadTasks();
fetchInitialTasks();
addFakeTask();

render();
