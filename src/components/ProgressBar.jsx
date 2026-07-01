export default function ProgressBar({ percent }) {
    return (
        <div className="progress-wrap">
            <span className="progress-label">Overall Completion: {percent}%</span>
            <div className="progress-track">
                <div className="progress-fill" style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}