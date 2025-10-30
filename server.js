const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Database setup
const DB_PATH = path.join(__dirname, 'data', 'hr.db');
const db = new sqlite3.Database(DB_PATH);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple session storage (in-memory)
const sessions = new Map();
function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

// --------------------------- LOGIN ROUTE ----------------------------
app.post('/api/login', (req, res) => {
  const { hr_id, password } = req.body;
  if (!hr_id || !password)
    return res.status(400).json({ error: 'Missing credentials' });

  db.get('SELECT * FROM hr_users WHERE hr_id = ?', [hr_id], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken();
    sessions.set(token, hr_id);
    setTimeout(() => sessions.delete(token), 2 * 60 * 60 * 1000); // auto-expire after 2 hours

    res.json({ token, hr_id });
  });
});

// ---------------------- AUTH MIDDLEWARE ------------------------------
function requireAuth(req, res, next) {
  const token = req.headers['x-auth-token'];
  if (!token || !sessions.has(token))
    return res.status(401).json({ error: 'Unauthorized' });
  req.hr_id = sessions.get(token);
  next();
}

// ---------------------- ADD EMPLOYEE -------------------------------
app.post('/api/employees', requireAuth, (req, res) => {
  const { name, age, gender, department, joining_date, punch_in_time } = req.body;

  if (!name || !gender || !department || !joining_date || !punch_in_time)
    return res.status(400).json({ error: 'Missing required fields' });

  const punchHour = parseInt(punch_in_time.split(':')[0]);
  let late_days = 0;
  if (punchHour >= 10) late_days = 1;

  const salary = 50000 - (late_days * 200);
  const ageNum = age ? parseInt(age, 10) : null;

  db.run(
    `INSERT INTO employees (name, age, gender, department, joining_date, punch_in_time, late_days, salary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, ageNum, gender, department, joining_date, punch_in_time, late_days, salary],
    function (err) {
      if (err) {
        console.error('DB Insert Error:', err);
        return res.status(500).json({ error: 'Database insert failed' });
      }
      res.json({
        id: this.lastID,
        name,
        age: ageNum,
        gender,
        department,
        joining_date,
        punch_in_time,
        late_days,
        salary
      });
    }
  );
});

// ---------------------- GET EMPLOYEES -------------------------------
app.get('/api/employees', requireAuth, (req, res) => {
  db.all('SELECT * FROM employees ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database read failed' });

    rows.forEach(emp => {
      emp.salary = 50000 - (emp.late_days * 200); // recalc salary
    });

    res.json(rows);
  });
});

// ---------------------- DELETE EMPLOYEE ------------------------------
app.delete('/api/employees/:id', requireAuth, (req, res) => {
  db.run('DELETE FROM employees WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Database delete failed' });
    res.json({ success: true });
  });
});

// ---------------------- SERVER START -------------------------------
app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});
