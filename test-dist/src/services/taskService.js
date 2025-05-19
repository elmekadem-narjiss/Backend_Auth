"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskService = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log('PG_DBNAME:', process.env.PG_DBNAME);
console.log('PG_USER:', process.env.PG_USER);
console.log('PG_PASSWORD:', process.env.PG_PASSWORD);
console.log('PG_HOST:', process.env.PG_HOST);
console.log('PG_PORT:', process.env.PG_PORT);
const pool = new pg_1.Pool({
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT || '5432', 10),
    database: process.env.PG_DBNAME,
});
const initializeTable = async () => {
    try {
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'todo',
        priority VARCHAR(50) NOT NULL DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
        await pool.query(createTableQuery);
        console.log('Table "tasks" is ready');
    }
    catch (error) {
        console.error('Error creating tasks table:', error.message);
        throw error;
    }
};
(async () => {
    await initializeTable();
})();
exports.taskService = {
    getAllTasks: async () => {
        try {
            const result = await pool.query('SELECT * FROM tasks ORDER BY created_at ASC');
            return result.rows;
        }
        catch (error) {
            throw new Error(`Failed to fetch tasks: ${error.message}`);
        }
    },
    createTask: async (title, description, status = 'todo', priority = 'medium') => {
        try {
            const result = await pool.query('INSERT INTO tasks (title, description, status, priority) VALUES ($1, $2, $3, $4) RETURNING *', [title, description || '', status, priority]);
            return result.rows[0];
        }
        catch (error) {
            throw new Error(`Failed to create task: ${error.message}`);
        }
    },
    updateTaskStatus: async (id, status) => {
        try {
            const result = await pool.query('UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
            if (result.rowCount === 0)
                throw new Error('Task not found');
            return result.rows[0];
        }
        catch (error) {
            throw new Error(`Failed to update task status: ${error.message}`);
        }
    },
    updateTask: async (id, title, description, status, priority) => {
        try {
            const result = await pool.query('UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4 WHERE id = $5 RETURNING *', [title, description || '', status, priority, id]);
            if (result.rowCount === 0)
                throw new Error('Task not found');
            return result.rows[0];
        }
        catch (error) {
            throw new Error(`Failed to update task: ${error.message}`);
        }
    },
    deleteTask: async (id) => {
        try {
            const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
            if (result.rowCount === 0)
                throw new Error('Task not found');
        }
        catch (error) {
            throw new Error(`Failed to delete task: ${error.message}`);
        }
    },
};
