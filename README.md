## Prompt 1  
Generate synthetic e-commerce data distributed over 5 CSV files representing typical business entities. The files should include: Customers, Orders, Products, OrderDetails (line items), and Categories. Each file should have relevant fields with realistic sample data such as Customer ID, Order ID, Product details, quantities, prices, timestamps, and categories. Generate data sufficient in volume (~1000 rows per file) to allow meaningful joins.

**Answer**  
- Implementation: `generate_synthetic_ecommerce_data.js`  
- Output artifacts: five CSV files under `data/` (`customers_js.csv`, `categories_js.csv`, `products_js.csv`, `orders_js.csv`, `order_details_js.csv`)  
- Summary: Seeds a deterministic RNG, synthesizes realistic records for all entities with consistent foreign keys, and exports ~1000 rows per file for meaningful joins.

---

## Prompt 2  
Write a Javascript code using SQLite3 that creates a database with tables corresponding to the 5 CSV files: Customers, Orders, Products, OrderDetails, and Categories. Define appropriate primary keys, foreign keys, and data types for each table. Then write code to load the CSV data into their respective database tables efficiently.

**Answer**  
- Implementation: `load_ecommerce_to_sqlite.js`  
- Behavior: Rebuilds `data/ecommerce.db`, creates normalized tables with primary/foreign keys and appropriate data types, parses each CSV, and bulk-loads rows via prepared statements inside transactions.  
- Inputs: CSV files generated in Prompt 1 (`data/*.csv`)

---

## Prompt 3  
Write an SQL query to retrieve a joined report combining Customers, Orders, OrderDetails, Products, and Categories. The query should show for each order: Customer Name, Order Date, Product Name, Category Name, Quantity, and Total Price (Quantity * Unit Price). Sort the results by Order Date descending. Explain how to execute this query in SQLite and display the output.

**Answer**  
- SQL: See `run_order_report.js` for the executable query and CSV export helper.  
- Query summary: Joins `Customers`, `Orders`, `OrderDetails`, `Products`, and `Categories` so each row represents an order line with customer name, order date, product, category, quantity, and computed total price, ordered by most recent orders.  
- How to run:  
  - Via SQLite shell: open `sqlite3 data/ecommerce.db`, enable `.mode column` and `.headers on`, paste the query from `run_order_report.js`.  
  - Via Node: `node run_order_report.js` (prints table) or `node run_order_report.js data/order_report.csv` (exports CSV).

