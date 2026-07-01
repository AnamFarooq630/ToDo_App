import { useEffect, useMemo, useState } from 'react';
import { Plus, CalendarCheck, CalendarClock, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Column from './components/Column';
import AddTaskModal from './components/AddTaskModal';
import ProgressBar from './components/ProgressBar';
import { getTasks, createTask, updateTaskStatus, deleteTask } from './api/taskApi';
import './App.css';

export default function App() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [activeView, setActiveView] = useState('inbox');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        loadTasks();
    }, []);

    async function loadTasks() {
        try {
            setLoading(true);
            const data = await getTasks();
            setTasks(data);
            setError(null);
        } catch (err) {
            setError('Could not reach the server. Is the backend running?');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(taskData) {
        const newTask = await createTask(taskData);
        setTasks((prev) => [newTask, ...prev]);
        setShowModal(false);
    }

    async function handleMove(id, status) {
        const updated = await updateTaskStatus(id, status);
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }

    async function handleDelete(id) {
        await deleteTask(id);
        setTasks((prev) => prev.filter((t) => t.id !== id));
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
            {/* Mobile top bar — hidden on desktop via CSS */}
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