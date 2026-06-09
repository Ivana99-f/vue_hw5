const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./src/db');

const app = express();
const PORT = 3000;
const distPath = path.resolve(__dirname, 'dist');

app.use(cors());
app.use(express.json());
app.use(express.static(distPath));

// 1. 獲取所有價格數據 (用於圖表初始化)
app.get('/api/prices', (req, res) => {
    db.all('SELECT * FROM prices ORDER BY year ASC, month ASC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. 獲取通膨指數
app.get('/api/inflation', (req, res) => {
    db.all('SELECT * FROM inflation_rates', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 3. 智能搜尋 (年/月/年月)
app.get('/api/prices/search', (req, res) => {
    const { year, month } = req.query;
    let query = 'SELECT * FROM prices WHERE 1=1';
    const params = [];

    if (year && year !== 'all') {
        query += ' AND year = ?';
        params.push(parseInt(year));
    }
    if (month && month !== 'all') {
        query += ' AND month = ?';
        params.push(parseInt(month));
    }

    query += ' ORDER BY year ASC, month ASC';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 4. 新增或更新價格 (Upsert)
app.post('/api/prices', (req, res) => {
    const { year, month, price } = req.body;
    if (!year || !month || !price) return res.status(400).json({ error: 'Missing fields' });

    const sql = `INSERT INTO prices (year, month, price) VALUES (?, ?, ?)
                 ON CONFLICT(year, month) DO UPDATE SET price = excluded.price`;
    
    db.run(sql, [year, month, price], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Success', id: this.lastID });
    });
});

// 5. 刪除價格
app.delete('/api/prices/:id', (req, res) => {
    db.run('DELETE FROM prices WHERE id = ?', req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted', changes: this.changes });
    });
});

app.use((req, res) => {
    const indexFile = path.join(distPath, 'index.html');

    if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
        return;
    }

    res.status(503).send('Frontend has not been built yet. Run npm run build first.');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
