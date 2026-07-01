import { Flag, Calendar, Trash2, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

const STATUS_ORDER = ['todo', 'in_progress', 'completed'];

export default function TaskCard({ task, onDelete, onMove }) {
    const index = STATUS_ORDER.indexOf(task.status);
    const canMoveBack = index > 0;
    const canMoveForward = index < STATUS_ORDER.length - 1;

    const formattedDate = task.due_date
        ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : null;

    const isOverdue = task.due_date
        && task.status !== 'completed'
        && new Date(task.due_date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

    return (
        <div className={`task-card status-${task.status} ${isOverdue ? 'task-overdue' : ''}`}>
            <div className="task-card-top">
                <p className="task-title">{task.title}</p>
                {!!task.flagged && <Flag size={14} className="task-flag" fill="currentColor" />}
            </div>

            {task.description && <p className="task-description">{task.description}</p>}

            {formattedDate && (
                <span className={`task-date ${isOverdue ? 'overdue' : ''}`}>
                    {isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
                    {isOverdue ? 'Missing • ' : ''}{formattedDate}
                </span>
            )}

            <div className="task-card-actions">
                <button
                    className="task-action-btn"
                    disabled={!canMoveBack}
                    onClick={() => onMove(task.id, STATUS_ORDER[index - 1])}
                    title="Move back"
                >
                    <ArrowLeft size={14} />
                </button>
                <button
                    className="task-action-btn"
                    disabled={!canMoveForward}
                    onClick={() => onMove(task.id, STATUS_ORDER[index + 1])}
                    title="Move forward"
                >
                    <ArrowRight size={14} />
                </button>
                <button
                    className="task-action-btn danger"
                    onClick={() => onDelete(task.id)}
                    title="Delete task"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}