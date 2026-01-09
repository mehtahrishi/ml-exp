# 🧠 Catalyst Flow ML - ML Experimentation Platform

> A production-ready, full-stack machine learning platform for training, comparing, and visualizing ML experiments in real-time.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4-F7931E?logo=scikit-learn)](https://scikit-learn.org/)

---

## 📸 Screenshots

**Dashboard with Experiment Comparison**
- Real-time training visualization
- Medal-based ranking system (🥇🥈🥉)
- Interactive metric selection

**Model Configuration**
- 9 Pre-configured ML algorithms
- Hybrid hyperparameter tuning
- Educational dual-context explanations

---

## ✨ Key Features

### 🎯 **Smart ML Training**
- **9 Production Algorithms**: RandomForest, GradientBoosting, AdaBoost, MLPClassifier, SVM, LogisticRegression, DecisionTree, KNN, NaiveBayes
- **Live Metric Tracking**: Watch Train vs Test accuracy, Loss, F1, Precision, Recall update in real-time
- **Intelligent Training Strategies**:
  - Neural Networks: True epoch-by-epoch with warm_start
  - Tree Ensembles: Incremental tree growth (5→100)
  - Other Models: Progressive learning curves
- **Auto ML Pipeline**: Automatic encoding, scaling, imputation, and train/val/test splitting

### 📊 **Advanced Analytics**
- **Dual-Tab Dashboard**:
  - **Recent Runs**: Monitor all training jobs with live status
  - **Comparison**: Rank experiments by any metric with medal badges
- **Interactive Recharts Visualizations**:
  - Train vs Test accuracy curves
  - Log loss tracking
  - F1/Precision/Recall performance metrics
- **Experiment Reproducibility**: Full parameter and configuration logging

### 🎓 **Educational Design** *(Unique Feature)*
- **Dual-Context Explanations**: Every model includes:
  - Technical: How the algorithm actually works
  - Kitchen Analogy: Relatable metaphors (e.g., "RandomForest = Council of Chefs")
- **Visual Training Workflows**: Step-by-step breakdown of data preparation, training, and validation
- **Transparent Parameters**: Tunable parameters highlighted, fixed parameters visible

### 🚀 **Developer Experience**
- **One-Command Deploy**: Docker Compose for instant setup
- **Hot Reloading**: Frontend & backend auto-reload during development
- **Type Safety**: Full TypeScript + Pydantic validation
- **RESTful API**: Auto-generated Swagger docs at `/docs`
- **Background Processing**: Non-blocking ML training with FastAPI tasks

---

## 🏗️ Architecture

```
┌─────────────────────────┐         ┌──────────────────────────┐
│   Frontend (Next.js)    │         │   Backend (FastAPI)      │
│   • React 19 + TS       │ ◄────► │   • SQLAlchemy ORM       │
│   • Tailwind CSS 4      │  HTTP  │   • scikit-learn Engine  │
│   • Recharts Viz        │        │   • Background Workers   │
│   • Axios Client        │        │   • Pydantic Validation  │
└─────────────────────────┘         └──────────────────────────┘
         :3000                                 :8000
           │                                     │
           └──────────── Docker Network ─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  SQLite Database  │
                    │  (Persistent Vol) │
                    └───────────────────┘
```

**Technology Stack:**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 + TypeScript | Server-side rendering, routing, type safety |
| UI Framework | Tailwind CSS 4 | Utility-first styling, dark mode |
| Charts | Recharts | Interactive line charts for metrics |
| Backend | FastAPI + Python 3.11 | High-performance async API |
| ML Engine | scikit-learn 1.4 | 9 classification algorithms |
| ORM | SQLAlchemy | Database abstraction, migrations |
| Data Processing | Pandas + NumPy | CSV parsing, preprocessing |
| Database | SQLite / PostgreSQL | Experiment tracking |
| Deployment | Docker + Docker Compose | Containerization, orchestration |

---

## 🚀 Quick Start

### **Option 1: Docker (Recommended)**

```bash
# Clone repository
git clone https://github.com/yourusername/catalyst-flow-ml.git
cd catalyst-flow-ml

# Start all services
docker-compose up --build

# Access application
# 🌐 Frontend: http://localhost:3000
# 🔧 API Docs: http://localhost:8000/docs
# 📊 Backend: http://localhost:8000
```

**That's it!** The entire stack is now running.

### **Option 2: Manual Setup**

**Prerequisites:** Python 3.11+, Node.js 20+

```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

---

## 📖 How to Use

### **1️⃣ Create New Experiment**
1. Navigate to dashboard → **"New Experiment"**
2. Upload CSV dataset (last column = target variable)
   - Supports: numeric, categorical, missing values
   - Auto-handles: encoding, scaling, imputation
3. Select one of 9 ML algorithms

### **2️⃣ Configure Hyperparameters**
**Hybrid Tuning System:**
- **Tunable**: 2-3 critical parameters per model (e.g., `n_estimators`, `learning_rate`)
- **Fixed**: Optimized defaults visible but locked
- **Smart Ranges**: Min/max validation prevents invalid configs

**Example Configs:**
- **RandomForest**: Trees (10-500), Max Depth (3-50)
- **Neural Net**: Learning Rate (0.0001-0.1), Epochs (10-500), Hidden Layers (Small/Medium/Large)
- **SVM**: C Regularization (0.01-100), Kernel (RBF/Linear/Poly)

### **3️⃣ Monitor Training**
Watch real-time charts update:
- **Accuracy Chart**: Train vs Test curves (detect overfitting)
- **Loss Chart**: Train vs Test log loss
- **Performance Metrics**: F1, Precision, Recall

Polls every 2 seconds for new data.

### **4️⃣ Compare Results**
Switch to **"Comparison"** tab:
- Select metric: Accuracy, F1, Loss, etc.
- See ranked leaderboard with 🥇🥈🥉 badges
- Click any run for detailed breakdown

---

## 📁 Project Structure

```
catalyst-flow-ml/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes & endpoints
│   │   ├── worker.py        # ML training engine (240 lines)
│   │   ├── models.py        # SQLAlchemy DB models
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── database.py      # DB session & connection
│   │   └── __init__.py
│   ├── datasets/            # Uploaded CSV storage
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Backend container
│   └── .dockerignore
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Dashboard (tabs: Recent + Comparison)
│   │   ├── layout.tsx       # Root layout
│   │   ├── new/
│   │   │   └── page.tsx     # Experiment creation UI (700+ lines)
│   │   └── runs/[id]/
│   │       └── page.tsx     # Run details with live charts
│   ├── components/
│   │   └── ui/              # Card, Modal, etc.
│   ├── lib/
│   │   └── utils.ts         # Tailwind utility functions
│   ├── package.json
│   ├── next.config.ts       # Next.js config (standalone output)
│   ├── tailwind.config.ts
│   ├── Dockerfile           # Multi-stage frontend build
│   └── .dockerignore
├── docker-compose.yml       # Orchestration for both services
├── .dockerignore            # Root ignore patterns
└── README.md                # This file
```

**Key Files:**
- [`backend/app/worker.py`](backend/app/worker.py): Core ML training logic with incremental visualization
- [`frontend/app/new/page.tsx`](frontend/app/new/page.tsx): Model selection + hyperparameter UI
- [`frontend/app/page.tsx`](frontend/app/page.tsx): Dashboard with comparison system

---

## 🎯 Unique Features

### **1. Incremental Training Visualization**
Unlike typical ML platforms that show only final results:
- **Neural Networks**: Train 1 epoch at a time, update charts live
- **Random Forest**: Grow trees from 5 → 100, visualize incremental improvement
- **Other Models**: Use learning curves (train on 10% → 100% of data)

**Why?** Provides visual feedback, helps detect overfitting early, makes ML training transparent.

### **2. Educational Dual-Context System**
Every algorithm includes **two explanations**:
1. **Technical**: Proper ML terminology (e.g., "margin maximization", "ensemble voting")
2. **Kitchen Analogy**: Relatable metaphor (e.g., "SVM = Strict Food Critic seeking safety margins")

**Target Audience:** Both ML engineers and non-technical stakeholders.

### **3. Hybrid Hyperparameter Design**
**Problem:** Too many parameters overwhelm users; too few limit power users.

**Solution:** Expose 2-3 critical parameters, fix others with research-backed defaults.

**Example - Random Forest:**
- ✅ **Tunable**: `n_estimators`, `max_depth` (80% of performance impact)
- 🔒 **Fixed**: `criterion='gini'`, `min_samples_split=2`, etc.

### **4. Medal-Based Comparison**
Experiments ranked with Olympic-style medals (🥇🥈🥉) based on selected metric:
- Descending: Accuracy, F1, Precision, Recall
- Ascending: Loss metrics

Makes identifying best models instant.

---

## 🐳 Docker Deep Dive

### **Backend Dockerfile**
```dockerfile
FROM python:3.11-slim       # Minimal base image
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p datasets       # Persistent upload directory
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### **Frontend Dockerfile (Multi-Stage)**
```dockerfile
# Stage 1: Install deps
FROM node:20-alpine AS deps
COPY package.json .
RUN npm ci

# Stage 2: Build app
FROM node:20-alpine AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine AS runner
COPY --from=builder /app/.next/standalone ./
CMD ["node", "server.js"]
```

**Benefits:**
- ✅ Final image: ~150MB (vs 1GB+ without multi-stage)
- ✅ Security: No build tools in production
- ✅ Speed: Cached layer reuse

### **docker-compose.yml**
- **Networks**: Custom bridge for inter-service communication
- **Volumes**: Persistent DB + dataset storage
- **Restart Policies**: Auto-restart on crashes
- **Hot Reloading**: Source code mounted for development

---

## 🔧 Configuration

### **Environment Variables**

Create `.env` files (not tracked in git):

**Backend `.env`:**
```bash
DATABASE_URL=sqlite:///./data/ml_experiments.db
# Or for PostgreSQL:
# DATABASE_URL=postgresql://user:pass@localhost/dbname
```

**Frontend `.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### **Switching to PostgreSQL**

1. Update `docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ml_experiments
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: changeme
    volumes:
      - postgres-data:/var/lib/postgresql/data
```

2. Update `backend/app/database.py`:
```python
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://admin:changeme@postgres/ml_experiments"
)
```

---

## 📊 Supported Datasets

**Requirements:**
- Format: CSV
- Target: Last column
- Features: Any mix of numeric/categorical
- Missing Values: Handled automatically (mean imputation)

**Examples:**
- Customer churn prediction (binary classification)
- Image classification (multi-class with extracted features)
- Fraud detection (imbalanced classes)
- Medical diagnosis (categorical + continuous features)

**Preprocessing Pipeline:**
1. Label encode categorical features
2. Mean impute missing values
3. StandardScaler normalization
4. 70/15/15 train/val/test split

---

## 🚧 Roadmap

### **Phase 1: Core ML** ✅
- [x] 9 classification algorithms
- [x] Real-time metric tracking
- [x] Experiment comparison
- [x] Docker deployment

### **Phase 2: Advanced Features** 🚧
- [ ] Model export/download (.pkl files)
- [ ] Regression support (not just classification)
- [ ] Auto hyperparameter tuning (GridSearch/RandomSearch)
- [ ] Confusion matrix & ROC curves
- [ ] Feature importance visualization

### **Phase 3: Collaboration** 📅
- [ ] User authentication (JWT)
- [ ] Team workspaces
- [ ] Experiment sharing (public URLs)
- [ ] Model versioning (git-like)
- [ ] Jupyter notebook integration

### **Phase 4: Production** 🎯
- [ ] Model serving API
- [ ] A/B testing framework
- [ ] Monitoring & alerting
- [ ] Cloud deployment (AWS/GCP/Azure)
- [ ] CI/CD pipeline

---

## 🤝 Contributing

This is a portfolio project, but improvements are welcome!

**To contribute:**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

MIT License - Free to use for personal/commercial projects.

---

## 🎓 Skills Demonstrated

This project showcases expertise in:

| Category | Skills |
|----------|--------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts, Server-Side Rendering |
| **Backend** | FastAPI, Python 3.11, SQLAlchemy, Pydantic, RESTful APIs, Background Tasks |
| **Machine Learning** | scikit-learn, 9 algorithms, hyperparameter tuning, train/val/test splits, metric tracking |
| **Data Engineering** | Pandas, NumPy, CSV processing, encoding, scaling, imputation |
| **DevOps** | Docker, Docker Compose, multi-stage builds, volume management, networking |
| **Database** | SQLAlchemy ORM, SQLite, migrations, relationship modeling |
| **Architecture** | Full-stack design, API design, real-time data flow, component patterns |
| **UI/UX** | Dark mode, interactive visualizations, educational design, responsive layouts |

---

## 💼 For Recruiters

**Why This Project Stands Out:**

1. **Production-Ready**: Fully Dockerized, can deploy anywhere in minutes
2. **Educational Value**: Unique dual-context explanations system
3. **Real-Time Features**: Live training visualization (not just static results)
4. **Full-Stack Breadth**: Modern frontend + robust backend + ML engineering
5. **Clean Code**: TypeScript types, Pydantic schemas, proper separation of concerns
6. **UX Thinking**: Medal ranking, tabbed interface, hybrid hyperparameter design

**Key Talking Points:**
- "Built a platform that makes ML training transparent through real-time visualization"
- "Designed a hybrid hyperparameter system balancing simplicity and power"
- "Implemented educational dual-context explanations for technical and non-technical users"
- "Engineered incremental training strategies for 9 different ML architectures"
- "Dockerized entire stack with multi-stage builds and persistent storage"

---

## 📧 Contact

**Built by:** [Your Name]  
**LinkedIn:** [Your LinkedIn URL]  
**GitHub:** [Your GitHub URL]  
**Email:** [your.email@example.com]

---

<div align="center">

### ⭐ Star this repo if it helped you learn!

**Made with ❤️ and scikit-learn**

</div>
