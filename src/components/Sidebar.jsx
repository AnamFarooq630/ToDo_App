import { CheckSquare, Inbox, Calendar, CalendarDays, X } from 'lucide-react';

export default function Sidebar({ activeView, onSelectView, isOpen, onClose }) {
    function handleSelect(view) {
        onSelectView(view);
        onClose();
    }

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-top">
                    <div className="sidebar-brand">
                        <CheckSquare size={20} strokeWidth={2.5} />
                        <span>Flowboard</span>
                    </div>
                    <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeView === 'inbox' ? 'active' : ''}`}
                        onClick={() => handleSelect('inbox')}
                    >
                        <Inbox size={17} /> Inbox
                    </button>
                    <button
                        className={`nav-item ${activeView === 'today' ? 'active' : ''}`}
                        onClick={() => handleSelect('today')}
                    >
                        <Calendar size={17} /> Today
                    </button>
                    <button
                        className={`nav-item ${activeView === 'upcoming' ? 'active' : ''}`}
                        onClick={() => handleSelect('upcoming')}
                    >
                        <CalendarDays size={17} /> Upcoming
                    </button>
                </nav>
            </aside>
        </>
    );
}