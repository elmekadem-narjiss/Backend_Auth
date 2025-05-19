"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const taskService_1 = require("../services/taskService");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const tasks = await taskService_1.taskService.getAllTasks();
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/', async (req, res) => {
    try {
        const { title, description, status, priority } = req.body;
        const task = await taskService_1.taskService.createTask(title, description || '', status || 'todo', priority || 'medium');
        res.status(201).json(task);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/', async (req, res) => {
    try {
        const { id, status } = req.body;
        const task = await taskService_1.taskService.updateTaskStatus(id, status);
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority } = req.body;
        const task = await taskService_1.taskService.updateTask(parseInt(id), title, description || '', status, priority || 'medium');
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await taskService_1.taskService.deleteTask(parseInt(id));
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
