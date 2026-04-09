# Zeerostock Inventory Database APIs

## Setup
```
cd zeerostock-db
npm install
npm start
```
Port 3001. DB: db.sqlite auto-created.

## APIs
- `POST /supplier` `{name:"ABC Corp", city:"NYC"}` → `{id:1, name, city}`
- `POST /inventory` `{supplier_id:1, product_name:"Laptop", quantity:10, price:999}` (validates)
- `GET /inventory` → joined list
- `GET /inventory/grouped` → suppliers + total_value DESC

**cURL Test**:
```
# Add supplier
curl -X POST http://localhost:3001/supplier -H "Content-Type: application/json" -d "{\"name\":\"TechCo\",\"city\":\"SF\"}"

# Get ID (1), add inventory
curl -X POST http://localhost:3001/inventory -H "Content-Type: application/json" -d "{\"supplier_id\":1,\"product_name\":\"Laptop\",\"quantity\":10,\"price\":999}"

# View
curl http://localhost:3001/inventory/grouped
```

## Database Schema (SQLite)
```
Suppliers:
- id INTEGER PK AUTOINCREMENT
- name TEXT NOT NULL
- city TEXT NOT NULL

Inventory:
- id INTEGER PK AUTOINCREMENT
- supplier_id INTEGER FK -> Suppliers.id
- product_name TEXT NOT NULL
- quantity INTEGER >=0 CHECK
- price REAL >0 CHECK
```

**Why SQL (SQLite)**: Relational integrity (FK enforce valid supplier_id), transactions ACID, efficient JOINs/grouping for query. NoSQL good for unstructured, but here structured + relations = SQL ideal. Local file = zero setup.

**Optimization**: Index `CREATE INDEX idx_supplier_inv ON inventory(supplier_id);` for fast lookups/JOINs by supplier. Composite `idx_inv_price_qty ON inventory(supplier_id, price, quantity)` for value calcs.
