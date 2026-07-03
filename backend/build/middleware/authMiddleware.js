"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authMiddleware = (req, res, next) => {
    if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    req.userId = req.session.userId;
    next();
};
exports.default = authMiddleware;
