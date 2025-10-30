const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const dbPath = path.join(__dirname, 'data', 'hr.db');
const db = new sqlite3.Database(dbPath);

(async () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS hr_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hr_id TEXT UNIQUE,
      password_hash TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      age INTEGER,
      gender TEXT,
      department TEXT,
      joining_date TEXT,
      punch_in_time TEXT,
      late_days INTEGER DEFAULT 0,
      salary INTEGER DEFAULT 50000
    )`);

    const hr_id = 'hr1';
    const password = 'password123';

    db.get('SELECT * FROM hr_users WHERE hr_id = ?', [hr_id], async (err, row) => {
      if (!row) {
        const hash = await bcrypt.hash(password, 10);
        db.run('INSERT INTO hr_users (hr_id, password_hash) VALUES (?, ?)', [hr_id, hash]);
        console.log('HR user created successfully');
      } else {
        console.log('HR user already exists.');
      }
    });
  });
})();
