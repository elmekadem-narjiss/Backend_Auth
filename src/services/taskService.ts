import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  priority: string;
}

console.log('PG_DBNAME:', process.env.PG_DBNAME);
console.log('PG_USER:', process.env.PG_USER);
console.log('PG_PASSWORD:', process.env.PG_PASSWORD);
console.log('PG_HOST:', process.env.PG_HOST);
console.log('PG_PORT:', process.env.PG_PORT);

const pool = new Pool({
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
  } catch (error) {
    console.error('Error creating tasks table:', (error as Error).message);
    throw error;
  }
};

(async () => {
  await initializeTable();
})();

export const taskService = {
  getAllTasks: async (): Promise<Task[]> => {
    try {
      const result = await pool.query('SELECT * FROM tasks ORDER BY created_at ASC');
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch tasks: ${(error as Error).message}`);
    }
  },

  createTask: async (title: string, description: string, status: string = 'todo', priority: string = 'medium'): Promise<Task> => {
    try {
      const result = await pool.query(
        'INSERT INTO tasks (title, description, status, priority) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, description || '', status, priority]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create task: ${(error as Error).message}`);
    }
  },

  updateTaskStatus: async (id: number, status: string): Promise<Task> => {
    try {
      const result = await pool.query(
        'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
      if (result.rowCount === 0) throw new Error('Task not found');
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update task status: ${(error as Error).message}`);
    }
  },

  updateTask: async (id: number, title: string, description: string, status: string, priority: string): Promise<Task> => {
    try {
      const result = await pool.query(
        'UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4 WHERE id = $5 RETURNING *',
        [title, description || '', status, priority, id]
      );
      if (result.rowCount === 0) throw new Error('Task not found');
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update task: ${(error as Error).message}`);
    }
  },

  deleteTask: async (id: number): Promise<void> => {
    try {
      if (!Number.isInteger(id) || id <= 0 || isNaN(id)) {
        throw new Error('Invalid task ID');
      }
      const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
      if (result.rowCount === 0) throw new Error('Task not found');
    } catch (error) {
      console.error('Error in deleteTask:', error);
      throw new Error(`Failed to delete task: ${(error as Error).message}`);
    }
  },

  clearTasks: async (): Promise<void> => {
    try {
      await pool.query('ALTER TABLE tasks DISABLE TRIGGER ALL');
      await pool.query('TRUNCATE TABLE tasks RESTART IDENTITY');
      await pool.query('ALTER TABLE tasks ENABLE TRIGGER ALL');
      console.log('All tasks cleared successfully');
    } catch (error) {
      console.error('Error in clearTasks:', error);
      throw new Error(`Failed to clear tasks: ${(error as Error).message}`);
    }
  },

};