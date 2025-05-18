"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const predictions_1 = require("../models/predictions");
const router = (0, express_1.Router)();
// Route API
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const predictions = yield (0, predictions_1.getPredictions)();
        res.json(predictions);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch predictions' });
    }
}));
exports.default = router;
