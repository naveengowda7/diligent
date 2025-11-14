const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "ecommerce.db");

const SOURCE_FILES = {
  Customers: "customers_js.csv",
  Categories: "categories_js.csv",
  Products: "products_js.csv",
  Orders: "orders_js.csv",
  OrderDetails: "order_details_js.csv",
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(
      `Data directory not found at ${DATA_DIR}. Generate CSVs before loading.`
    );
  }
}

function removeExistingDatabase() {
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
}

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return [];
  }
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      throw new Error(
        `Row length mismatch in ${filePath} at data line ${index + 2}.`
      );
    }
    const record = {};
    headers.forEach((header, i) => {
      record[header] = values[i];
    });
    return record;
  });
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

function openDatabase() {
  return new sqlite3.Database(DB_PATH);
}

function run(db, sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function exec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function close(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function insertRows(db, tableName, columns, rows) {
  if (!rows.length) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      const placeholders = columns.map(() => "?").join(",");
      const statement = db.prepare(
        `INSERT INTO ${tableName} (${columns.join(",")}) VALUES (${placeholders})`
      );

      rows.forEach((row) => {
        const values = columns.map((column) => row[column]);
        statement.run(values);
      });

      statement.finalize((err) => {
        if (err) {
          reject(err);
          return;
        }
        db.run("COMMIT", (commitErr) => {
          if (commitErr) {
            reject(commitErr);
          } else {
            resolve();
          }
        });
      });
    });
  });
}

function transformCustomers(rows) {
  return rows.map((row) => ({
    CustomerID: row.CustomerID,
    FirstName: row.FirstName,
    LastName: row.LastName,
    Email: row.Email,
    Phone: row.Phone,
    City: row.City,
    Country: row.Country,
    CreatedAt: row.CreatedAt,
  }));
}

function transformCategories(rows) {
  return rows.map((row) => ({
    CategoryID: row.CategoryID,
    CategoryName: row.CategoryName,
    Department: row.Department,
    ParentCategory: row.ParentCategory || null,
  }));
}

function transformProducts(rows) {
  return rows.map((row) => ({
    ProductID: row.ProductID,
    SKU: row.SKU,
    ProductName: row.ProductName,
    CategoryID: row.CategoryID,
    UnitPrice: parseFloat(row.UnitPrice),
    UnitCost: parseFloat(row.UnitCost),
    StockQuantity: parseInt(row.StockQuantity, 10),
    Active: row.Active === "true" ? 1 : 0,
  }));
}

function transformOrders(rows) {
  return rows.map((row) => ({
    OrderID: row.OrderID,
    CustomerID: row.CustomerID,
    OrderDate: row.OrderDate,
    ShippedDate: row.ShippedDate || null,
    OrderStatus: row.OrderStatus,
    ShippingMethod: row.ShippingMethod,
    ShippingCity: row.ShippingCity,
    ShippingCountry: row.ShippingCountry,
    OrderTotal: parseFloat(row.OrderTotal),
  }));
}

function transformOrderDetails(rows) {
  return rows.map((row) => ({
    OrderDetailID: row.OrderDetailID,
    OrderID: row.OrderID,
    ProductID: row.ProductID,
    Quantity: parseInt(row.Quantity, 10),
    UnitPrice: parseFloat(row.UnitPrice),
    Discount: parseFloat(row.Discount),
    LineNumber: parseInt(row.LineNumber, 10),
    LineTotal: parseFloat(row.LineTotal),
  }));
}

async function createTables(db) {
  const schema = `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS Customers (
      CustomerID TEXT PRIMARY KEY,
      FirstName TEXT NOT NULL,
      LastName TEXT NOT NULL,
      Email TEXT NOT NULL,
      Phone TEXT,
      City TEXT,
      Country TEXT,
      CreatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Categories (
      CategoryID TEXT PRIMARY KEY,
      CategoryName TEXT NOT NULL,
      Department TEXT,
      ParentCategory TEXT
    );

    CREATE TABLE IF NOT EXISTS Products (
      ProductID TEXT PRIMARY KEY,
      SKU TEXT NOT NULL,
      ProductName TEXT NOT NULL,
      CategoryID TEXT NOT NULL,
      UnitPrice REAL NOT NULL,
      UnitCost REAL NOT NULL,
      StockQuantity INTEGER NOT NULL,
      Active INTEGER NOT NULL CHECK (Active IN (0,1)),
      FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
    );

    CREATE TABLE IF NOT EXISTS Orders (
      OrderID TEXT PRIMARY KEY,
      CustomerID TEXT NOT NULL,
      OrderDate TEXT NOT NULL,
      ShippedDate TEXT,
      OrderStatus TEXT NOT NULL,
      ShippingMethod TEXT,
      ShippingCity TEXT,
      ShippingCountry TEXT,
      OrderTotal REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
    );

    CREATE TABLE IF NOT EXISTS OrderDetails (
      OrderDetailID TEXT PRIMARY KEY,
      OrderID TEXT NOT NULL,
      ProductID TEXT NOT NULL,
      Quantity INTEGER NOT NULL,
      UnitPrice REAL NOT NULL,
      Discount REAL NOT NULL DEFAULT 0,
      LineNumber INTEGER NOT NULL,
      LineTotal REAL NOT NULL,
      FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
      FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
    );
  `;

  await exec(db, schema);
}

async function loadTable(db, tableName, fileName, transformer, columns) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file for ${tableName} not found at ${filePath}`);
  }

  const rawRows = parseCsv(filePath);
  const rows = transformer(rawRows);
  await insertRows(db, tableName, columns, rows);
}

async function main() {
  ensureDataDir();
  removeExistingDatabase();

  const db = openDatabase();

  try {
    await createTables(db);

    await loadTable(
      db,
      "Customers",
      SOURCE_FILES.Customers,
      transformCustomers,
      [
        "CustomerID",
        "FirstName",
        "LastName",
        "Email",
        "Phone",
        "City",
        "Country",
        "CreatedAt",
      ]
    );

    await loadTable(
      db,
      "Categories",
      SOURCE_FILES.Categories,
      transformCategories,
      ["CategoryID", "CategoryName", "Department", "ParentCategory"]
    );

    await loadTable(
      db,
      "Products",
      SOURCE_FILES.Products,
      transformProducts,
      [
        "ProductID",
        "SKU",
        "ProductName",
        "CategoryID",
        "UnitPrice",
        "UnitCost",
        "StockQuantity",
        "Active",
      ]
    );

    await loadTable(
      db,
      "Orders",
      SOURCE_FILES.Orders,
      transformOrders,
      [
        "OrderID",
        "CustomerID",
        "OrderDate",
        "ShippedDate",
        "OrderStatus",
        "ShippingMethod",
        "ShippingCity",
        "ShippingCountry",
        "OrderTotal",
      ]
    );

    await loadTable(
      db,
      "OrderDetails",
      SOURCE_FILES.OrderDetails,
      transformOrderDetails,
      [
        "OrderDetailID",
        "OrderID",
        "ProductID",
        "Quantity",
        "UnitPrice",
        "Discount",
        "LineNumber",
        "LineTotal",
      ]
    );
  } finally {
    await close(db);
  }
}

main().catch((error) => {
  console.error("Failed to load data:", error);
  process.exitCode = 1;
});

