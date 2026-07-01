import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/tasks', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const { title, description, status, due_date, flagged } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }
        const [result] = await pool.query(
            'INSERT INTO tasks (title, description, status, due_date, flagged) VALUES (?, ?, ?, ?, ?)',
            [title, description || null, status || 'todo', due_date || null, !!flagged]
        );
        const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, due_date, flagged } = req.body;
        await pool.query(
            'UPDATE tasks SET title = ?, description = ?, due_date = ?, flagged = ? WHERE id = ?',
            [title, description || null, due_date || null, !!flagged, id]
        );
        const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

app.put('/api/tasks/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['todo', 'in_progress', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
        const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));