// ===============================
// 🌍 Backend API Base URL
// ===============================
const API_BASE = "http://localhost:3000";
console.log("✅ Script.js loaded successfully!");

// ===============================
// 🌙 Theme Toggle
// ===============================
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
}

// ===============================
// ➕ Add Expense
// ===============================
function addExpense() {
  const category = document.getElementById("category").value.trim();
  const description = document.getElementById("description").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const date = new Date().toISOString().split("T")[0];

  if (!category || !description || isNaN(amount)) {
    alert("⚠️ Please fill all fields correctly!");
    return;
  }

  fetch(`${API_BASE}/add-expense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, description, amount, date }),
  })
    .then((res) => res.text())
    .then((msg) => {
      alert(msg);
      document.getElementById("category").value = "";
      document.getElementById("description").value = "";
      document.getElementById("amount").value = "";
      loadExpenses();
    })
    .catch((err) => {
      console.error("❌ Error:", err);
      alert("❌ Failed to add expense. Check your server connection!");
    });
}

// ===============================
// 📋 Load Expenses
// ===============================
function loadExpenses() {
  fetch(`${API_BASE}/expenses`)
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.querySelector("#expenseTable tbody");
      if (!tbody) return;
      tbody.innerHTML = "";
      data.forEach((expense) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${expense.date}</td>
          <td>${expense.category}</td>
          <td>${expense.description}</td>
          <td>₹${expense.amount}</td>
          <td><button onclick="deleteExpense(${expense.id})">🗑️</button></td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch((err) => {
      console.error("❌ Error loading expenses:", err);
    });
}

// ===============================
// ❌ Delete Expense
// ===============================
function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;
  fetch(`${API_BASE}/expenses/${id}`, { method: "DELETE" })
    .then((res) => res.text())
    .then((msg) => {
      alert(msg);
      loadExpenses();
    })
    .catch((err) => console.error("❌ Error deleting expense:", err));
}

// ===============================
// 💰 Budget (local only)
// ===============================
function saveBudget() {
  const budget = parseFloat(document.getElementById("budget").value);
  if (isNaN(budget) || budget <= 0) {
    alert("⚠️ Enter a valid budget amount!");
    return;
  }
  localStorage.setItem("budget", budget);
  alert(`✅ Budget saved: ₹${budget}`);
}

function loadBudget() {
  const budget = localStorage.getItem("budget");
  if (budget) document.getElementById("budget").value = budget;
}

// ===============================
// 📊 Analytics
// ===============================
function loadAnalytics() {
  fetch(`${API_BASE}/analytics`)
    .then((res) => res.json())
    .then((data) => {
      // Pie Chart (by category)
      const pieCtx = document.getElementById("pieChart");
      if (pieCtx) {
        const categories = data.categoryTotals.map((row) => row.category);
        const totals = data.categoryTotals.map((row) => row.total);

        new Chart(pieCtx, {
          type: "pie",
          data: {
            labels: categories,
            datasets: [{ data: totals }],
          },
        });
      }

      // Line Chart (by date)
      const lineCtx = document.getElementById("lineChart");
      if (lineCtx) {
        const dates = data.dailyTotals.map((row) => row.date);
        const totals = data.dailyTotals.map((row) => row.total);

        new Chart(lineCtx, {
          type: "line",
          data: {
            labels: dates,
            datasets: [
              {
                label: "Expenses Over Time",
                data: totals,
                borderWidth: 2,
              },
            ],
          },
        });
      }
    })
    .catch((err) => {
      console.error("❌ Error loading analytics:", err);
      alert("⚠️ Could not load analytics data!");
    });
}

// ===============================
// 🤖 Chatbot (Smart + Aesthetic)
// ===============================
function loadChatbot() {
  const chatArea = document.getElementById("chatArea");
  if (chatArea)
    chatArea.innerHTML = `<div class='bot-msg fadeIn'>🤖 Hello! I’m TrackerBot — ask me about your expenses, budget, or tips!</div>`;
}

function sendMessage() {
  const input = document.getElementById("chatInput");
  const chatArea = document.getElementById("chatArea");
  const message = input.value.trim();
  if (!message) return;

  // Display user message
  chatArea.innerHTML += `<div class='user-msg fadeIn'>🧑 ${message}</div>`;
  input.value = "";

  // Try backend first
  fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  })
    .then((res) => res.json())
    .then((data) => {
      chatArea.innerHTML += `<div class='bot-msg fadeIn'>${data.reply}</div>`;
      chatArea.scrollTop = chatArea.scrollHeight;
    })
    .catch(() => {
      // Fallback to local smart replies
      const reply = getLocalChatResponse(message.toLowerCase());
      chatArea.innerHTML += `<div class='bot-msg fadeIn'>${reply}</div>`;
      chatArea.scrollTop = chatArea.scrollHeight;
    });
}

function getLocalChatResponse(msg) {
  if (msg.includes("hello") || msg.includes("hi")) return "👋 Hey there! How can I assist you today?";
  if (msg.includes("add expense")) return "Go to the ➕ Add Expense page to log your new spending.";
  if (msg.includes("budget")) return "💰 You can set or update your monthly budget in the Add Expense page.";
  if (msg.includes("analytics") || msg.includes("chart")) return "📊 The Analytics page shows your spending trends visually.";
  if (msg.includes("profile")) return "👤 You can edit your name and email in your Profile section.";
  if (msg.includes("delete")) return "🗑️ Click the delete icon beside any expense to remove it.";
  if (msg.includes("help")) return "I can guide you with expenses, budgets, analytics, and tips to save more!";
  if (msg.includes("tip") || msg.includes("save money"))
    return "💡 Tip: Track every small expense — even ₹10 chai adds up over time!";
  if (msg.includes("motivate") || msg.includes("quote"))
    return "✨ 'Do not save what is left after spending, but spend what is left after saving.' – Warren Buffett";
  if (msg.includes("thank")) return "😊 You’re welcome! Keep tracking smartly!";
  if (msg.includes("who made you")) return "👨‍💻 I was built by Nikhil Arora — a coding wizard!";
  if (msg.includes("who are you")) return "I’m TrackerBot — your personal finance assistant 🤖.";
  if (msg.includes("goal")) return "🎯 Set a savings goal! For example: Save ₹5,000 this month!";
  if (msg.includes("today")) return "📅 You can view today’s expenses under Dashboard or Analytics.";
  if (msg.includes("currency")) return "💸 All amounts are tracked in Indian Rupees (₹).";
  return "🤔 Hmm... I didn’t quite catch that. Try asking about 'budget', 'analytics', or 'tips'.";
}

// ===============================
// 🚀 Page Initializer
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("addBtn"))
    document.getElementById("addBtn").addEventListener("click", addExpense);
  if (document.getElementById("budgetBtn"))
    document.getElementById("budgetBtn").addEventListener("click", saveBudget);
  if (document.getElementById("expenseTable")) loadExpenses();
  if (document.getElementById("budget")) loadBudget();
  if (document.getElementById("pieChart")) loadAnalytics();
  if (document.getElementById("chatArea")) loadChatbot();
});
