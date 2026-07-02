import { useState } from 'react';
import { X } from 'lucide-react';

export default function AddTaskModal({ onClose, onCreate, onUpdate, task }) {
    const isEditMode = !!task;

    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [dueDate, setDueDate] = useState(task?.due_date ? task.due_date.slice(0, 10) : '');
    const [flagged, setFlagged] = useState(task?.flagged || false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        if (isEditMode) {
            onUpdate(task.id, { title, description, due_date: dueDate || null, flagged, status: task.status });
        } else {
            onCreate({ title, description, due_date: dueDate || null, flagged, status: 'todo' });
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEditMode ? 'Edit Task' : 'New Task'}</h3>
                    <button className="icon-btn-small" onClick={onClose}><X size={16} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <label>
                        Title
                        <input
                            autoFocus
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Finalize project proposal"
                            required
                        />
                    </label>

                    <label>
                        Description
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional details"
                            rows={3}
                        />
                    </label>

                    <div className="modal-row">
                        <label>
                            Due date
                            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </label>

                        <label className="checkbox-row">
                            <input type="checkbox" checked={flagged} onChange={(e) => setFlagged(e.target.checked)} />
                            Flag as priority
                        </label>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary">{isEditMode ? 'Save Changes' : 'Add Task'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}