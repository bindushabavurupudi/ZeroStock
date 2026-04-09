# Zeerostock Inventory Search

## Setup & Run
```
cd zeerostock-search
npm install
npm start
```
Open http://localhost:3000

**API Test**:
```
curl "http://localhost:3000/search?q=laptop&category=electronics&minPrice=50&maxPrice=1000"
```

## Features
- **Backend API**: GET `/search?q=...&category=...&minPrice=...&maxPrice=...`
- **Frontend UI**: Real-time search, category dropdown, price range, results table, edge cases (no results, invalid range).

## Search Logic
1. Load 12-item inventory from `data/inventory.json`.
2. **Name (q)**: Case-insensitive `item.name.toLowerCase().includes(q.toLowerCase())`.
3. **Category**: Case-insensitive exact match.
4. **Price**: Numeric range `price >= minPrice && price <= maxPrice`.
5. Combine via `Array.filter()` chain. Empty filters → all results.
6. JSON response: `{results: [...], count: N, filters: {...}}`.

**Edge Cases**:
- Empty query: All items.
- No matches: "No results found".
- Invalid price (min > max): UI error.
- Server errors: Graceful handling.

## Performance Improvement for Large Datasets
Current: In-memory array filter (O(n) per query).  
**Scale**: MongoDB with text index (`db.inventory.createIndex({name: "text", category: "text"})`), aggregation pipeline:
```
db.inventory.aggregate([
  { $match: { $text: { $search: q }, category, price: { $gte: minPrice, $lte: maxPrice } } },
  { $skip: offset }, { $limit: limit }
])
```
+ Pagination, caching (Redis). Handles millions of records efficiently.
