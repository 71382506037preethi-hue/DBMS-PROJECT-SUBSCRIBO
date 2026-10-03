# Subscribo — Subscription Management System (DBMS Mini-Project)

A complete Full-Stack Subscription Management Web Application with SQLite backend persistence, relational schema, JWT & Bcrypt authentication, dynamic plan subscription workflows, and a live DBMS inspector.

---

## 🚀 How to Run in VS Code (Zero-Error Quick Start)

### Prerequisites
Make sure you have installed:
- **Node.js** (v18, v20, or v22 recommended) — [Download Node.js](https://nodejs.org/)
- **VS Code** (Visual Studio Code)

---

### Step 1: Extract the ZIP
1. Unzip the downloaded folder into your preferred directory (e.g., `Documents/subscribo` or `Desktop/subscribo`).
2. Open **VS Code**.
3. Click **File** > **Open Folder...** and select the extracted folder.

---

### Step 2: Open VS Code Terminal
In VS Code, open the integrated terminal:
- Press `` Ctrl + ` `` (or `Ctrl + ~` / `Cmd + ~` on macOS), or
- Click menu **Terminal** > **New Terminal**.

---

### Step 3: Install Dependencies
In the terminal, run:
```bash
npm install
```
*(This installs React 19, Express, SQLite sql.js, Tailwind CSS, Lucide icons, Motion, etc.)*

---

### Step 4: Start the Application
Run the development server:
```bash
npm run dev
```

You will see:
```
Server running on http://localhost:3000
```

---

### Step 5: Open in Your Browser
Open your web browser and navigate to:
```
http://localhost:3000
```

---

## 🛠 Available Scripts

- **`npm run dev`**: Starts the full-stack server (Express + Vite frontend on port 3000).
- **`npm run build`**: Builds the production bundle (Vite client assets + bundled Node server).
- **`npm start`**: Runs the production build (`node dist/server.cjs`).
- **`npm run lint`**: Runs TypeScript verification (`tsc --noEmit`).

---

## 🔑 Demo Login Accounts (For Teacher / Viva Demonstration)

You can use the **Demo Accounts** button in the header or sign in with these credentials:

| Role | Email | Password | What to Show |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@subscribo.app` | `admin123` | Full admin dashboard, manage plans, view all users with joined subscriptions, system reports |
| **Regular Subscriber** | `madhumitha@srit.ac.in` | `user123` | Active subscription details, renew plan, change plan, payment history |
| **Expiring Soon User** | `rahul@gmail.com` | `user123` | Expiring soon alerts, 1-click renewal workflow |
| **Free User** | `ananya@gmail.com` | `user123` | Browsing plans, subscribing to Pro/Enterprise |

---

## 📊 DBMS & Backend Demonstration
Click **"Backend Storage"** in the top navigation bar to open the live **DBMS & Viva Console**:
- View the **`users`** table: notice how subscribed plans, status, and validity dates are dynamically joined right beside user details.
- View **`subscriptions`**, **`plans`**, **`payments`**, and **`subscription_history`**.
- Run custom SQL queries in the interactive SQL terminal.
- View ER diagram and relational constraints (PK, FK, UNIQUE, NOT NULL).
