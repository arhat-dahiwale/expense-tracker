const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // needed for most managed Postgres hosts
});

// --- Categories ---
app.get('/categories', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM categories ORDER BY name');
  res.json(rows);
});

app.post('/categories', async (req, res) => {
  const { name } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'Category already exists or invalid' });
  }
});

// --- Expenses ---
app.get('/expenses', async (req, res) => {
  const { start, end } = req.query;
  // default to current month if no range given
  const { rows } = await pool.query(
    `SELECT e.*, c.name as category_name
     FROM expenses e
     LEFT JOIN categories c ON e.category_id = c.id
     WHERE e.date >= $1 AND e.date <= $2
     ORDER BY e.date DESC`,
    [start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10),
     end || new Date().toISOString().slice(0,10)]
  );
  res.json(rows);
});

app.post('/expenses', async (req, res) => {
  const { amount, category_id, note, date } = req.body;
  if (!amount || isNaN(amount)) return res.status(400).json({ error: 'Invalid amount' });
  const { rows } = await pool.query(
    'INSERT INTO expenses (amount, category_id, note, date) VALUES ($1,$2,$3,$4) RETURNING *',
    [amount, category_id, note || '', date || new Date().toISOString().slice(0,10)]
  );
  res.json(rows[0]);
});

app.delete('/expenses/:id', async (req, res) => {
  await pool.query('DELETE FROM expenses WHERE id=$1', [req.params.id]);
  res.sendStatus(204);
});

// --- Aggregation for pie chart ---
app.get('/expenses/summary', async (req, res) => {
  const { start, end } = req.query;
  const { rows } = await pool.query(
    `SELECT c.name as category, SUM(e.amount) as total
     FROM expenses e
     LEFT JOIN categories c ON e.category_id = c.id
     WHERE e.date >= $1 AND e.date <= $2
     GROUP BY c.name`,
    [start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10),
     end || new Date().toISOString().slice(0,10)]
  );
  res.json(rows);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on port ${PORT}`);
});