const BASE_URL = 'http://localhost:5000/api/tasks';

export async function getTasks() {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error('Failed to load tasks');
    return res.json();
}

export async function createTask(task) {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
}

export async function updateTask(id, task) {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
}

export async function updateTaskStatus(id, status) {
    const res = await fetch(`${BASE_URL}/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
}

export async function deleteTask(id) {
    const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
}