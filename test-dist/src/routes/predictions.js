"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const predictions_1 = require("../models/predictions");
const router = (0, express_1.Router)();
// Route API
router.get('/', async (req, res) => {
    try {
        const predictions = await (0, predictions_1.getPredictions)();
        res.json(predictions);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch predictions' });
    }
});
exports.default = router;
