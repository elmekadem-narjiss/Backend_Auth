import express, { Request, Response } from 'express';
import { taskService } from '../services/taskService';

const router = express.Router();

// GET /api/tasks - Fetch all tasks
router.get('/', async (req: Request, res: Response) => {
  try {
    const tasks = await taskService.getAllTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/tasks - Create a new task
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, status, priority } = req.body;
    const task = await taskService.createTask(title, description || '', status || 'todo', priority || 'medium');
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PATCH /api/tasks/:id - Update task status
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const task = await taskService.updateTaskStatus(parseInt(id, 10), status);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /api/tasks/:id - Update task details
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority } = req.body;
    const task = await taskService.updateTask(parseInt(id, 10), title, description || '', status, priority || 'medium');
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE /api/tasks/clear - Clear all tasks (must be before /:id)
router.delete('/clear', async (req: Request, res: Response) => {
  try {
    await taskService.clearTasks();
    res.status(200).json({ message: 'Tasks cleared successfully' });
  } catch (error) {
    console.error('Error in DELETE /clear:', error);
    res.status(500).json({
      error: `Failed to clear tasks: ${(error as Error).message}`,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
    });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }
    await taskService.deleteTask(parsedId);
    res.status(204).send();
  } catch (error) {
    console.error('Error in DELETE /:id:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;