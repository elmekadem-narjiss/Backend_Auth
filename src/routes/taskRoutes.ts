import express from 'express';
import { taskService } from '../services/taskService';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const tasks = await taskService.getAllTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority } = req.body;
    const task = await taskService.createTask(title, description || '', status || 'todo', priority || 'medium');
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { id, status } = req.body;
    const task = await taskService.updateTaskStatus(id, status);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority } = req.body;
    const task = await taskService.updateTask(parseInt(id), title, description || '', status, priority || 'medium');
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await taskService.deleteTask(parseInt(id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;