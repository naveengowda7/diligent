const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DB_PATH = path.join(__dirname, "data", "ecommerce.db");
const OUTPUT_PATH = process.argv[2] || null;

const QUERY = `
SELECT
  c.FirstName || ' ' || c.LastName AS CustomerName,
  o.OrderDate,
  p.ProductName,
  cat.CategoryName,
  od.Quantity,
  ROUND(od.Quantity * od.UnitPrice, 2) AS TotalPrice
FROM Orders o
JOIN Customers c ON o.CustomerID = c.CustomerID
JOIN OrderDetails od ON od.OrderID = o.OrderID
JOIN Products p ON od.ProductID = p.ProductID
JOIN Categories cat ON p.CategoryID = cat.CategoryID
ORDER BY o.OrderDate DESC;
`;

function openDatabase(dbPath) {
  return new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error(`Failed to open database at ${dbPath}:`, err.message);
      process.exit(1);
    }
  });
}

function rowsToCsv(rows) {
  if (!rows.length) {
    return "";
  }
  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => escape(row[key])).join(",")),
  ];
  return lines.join("\n");
}

function writeCsv(filePath, rows) {
  const csv = rowsToCsv(rows);
  fs.writeFileSync(filePath, csv, "utf8");
  console.log(`Report written to ${filePath}`);
}

function printTable(rows) {
  if (rows.length === 0) {
    console.log("No rows returned.");
    return;
  }
  console.table(
    rows.map((row) => ({
      CustomerName: row.CustomerName,
      OrderDate: row.OrderDate,
      ProductName: row.ProductName,
      CategoryName: row.CategoryName,
      Quantity: row.Quantity,
      TotalPrice: row.TotalPrice,
    }))
  );
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(
      `Database not found at ${DB_PATH}. Generate it with load_ecommerce_to_sqlite.js first.`
    );
    process.exit(1);
  }

  const db = openDatabase(DB_PATH);

  db.all(QUERY, (err, rows) => {
    if (err) {
      console.error("Failed to execute report query:", err.message);
      db.close();
      process.exit(1);
    }

    if (OUTPUT_PATH) {
      const resolved = path.resolve(OUTPUT_PATH);
      writeCsv(resolved, rows);
    } else {
      printTable(rows);
      console.log(
        "\nPass a file path as an argument to save results as CSV:\n  node run_order_report.js data/order_report.csv"
      );
    }

    db.close();
  });
}

main();

