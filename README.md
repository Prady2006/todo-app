# TODO List Application

A RESTful API for managing your task list, built with Express.js and MySQL.

## Getting Started

These instructions will help you set up and run the application on your local machine.

### Prerequisites

- Node.js (v20 or higher)
- npm (v6 or higher)
- MySQL server

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/todo-list-app.git
   cd todo-list-app
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=8081
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=todo_db
   ```

### Running the Application

Start the server:

```
npm start
```

Run test cases :

```
npm run test
```

The server will start on the port specified in your `.env` file (default: 8081).
You can access the API at `http://localhost:8081`.

## Technology Stack

- Express.js - Web framework
- MySQL - Database
- JSON Web Tokens - Authentication
