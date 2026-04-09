const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'db.sqlite');

app.use(cors());
app.use(express.json());

// Init DB
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('DB error:', err);
  } else {
    console.log('Connected to SQLite DB');
    initDB();
  }
});

async function initDB() {
  db.serialize(() => {
    // Suppliers table
    db.run(`CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL
    )`);

    // Inventory table
    db.run(`CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity >= 0),
      price REAL NOT NULL CHECK (price > 0),
      FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
    )`);
  });
}

// POST /supplier
app.post('/supplier', (req, res) => {
  const { name, city } = req.body;
  if (!name || !city) {
    return res.status(400).json({ error: 'Name and city required' });
  }
  db.run('INSERT INTO suppliers (name, city) VALUES (?, ?)', [name, city], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, name, city });
  });
});

// POST /inventory
app.post('/inventory', (req, res) => {
  const { supplier_id, product_name, quantity, price } = req.body;
  if (!supplier_id || !product_name || quantity === undefined || price === undefined) {
    return res.status(400).json({ error: 'All fields required' });
  }
  if (quantity < 0 || price <= 0) {
    return res.status(400).json({ error: 'Quantity >=0, price >0' });
  }
  // Check supplier exists
  db.get('SELECT id FROM suppliers WHERE id = ?', [supplier_id], (err, supplier) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    db.run('INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)',
      [supplier_id, product_name, quantity, price], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, supplier_id, product_name, quantity, price });
      });
  });
});

// GET /inventory
app.get('/inventory', (req, res) => {
  db.all(`
    SELECT i.*, s.name as supplier_name, s.city 
    FROM inventory i 
    JOIN suppliers s ON i.supplier_id = s.id
  `, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET /inventory/grouped (total value per supplier)
app.get('/inventory/grouped', (req, res) => {
  db.all(`
    SELECT 
      s.id, s.name, s.city,
      SUM(i.quantity * i.price) as total_value,
      COUNT(i.id) as item_count
    FROM suppliers s
    LEFT JOIN inventory i ON s.id = i.supplier_id
    GROUP BY s.id, s.name, s.city
    ORDER BY total_value DESC NULLS LAST
  `, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error(err);
    console.log('DB closed');
  });
  process.exit(0);
});

console.log(`Server starting on http://localhost:${PORT}`);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
