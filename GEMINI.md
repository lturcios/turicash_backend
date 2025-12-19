# TuriCash Backend API Context

## Project Overview
This project is the backend API for **TuriCash POS** (Point of Sale), a Point of Sale system. It is built using **Node.js** and **Express**, backed by a **MySQL** database.

### Key Technologies
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL (using `mysql2` driver with connection pooling)
- **Authentication:** JWT (JSON Web Tokens) with `jsonwebtoken`
- **Security:** `bcryptjs` for password hashing, `cors` for Cross-Origin Resource Sharing

## Getting Started

### Prerequisites
- Node.js installed
- MySQL Server running and accessible

### Installation
1.  Install dependencies:
    ```bash
    npm install
    ```

### Configuration (.env)
The project relies on environment variables. Create a `.env` file in the root directory with the following keys (inferred from `config/db.js` and `src/index.js`):

```env
SERVER_PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=turicash_db
# Add JWT_SECRET if required by auth middleware (check middleware/auth.js)
```

### Running the Application
- **Development (with hot-reload):**
  ```bash
  npm run dev
  ```
- **Production:**
  ```bash
  npm start
  ```

## Project Structure

- **`src/index.js`**: Application entry point. Initializes Express, connects to the database, applies middleware, and sets up routes.
- **`config/db.js`**: MySQL database configuration and connection pool setup.
- **`routes/`**: Contains API route definitions, separated by resource:
    - `auth.js`: Login and registration.
    - `dashboard.js`: Analytics and statistics (sales, top items, etc.).
    - `items.js`: Product/Item management.
    - `locations.js`: Branch/Location management.
    - `tickets.js`: Sales ticket history and synchronization.
    - `users.js`: User management.
- **`middleware/`**: Express middleware (e.g., `auth.js` for JWT verification).

## API Overview
The API is prefixed with `/api`. Detailed documentation can be found in:
- **`API_ENDPOINTS_SUMMARY.md`**: Comprehensive list of endpoints and usage.
- **`DASHBOARD_API.md`**: Specific details for dashboard analytics endpoints.

### Key Resources
- **Auth**: `/api/auth` (Login, Register)
- **Locations**: `/api/locations` (Manage POS locations)
- **Items**: `/api/items` (Manage products)
- **Tickets**: `/api/tickets` (Sales history)
- **Dashboard**: `/api/dashboard` (Stats, sales reports)

## Development Conventions
- **Database Access**: Uses a connection pool strategy (`config/db.js`). Ensure connections are released back to the pool after use (seen in `src/index.js`).
- **Authentication**: Most endpoints (except login/register) require a Bearer Token.
- **Error Handling**: Basic global error handler present in `src/index.js`.
