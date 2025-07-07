"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const notFoundHandler = (req, res) => {
    const response = {
        success: false,
        message: `Route ${req.originalUrl} not found`,
        error: `Cannot ${req.method} ${req.originalUrl}`,
    };
    res.status(404).json(response);
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=notFoundHandler.js.map