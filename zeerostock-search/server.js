const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Load inventory data
let inventory = [];
async function loadInventory() {
  try {
    const data = await fs.readFile('./data/inventory.json', 'utf8');
    inventory = JSON.parse(data);
  } catch (err) {
    console.error('Error loading inventory:', err);
    inventory = [];
  }
}

await loadInventory();

// GET /search
app.get('/search', (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;

  let results = [...inventory];

  // Name search (case-insensitive partial match)
  if (q && q.trim()) {
    const searchLower = q.trim().toLowerCase();
    results = results.filter(item => 
      item.name.toLowerCase().includes(searchLower)
    );
  }

  // Category filter (exact, case-insensitive)
  if (category && category.trim()) {
    const catLower = category.trim().toLowerCase();
    results = results.filter(item => 
      item.category.toLowerCase() === catLower
    );
  }

  // Price range (numeric)
  const minP = minPrice ? parseFloat(minPrice) : 0;
  const maxP = maxPrice ? parseFloat(maxPrice) : Infinity;
  if (!isNaN(minP) || !isNaN(maxP)) {
    results = results.filter(item => 
      item.price >= minP && item.price <= maxP
    );
  }

  // If no filters, return all (already default)
  res.json({
    results,
    count: results.length,
    filters: { q, category, minPrice, maxPrice }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Loaded ${inventory.length} inventory items.`);
  console.log(`API: http://localhost:${PORT}/search?q=laptop&category=electronics&minPrice=50&maxPrice=1000`);
});
