import express from "express";
import 'dotenv/config';
import cors from 'cors';
import pool from './config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken } from './middleware/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Protected endpoint test
app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({ message: 'Protected profile data', user: req.user });
});

//user registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        //basic validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        //hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, hashedPassword]);
        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error("Registration error:", error);
        // 重複エラー (ER_DUP_ENTRY) の判定
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
})
//user login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        //basic validation
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch === false) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({
            message: 'Login successful!',
            token: token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
//create notes
app.post('/api/notes', authenticateToken, async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }
        const userId = req.user.id;
        await pool.query('INSERT INTO notes (user_id, title, content) VALUES(?, ?, ?)', [userId, title, content]);
        res.status(201).json({ message: 'Note created successfully' });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
})

//Read notes
app.get('/api/notes', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [notes] = await pool.query('SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        res.status(200).json({ notes });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
})

//Update notes
app.put('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        const noteId = req.params.id;
        const { title, content } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'Bad Request' });
        }
        const userId = req.user.id;
        const [result] = await pool.query('UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ? ', [title, content, noteId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Note not found or unauthorized' });
        }
        res.status(200).json({ message: 'Note updated successfully' });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
})

//Delete notes
app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.user.id;
        const [result] = await pool.query('DELETE FROM notes WHERE id = ? AND user_id = ?', [noteId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Note not found or unauthorized' });
        }
        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
})

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});

try {
    const connection = await pool.getConnection();
    console.log("Connection to MYSQL succeeded");
    connection.release();
} catch (error) {
    console.error("DB connection error", error);
}