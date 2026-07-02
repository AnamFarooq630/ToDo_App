const StorageKey = 'flowboard_tasks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, CalendarCheck, CalendarClock, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Column from './components/Column';
import AddTaskModal from './components/AddTaskModal';
import ProgressBar from './components/ProgressBar';
import { getTasks, createTask, updateTaskStatus, deleteTask } from './api/taskApi';
import './App.css';

export default function App() {
    const [tasks, setTasks] = useState(() => {
        try {
            const saved = localStorage.getItem(StorageKey);
            return saved ? JSON.parse(saved) : [];
        }
        catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [activeView, setActiveView] = useState('inbox');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [offlineNotice, setOfflineNotice] = useState(null);

    const [isOffline, setIsOffline] = useState(false);

    const tasksRef = useRef(tasks);
    useEffect(() => {
        tasksRef.current = tasks;
    }, [tasks]);

    useEffect(() => {
        loadTasks();
    }, []);

    useEffect(() => {
        localStorage.setItem(StorageKey, JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        if (!isOffline) return;

        const retryInterval = setInterval(() => {
            loadTasks();
        }, 15000);

        return () => clearInterval(retryInterval);
    }, [isOffline]);

    async function loadTasks() {
        try {
            setLoading(true);
            const data = await getTasks();
            setError(null);

            const localOnlyTasks = tasksRef.current.filter((t) => String(t.id).startsWith('local-'));

            if (localOnlyTasks.length > 0) {
                const syncedTasks = [];
                const stillPendingTasks = [];

                for (const localTask of localOnlyTasks) {
                    const { id, ...taskData } = localTask;
                    try {
                        const newTask = await createTask(taskData);
                        syncedTasks.push(newTask);
                    } catch (syncErr) {
                        stillPendingTasks.push(localTask);
                    }
                }

                setTasks([...stillPendingTasks, ...syncedTasks, ...data]);
            } else {
                setTasks(data);
            }

            setOfflineNotice(null);
            setIsOffline(false);
        } catch (err) {
            setIsOffline(true);
            const saved = localStorage.getItem(StorageKey);
            if (saved) {
                setTasks(JSON.parse(saved));
                setOfflineNotice('Showing offline data — could not reach the server.');
            } else {
                setError('Could not reach the server. Is the backend running?');
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(taskData) {
        if (isOffline) {
            const offlineTask = {
                id: 'local-' + Date.now(),
                status: 'todo',
                ...taskData
            };
            setTasks((prev) => [offlineTask, ...prev]);
            setShowModal(false);
            return;
        }

        try {
            const newTask = await createTask(taskData);
            setTasks((prev) => [newTask, ...prev]);
        } catch (err) {
            setIsOffline(true);
            const offlineTask = {
                id: 'local-' + Date.now(),
                status: 'todo',
                ...taskData
            };
            setTasks((prev) => [offlineTask, ...prev]);
        }
        setShowModal(false);
    }

    async function handleMove(id, status) {

        const isLocalTask = String(id).startsWith('local-');

        if (isOffline || isLocalTask) {
            setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
            return;
        }

        try {
            const updated = await updateTaskStatus(id, status);
            setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        } catch (err) {
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
        } catch (err) {
            setIsOffline(true);
        } finally {
            setTasks((prev) => prev.filter((t) => t.id !== id));
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

    const percent = tasks.length === 0
        ? 0
        : Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100);

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
                        <ProgressBar percent={percent} />
                    </div>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={16} /> New Task
                    </button>
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
                        <Column title="To Do" status="todo" tasks={todo} onDelete={handleDelete} onMove={handleMove} />
                        <Column title="In Progress" status="in_progress" tasks={inProgress} onDelete={handleDelete} onMove={handleMove} />
                        <Column title="Completed" status="completed" tasks={completed} onDelete={handleDelete} onMove={handleMove} />
                    </div>
                )}
            </main>

            {showModal && <AddTaskModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
        </div>
    );
}