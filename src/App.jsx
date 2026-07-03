import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, CalendarCheck, CalendarClock, Menu, Download } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Column from './components/Column';
import AddTaskModal from './components/AddTaskModal';
import ProgressBar from './components/ProgressBar';
import { getTasks, createTask, updateTask, updateTaskStatus, deleteTask } from './api/taskApi';
import './App.css';

const LOCAL_STORAGE_KEY = 'flowboard_tasks';

export default function App() {
    const [tasks, setTasks] = useState(() => {
        try {
            const savedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
            return savedTasks ? JSON.parse(savedTasks) : [];
        } catch {
            return [];
        }
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [offlineNotice, setOfflineNotice] = useState(null);
    const [isOffline, setIsOffline] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const [activeView, setActiveView] = useState('inbox');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const tasksRef = useRef(tasks);
    useEffect(() => {
        tasksRef.current = tasks;
    }, [tasks]);

    useEffect(() => {
        loadTasks();
    }, []);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        if (!isOffline) return;

        const retryTimer = setInterval(() => {
            loadTasks(true);
        }, 15000);

        return () => clearInterval(retryTimer);
    }, [isOffline]);

    async function loadTasks(isBackgroundRetry = false) {
        try {
            if (!isBackgroundRetry) setLoading(true);
            const serverTasks = await getTasks();
            setError(null);

            const pendingOfflineTasks = tasksRef.current.filter((t) => String(t.id).startsWith('local-'));

            if (pendingOfflineTasks.length > 0) {
                const newlySynced = [];
                const stillPending = [];

                for (const localTask of pendingOfflineTasks) {
                    const { id, ...taskData } = localTask;
                    try {
                        const savedTask = await createTask(taskData);
                        newlySynced.push(savedTask);
                    } catch {
                        stillPending.push(localTask);
                    }
                }

                setTasks([...stillPending, ...newlySynced, ...serverTasks]);
            } else {
                setTasks(serverTasks);
            }

            setOfflineNotice(null);
            setIsOffline(false);
        } catch {
            setIsOffline(true);
            const savedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedTasks) {
                setTasks(JSON.parse(savedTasks));
                setOfflineNotice('Showing offline data — could not reach the server.');
            } else {
                setError('Could not reach the server. Is the backend running?');
            }
        } finally {
            if (!isBackgroundRetry) setLoading(false);
        }
    }

    async function handleCreate(taskData) {
        if (isOffline) {
            const offlineTask = { id: 'local-' + Date.now(), status: 'todo', ...taskData };
            setTasks((prev) => [offlineTask, ...prev]);
            setShowModal(false);
            return;
        }

        try {
            const newTask = await createTask(taskData);
            setTasks((prev) => [newTask, ...prev]);
        } catch {
            setIsOffline(true);
            const offlineTask = { id: 'local-' + Date.now(), status: 'todo', ...taskData };
            setTasks((prev) => [offlineTask, ...prev]);
        }
        setShowModal(false);
    }

    function handleEdit(task) {
        setEditingTask(task);
    }

    async function handleUpdate(id, taskData) {
        const isLocalTask = String(id).startsWith('local-');

        if (isOffline || isLocalTask) {
            setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...taskData } : t)));
            setEditingTask(null);
            return;
        }

        try {
            const updatedTask = await updateTask(id, taskData);
            setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
        } catch {
            setIsOffline(true);
            setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...taskData } : t)));
        }
        setEditingTask(null);
    }

    async function handleMove(id, status) {
        const isLocalTask = String(id).startsWith('local-');

        if (isOffline || isLocalTask) {
            setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
            return;
        }

        try {
            const updatedTask = await updateTaskStatus(id, status);
            setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
        } catch {
            setIsOffline(true);
            setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
        }
    }

    async function handleDelete(id) {
        const isLocalTask = String(id).startsWith('local-');

        if (isOffline || isLocalTask) {
            setTasks((prev) => prev.filter((t) => t.id !== id));
            return;
        }

        try {
            await deleteTask(id);
        } catch {
            setIsOffline(true);
        } finally {
            setTasks((prev) => prev.filter((t) => t.id !== id));
        }
    }

    async function handleImportTodos() {
        setIsImporting(true);
        try {
            const res = await fetch('https://dummyjson.com/todos?limit=10');
            const data = await res.json();

            const importedTasks = [];

            for (const t of data.todos) {
                const taskData = {
                    title: t.todo,
                    description: 'Imported from DummyJSON API',
                    due_date: null,
                    flagged: false,
                    status: t.completed ? 'completed' : 'todo'
                };

                if (isOffline) {
                    importedTasks.push({ id: 'local-' + t.id + '-' + Date.now(), ...taskData });
                } else {
                    try {
                        const savedTask = await createTask(taskData);
                        importedTasks.push(savedTask);
                    } catch {
                        setIsOffline(true);
                        importedTasks.push({ id: 'local-' + t.id + '-' + Date.now(), ...taskData });
                    }
                }
            }

            setTasks((prev) => [...importedTasks, ...prev]);
        } catch {
            alert('Could not fetch todos from the API. Check your internet connection.');
        } finally {
            setIsImporting(false);
        }
    }

    const visibleTasks = useMemo(() => {
        if (activeView === 'inbox') return tasks;

        const today = new Date().toISOString().slice(0, 10);

        if (activeView === 'today') {
            return tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) === today);
        }

        if (activeView === 'upcoming') {
            return tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) > today);
        }

        return tasks;
    }, [tasks, activeView]);

    const todo = visibleTasks.filter((t) => t.status === 'todo');
    const inProgress = visibleTasks.filter((t) => t.status === 'in_progress');
    const completed = visibleTasks.filter((t) => t.status === 'completed');

    const completionPercent = tasks.length === 0
        ? 0
        : Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100);

    const viewMeta = {
        inbox: { title: 'To Do List' },
        today: { title: "Today's Tasks" },
        upcoming: { title: 'Upcoming Tasks' }
    }[activeView];

    return (
        <div className="app-shell">
            <div className="mobile-topbar">
                <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
                    <Menu size={22} />
                </button>
                <span className="mobile-topbar-title">Flowboard</span>
            </div>

            <Sidebar
                activeView={activeView}
                onSelectView={setActiveView}
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />

            <main className="board">
                <header className="board-header">
                    <div>
                        <h1>{viewMeta.title}</h1>
                        <ProgressBar percent={completionPercent} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-secondary" onClick={handleImportTodos} disabled={isImporting}>
                            <Download size={16} /> {isImporting ? 'Importing…' : 'Import Todos'}
                        </button>
                        <button className="btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={16} /> New Task
                        </button>
                    </div>
                </header>

                {loading && <p className="board-status">Loading tasks…</p>}
                {error && <p className="board-status error">{error}</p>}
                {offlineNotice && <p className="board-status">{offlineNotice}</p>}

                {!loading && !error && activeView !== 'inbox' && visibleTasks.length === 0 && (
                    <div className="page-empty-state">
                        {activeView === 'today' ? <CalendarCheck size={34} /> : <CalendarClock size={34} />}
                        <h3>{activeView === 'today' ? 'Nothing due today' : 'No upcoming tasks'}</h3>
                        <p>
                            {activeView === 'today'
                                ? "You're all caught up. Tasks with today's due date will show up here."
                                : 'Tasks with a future due date will show up here.'}
                        </p>
                    </div>
                )}

                {!loading && !error && (activeView === 'inbox' || visibleTasks.length > 0) && (
                    <div className="columns">
                        <Column title="To Do" status="todo" tasks={todo} onDelete={handleDelete} onMove={handleMove} onEdit={handleEdit} />
                        <Column title="In Progress" status="in_progress" tasks={inProgress} onDelete={handleDelete} onMove={handleMove} onEdit={handleEdit} />
                        <Column title="Completed" status="completed" tasks={completed} onDelete={handleDelete} onMove={handleMove} onEdit={handleEdit} />
                    </div>
                )}
            </main>

            {(showModal || editingTask) && (
                <AddTaskModal
                    task={editingTask}
                    onClose={() => { setShowModal(false); setEditingTask(null); }}
                    onCreate={handleCreate}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
}