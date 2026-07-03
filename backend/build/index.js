"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const express_mysql_session_1 = __importDefault(require("express-mysql-session"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const snippets_1 = __importDefault(require("./routes/snippets"));
const collections_1 = __importDefault(require("./routes/collections"));
const tags_1 = __importDefault(require("./routes/tags"));
const comments_1 = __importDefault(require("./routes/comments"));
const aiSettings_1 = __importDefault(require("./routes/aiSettings"));
const profile_1 = __importDefault(require("./routes/profile"));
const MySQLStore = (0, express_mysql_session_1.default)(express_session_1.default);
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://88.200.63.148:30162',
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json());
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60,
    },
}));
app.use('/api/auth', auth_1.default);
app.use('/api/snippets', snippets_1.default);
app.use('/api/collections', collections_1.default);
app.use('/api/tags', tags_1.default);
app.use('/api/profile', profile_1.default);
app.use('/api', comments_1.default);
app.use('/api', aiSettings_1.default);
const frontendBuildPath = path_1.default.join(__dirname, '../dist/frontend-build');
console.log('Serving static files from:', frontendBuildPath);
app.use(express_1.default.static(frontendBuildPath));
app.get('/{*path}', (req, res) => {
    res.sendFile(path_1.default.join(frontendBuildPath, 'index.html'));
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
