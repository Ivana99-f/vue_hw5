const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// 初始化資料表
db.serialize(() => {
    // 1. 價格表 (年、月分開儲存)
    db.run(`
        CREATE TABLE IF NOT EXISTS prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            price REAL NOT NULL,
            UNIQUE(year, month)
        )
    `);

    // 2. 通膨指數表 (以年份為單位)
    db.run(`
        CREATE TABLE IF NOT EXISTS inflation_rates (
            year INTEGER PRIMARY KEY,
            index_val REAL NOT NULL
        )
    `);
});

module.exports = db;
