# 🧠 Cognitive Reinforcement System — Backend

Complete backend covering Phase 1 + Phase 2 + Phase 3.

---

## 📁 Folder Structure

```
cognitive-backend/
├── config/
│   └── db.js                     → MongoDB connection
├── controllers/
│   ├── authController.js         → Register, Login, GetMe
│   ├── userController.js         → Profile, Stats, Password
│   ├── inputController.js        → YouTube, Text, PDF input
│   └── llmController.js          → Process content via Qwen
├── middleware/
│   ├── authMiddleware.js         → JWT protect()
│   ├── validateMiddleware.js     → Input validation
│   └── uploadMiddleware.js       → Multer PDF upload
├── models/
│   ├── User.js
│   ├── Video.js
│   ├── Concept.js
│   └── Question.js
├── routes/
│   ├── authRoutes.js             → /api/auth
│   ├── userRoutes.js             → /api/users
│   ├── inputRoutes.js            → /api/input
│   └── llmRoutes.js              → /api/llm
├── services/
│   ├── youtubeService.js         → Calls transcribe.py
│   ├── transcribe.py             → yt-dlp + Whisper
│   ├── pdfService.js             → pdf-parse text extraction
│   └── llmService.js             → Qwen API calls
├── utils/
│   ├── generateToken.js
│   └── responseHandler.js
├── .env.example
├── package.json
└── server.js
```

---

## ⚙️ Setup

### 1. Install Node dependencies
```bash
npm install
```

### 2. Install Python dependencies
```bash
pip install yt-dlp openai-whisper
```

### 3. Create .env file
```bash
cp .env.example .env
```

Fill in:
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `QWEN_BASE_URL` — your friend's Qwen server URL
- `QWEN_MODEL` — qwen2.5:7b

### 4. Update ffmpeg path in transcribe.py
Open `services/transcribe.py` and set:
```python
FFMPEG_DIR = r"D:\ffmpeg\bin"   # change to your actual path
```

### 5. Start the server
```bash
npm run dev
```

---

## 🌐 All API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Get current user |

### Users — `/api/users`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/users/profile` | Get profile |
| PUT  | `/api/users/profile` | Update profile |
| PUT  | `/api/users/change-password` | Change password |
| GET  | `/api/users/stats` | Learning stats |

### Input — `/api/input`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/input/youtube` | Submit YouTube URL |
| POST | `/api/input/text` | Submit notes |
| POST | `/api/input/pdf` | Upload PDF |
| GET  | `/api/input/all` | Get all inputs |
| GET  | `/api/input/:id` | Get one input |
| DELETE | `/api/input/:id` | Delete input |

### LLM — `/api/llm`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/llm/process/:videoId` | Process through Qwen |
| GET  | `/api/llm/concepts/:videoId` | Get concepts |
| GET  | `/api/llm/questions/:conceptId` | Get questions |

---

## 🔜 Coming Next
- Phase 4 — SM-2 Spaced Repetition Engine
- Phase 5 — Quiz & Evaluation System
- Phase 6 — Notifications (node-cron + SendGrid)
- Phase 7 — React.js Frontend
