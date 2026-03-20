const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Database connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "12345",
  database: "expense_tracker",
  waitForConnections: true, 
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection
pool.getConnection()
  .then(conn => {
    console.log("✅ Connected to MySQL Database!");
    conn.release();
  })
  .catch(err => console.error("❌ DB Connection Error:", err.message));

// ✅ Add Expense
app.post("/add-expense", async (req, res) => {
  const { category, description, amount, date } = req.body;
  if (!category || !description || !amount)
    return res.status(400).send("⚠️ Please fill all fields!");

  try {
    await pool.execute(
      "INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)",
      [category, description, amount, date]
    );
    res.send("✅ Expense added successfully!");
  } catch (err) {
    console.error("❌ Error inserting:", err);
    res.status(500).send("Database error!");
  }
});

// ✅ Get All Expenses
app.get("/expenses", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM expenses ORDER BY date DESC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching:", err);
    res.status(500).json({ error: "Database fetch error" });
  }
});

// ✅ Delete Expense
app.delete("/expenses/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute("DELETE FROM expenses WHERE id = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).send("⚠️ Expense not found!");
    res.send("🗑️ Expense deleted successfully!");
  } catch (err) {
    console.error("❌ Error deleting:", err);
    res.status(500).send("Database delete error!");
  }
});

// ✅ Analytics (for charts)
app.get("/analytics", async (req, res) => {
  try {
    const [categoryTotals] = await pool.execute(
      "SELECT category, SUM(amount) AS total FROM expenses GROUP BY category"
    );
    const [dailyTotals] = await pool.execute(
      "SELECT date, SUM(amount) AS total FROM expenses GROUP BY date ORDER BY date"
    );
    res.json({ categoryTotals, dailyTotals });
  } catch (err) {
    console.error("❌ Error in analytics:", err);
    res.status(500).send("Database analytics error!");
  }
});

// ✅ Chatbot API
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message.toLowerCase();
  let reply = "🤔 I can help you track expenses, show analytics, or tell your total. Try commands like 'show analytics', 'total food expenses', or 'help'.";

  try {
    // 1️⃣ Greeting
    if (/hi|hello|hey|hii/.test(userMessage)) {
      reply = "👋 Hello there! I'm your Expense Assistant. Ask me about your spending or type 'help' for what I can do!";
    }

    // 2️⃣ Help command
    else if (userMessage.includes("help")) {
      reply = `🧭 You can ask me things like:
      - 💰 'total expenses'
      - 🍕 'food expenses'
      - 📊 'show analytics'
      - 🕒 'last 5 expenses'
      - 💡 'how to save money'
      - 🧾 'suggest budget'`;
    }

    // 3️⃣ Total expenses
    else if (userMessage.includes("total")) {
      const [rows] = await db.query("SELECT SUM(amount) AS total FROM expenses");
      reply = `💰 Your total expenses are ₹${rows[0].total?.toFixed(2) || 0}`;
    }

    // 4️⃣ Category-wise
    else if (userMessage.includes("expense")) {
      const category = userMessage.split(" ")[0]; // e.g., "food expenses"
      const [rows] = await db.query("SELECT SUM(amount) AS total FROM expenses WHERE category LIKE ?", [`%${category}%`]);
      if (rows[0].total)
        reply = `🍽️ Your total ${category} expenses are ₹${rows[0].total.toFixed(2)}`;
      else reply = `😕 No expenses found for '${category}'.`;
    }

    // 5️⃣ Show last few expenses
    else if (userMessage.includes("last") || userMessage.includes("recent")) {
      const [rows] = await db.query("SELECT * FROM expenses ORDER BY date DESC LIMIT 5");
      if (rows.length === 0) reply = "📭 No expenses recorded yet.";
      else {
        reply = "🧾 Here are your recent expenses:<br>" + rows.map(r => `📅 ${r.date} - ${r.category}: ₹${r.amount}`).join("<br>");
      }
    }

    // 6️⃣ Analytics prompt
    else if (userMessage.includes("analytics")) {
      reply = "📊 You can view detailed visual analytics in the 'Analytics' tab. It shows charts of your spending habits.";
    }

    // 7️⃣ Savings tips
    else if (userMessage.includes("save") || userMessage.includes("tip")) {
      const tips = [
        "💡 Tip: Try setting a weekly spending limit to stay disciplined.",
        "🪙 Tip: Track small daily expenses — they add up quickly!",
        "📉 Tip: Avoid impulse buys — wait 24 hours before purchasing.",
        "🏦 Tip: Transfer a fixed amount to savings every month first.",
        "🍲 Tip: Cook at home twice a week instead of eating out!"
      ];
      reply = tips[Math.floor(Math.random() * tips.length)];
    }

    // 8️⃣ Budget suggestions
    else if (userMessage.includes("budget")) {
      const [rows] = await db.query("SELECT SUM(amount) AS total FROM expenses");
      const total = rows[0].total || 0;
      const suggested = (total * 0.8).toFixed(2);
      reply = `🧮 Based on your current spending (₹${total}), I suggest a monthly budget of around ₹${suggested}.`;
    }

  } catch (error) {
    console.error("Chat error:", error);
    reply = "⚠️ Something went wrong while fetching data!";
  }

  res.json({ reply });
});
  

app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
