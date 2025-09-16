// Interfacce per i tipi di dati dell'applicazione

export interface Task {
  id: string;
  title: string;
  due: string | null;
  completed: boolean;
  createdAt: Date;
}

export interface Character {
  id: string;
  name: string;
  alias?: string;
  role: 'Eroe' | 'Villain' | 'Alleato';
  image?: string;
}

export interface TaskManager {
  tasks: Task[] | Map<string, Task>;
  loadTasks(): void;
  saveTasks(): void;
  addTask(text: string): void;
  toggleDone(id: string): void;
  removeTask(id: string): void;
  clearAll(): void;
  markAll(): void;
  removeCompleted(): void;
  render(): void;
}

export interface CharacterManager {
  characters: Character[];
  loadCharacters(): Character[];
  saveCharacters(characters: Character[]): void;
  addCharacter(character: Omit<Character, 'id'>): void;
  updateCharacter(id: string, updates: Partial<Character>): void;
  deleteCharacter(id: string): void;
  searchCharacters(query: string): Character[];
  renderCharacters(): void;
}

export type StorageType = 'array' | 'map';

export interface AppState {
  currentStorageType: StorageType;
  currentManager: TaskManager;
}
