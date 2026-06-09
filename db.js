const db = require('./src/db');

// Root entry for manual DB initialization from project root.
db.serialize(() => {
    console.log('Database initialized successfully.');
    db.close((err) => {
        if (err) {
            console.error('Failed to close database connection:', err.message);
            process.exit(1);
            return;
        }
        process.exit(0);
    });
});
