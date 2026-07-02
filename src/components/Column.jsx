import TaskCard from './TaskCard';

export default function Column({ title, status, tasks, onDelete, onMove, onEdit }) {
    return (
        <div className="column">
            <div className="column-header">
                <span className={`column-dot dot-${status}`} />
                <h2>{title}</h2>
                <span className="column-count">{tasks.length}</span>
            </div>

            <div className="column-body">
                {tasks.length === 0 && <p className="column-empty">No tasks here yet</p>}
                {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onDelete={onDelete} onMove={onMove} onEdit={onEdit} />
                ))}
            </div>
        </div>
    );
}