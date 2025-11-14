const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const NUM_CUSTOMERS = 1000;
const NUM_CATEGORIES = 1000;
const NUM_PRODUCTS = 1000;
const NUM_ORDERS = 1000;
const MIN_ITEMS_PER_ORDER = 1;
const MAX_ITEMS_PER_ORDER = 6;

const NOW = new Date();
const START_DATE = new Date(NOW.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);

const FIRST_NAMES = [
  "Liam",
  "Emma",
  "Noah",
  "Olivia",
  "Ava",
  "Isabella",
  "Sophia",
  "Mia",
  "Charlotte",
  "Amelia",
  "Ethan",
  "James",
  "Benjamin",
  "Lucas",
  "Mason",
  "Logan",
  "Elijah",
  "Alexander",
  "Henry",
  "Sebastian",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
];

const CITIES = [
  "New York",
  "Los Angeles",
  "Chicago",
  "Houston",
  "Phoenix",
  "Philadelphia",
  "San Antonio",
  "San Diego",
  "Dallas",
  "San Jose",
  "Austin",
  "Jacksonville",
  "Fort Worth",
  "Columbus",
  "Charlotte",
  "San Francisco",
  "Indianapolis",
  "Seattle",
  "Denver",
  "Washington",
];

const COUNTRIES = [
  "USA",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Australia",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
];

const CATEGORY_ROOTS = [
  "Electronics",
  "Home & Kitchen",
  "Books",
  "Clothing",
  "Sports & Outdoors",
  "Automotive",
  "Beauty & Personal Care",
  "Toys & Games",
  "Grocery",
  "Health",
];

const DEPARTMENTS = [
  "Accessories",
  "Audio",
  "Bedding",
  "Camera",
  "Computers",
  "Decor",
  "Fitness",
  "Footwear",
  "Garden",
  "Kids",
  "Lighting",
  "Mobile",
  "Office",
  "Outdoor",
  "Pets",
  "Storage",
  "Tools",
  "Wellness",
];

const PRODUCT_ADJECTIVES = [
  "Premium",
  "Advanced",
  "Eco",
  "Compact",
  "Wireless",
  "Portable",
  "Smart",
  "Classic",
  "Deluxe",
  "Essential",
  "Limited",
  "Modern",
  "Rustic",
  "Ultra",
  "Vintage",
];

const PRODUCT_NOUNS = [
  "Headphones",
  "Laptop",
  "Backpack",
  "Mixer",
  "Sneakers",
  "Jacket",
  "Desk",
  "Chair",
  "Watch",
  "Camera",
  "Speaker",
  "Blender",
  "Cookware Set",
  "Treadmill",
  "Yoga Mat",
  "Vacuum",
  "Coffee Maker",
  "Guitar",
  "Drill",
  "Smartphone",
  "Tablet",
  "Monitor",
  "Printer",
  "Router",
];

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(42);

function randomChoice(list) {
  return list[Math.floor(random() * list.length)];
}

function randomInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randomTimestamp(start, end) {
  const startMs = start.getTime();
  const endMs = end.getTime();
  const delta = endMs - startMs;
  const randomMs = randomInt(0, delta);
  return new Date(startMs + randomMs);
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function generateCustomers() {
  const customers = [];
  const seenEmails = new Set();
  for (let i = 1; i <= NUM_CUSTOMERS; i += 1) {
    const first = randomChoice(FIRST_NAMES);
    const last = randomChoice(LAST_NAMES);
    const baseEmail = `${first.toLowerCase()}.${last.toLowerCase()}`;
    const domain = randomChoice([
      "example.com",
      "mail.com",
      "shopper.net",
      "customer.org",
    ]);

    let email = `${baseEmail}@${domain}`;
    let counter = 1;
    while (seenEmails.has(email)) {
      email = `${baseEmail}${counter}@${domain}`;
      counter += 1;
    }
    seenEmails.add(email);

    const createdAt = randomTimestamp(START_DATE, NOW);

    customers.push({
      CustomerID: `CUST${String(i).padStart(4, "0")}`,
      FirstName: first,
      LastName: last,
      Email: email,
      Phone: `+1-555-${String(randomInt(100, 999)).padStart(3, "0")}-${String(
        randomInt(1000, 9999)
      ).padStart(4, "0")}`,
      City: randomChoice(CITIES),
      Country: randomChoice(COUNTRIES),
      CreatedAt: createdAt.toISOString(),
    });
  }
  return customers;
}

function generateCategories() {
  const categories = [];
  for (let i = 1; i <= NUM_CATEGORIES; i += 1) {
    const root = randomChoice(CATEGORY_ROOTS);
    const department = randomChoice(DEPARTMENTS);
    categories.push({
      CategoryID: `CAT${String(i).padStart(4, "0")}`,
      CategoryName: `${root} - ${department} ${i}`,
      Department: department,
      ParentCategory: random() < 0.7 ? root : "",
    });
  }
  return categories;
}

function generateProducts(categories) {
  const products = [];
  for (let i = 1; i <= NUM_PRODUCTS; i += 1) {
    const adjective = randomChoice(PRODUCT_ADJECTIVES);
    const noun = randomChoice(PRODUCT_NOUNS);
    const category = randomChoice(categories);
    const price = +(5 + random() * (1200 - 5)).toFixed(2);
    const cost = +(price * (0.4 + random() * (0.7 - 0.4))).toFixed(2);
    products.push({
      ProductID: `PROD${String(i).padStart(5, "0")}`,
      SKU: `SKU-${randomInt(100000, 999999)}`,
      ProductName: `${adjective} ${noun}`,
      CategoryID: category.CategoryID,
      UnitPrice: price.toFixed(2),
      UnitCost: cost.toFixed(2),
      StockQuantity: String(randomInt(0, 500)),
      Active: random() > 0.1 ? "true" : "false",
    });
  }
  return products;
}

function generateOrders(customers) {
  const orders = [];
  for (let i = 1; i <= NUM_ORDERS; i += 1) {
    const customer = randomChoice(customers);
    const orderDate = randomTimestamp(new Date(customer.CreatedAt), NOW);
    const shippingDays = randomInt(2, 14);
    const shippedDate = new Date(orderDate.getTime());
    shippedDate.setUTCDate(orderDate.getUTCDate() + shippingDays);
    const status = randomChoice(
      ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      [0.1, 0.15, 0.3, 0.4, 0.05]
    );

    orders.push({
      OrderID: `ORD${String(i).padStart(5, "0")}`,
      CustomerID: customer.CustomerID,
      OrderDate: orderDate.toISOString(),
      ShippedDate:
        status === "Shipped" || status === "Delivered"
          ? shippedDate.toISOString()
          : "",
      OrderStatus: status,
      ShippingMethod: randomChoice(["Standard", "Express", "Next-Day", "Economy"]),
      ShippingCity: randomChoice(CITIES),
      ShippingCountry: randomChoice(COUNTRIES),
    });
  }
  return orders;
}

function randomChoice(list, weights) {
  if (!weights) {
    return list[Math.floor(random() * list.length)];
  }
  const total = weights.reduce((sum, w) => sum + w, 0);
  const r = random() * total;
  let cumulative = 0;
  for (let i = 0; i < list.length; i += 1) {
    cumulative += weights[i];
    if (r <= cumulative) {
      return list[i];
    }
  }
  return list[list.length - 1];
}

function generateOrderDetails(orders, products) {
  const orderDetails = [];
  const orderTotals = new Map();
  orders.forEach((order) => {
    const numItems = randomInt(MIN_ITEMS_PER_ORDER, MAX_ITEMS_PER_ORDER);
    const pickedProducts = pickUnique(products, numItems);
    pickedProducts.forEach((product, index) => {
      const quantity = randomInt(1, 5);
      const discount = randomChoice([0, 0, 0, 0.05, 0.1, 0.15]);
      const unitPrice = parseFloat(product.UnitPrice);
      const lineTotal = quantity * unitPrice * (1 - discount);
      const currentTotal = orderTotals.get(order.OrderID) || 0;
      orderTotals.set(order.OrderID, currentTotal + lineTotal);
      orderDetails.push({
        OrderDetailID: `ORDDET${String(orderDetails.length + 1).padStart(6, "0")}`,
        OrderID: order.OrderID,
        ProductID: product.ProductID,
        Quantity: String(quantity),
        UnitPrice: unitPrice.toFixed(2),
        Discount: discount.toFixed(2),
        LineNumber: String(index + 1),
        LineTotal: lineTotal.toFixed(2),
      });
    });
  });
  return { orderDetails, orderTotals };
}

function pickUnique(list, count) {
  const copy = [...list];
  const selected = [];
  for (let i = 0; i < count && copy.length > 0; i += 1) {
    const index = randomInt(0, copy.length - 1);
    selected.push(copy[index]);
    copy.splice(index, 1);
  }
  return selected;
}

function updateOrderTotals(orders, orderTotals) {
  orders.forEach((order) => {
    const total = orderTotals.get(order.OrderID) || 0;
    order.OrderTotal = total.toFixed(2);
  });
}

function writeCsv(filePath, rows) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]);
  const lines = [
    header.join(","),
    ...rows.map((row) =>
      header
        .map((field) => escapeCsvValue(row[field]))
        .join(",")
    ),
  ];
  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function main() {
  ensureDataDir();

  const customers = generateCustomers();
  const categories = generateCategories();
  const products = generateProducts(categories);
  const orders = generateOrders(customers);
  const { orderDetails, orderTotals } = generateOrderDetails(orders, products);
  updateOrderTotals(orders, orderTotals);

  writeCsv(path.join(DATA_DIR, "customers_js.csv"), customers);
  writeCsv(path.join(DATA_DIR, "categories_js.csv"), categories);
  writeCsv(path.join(DATA_DIR, "products_js.csv"), products);
  writeCsv(path.join(DATA_DIR, "orders_js.csv"), orders);
  writeCsv(path.join(DATA_DIR, "order_details_js.csv"), orderDetails);
}

main();

