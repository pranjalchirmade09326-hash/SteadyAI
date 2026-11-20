# SteadyAI 🥗🏃

### AI-Native Preventive Health, Nutrition & Community Coaching Platform

**SteadyAI** is an AI-assisted community health and habit-formation platform designed to support sustainable preventive wellness, personalized nutrition logging, and non-intrusive accountability.

The platform bridges the gap between solitary health trackers and expensive personal trainers by uniting members in small accountability pods around structured 30-day challenges, powered by contextual AI micro-education, automated multimodal meal vision, and trust-first wellness commerce.

---

## ✨ Key Features

- **Accountability Pods:** Automated placement into small, supportive 4–6 person peer cohorts to sustain long-term consistency.
- **Multimodal AI Nutrition Vision:** Snap a photo or type a meal description to get instant, accurate macro estimations and positive feedback via Gemini 2.0 Flash & OpenAI.
- **30-Day Consistency Reset:** Low-friction daily micro-task check-ins (`Completed`, `Partial`, `Skipped`) with zero guilt or punitive streaks.
- **Contextual AI Educator:** 60-second evidence-based lessons with scientific citations triggered only when relevant to member questions.
- **Autonomous Task Agents:** Specialized agents for 3-day meal planning, grocery consolidation, habit reflection, and community guidance.
- **Model Context Protocol (MCP):** Privacy-first JSON-RPC data layer providing sanitized user summaries to tools without exposing sensitive PII.
- **Human Coach Dashboard:** High-efficiency triage queues for certified coaches to review client photos and dispatch feedback in seconds.
- **Trust-First eCommerce:** Curated supplements and meal replacements with transparent dosages, citations, and explicit "Who it is NOT for" guidelines.

---

## 🛠️ Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **TypeScript / Node.js 20+** | Strictly typed backend and frontend development |
| **Fastify 5.x** | High-throughput asynchronous REST API & MCP server |
| **Next.js 15 & React 19** | Responsive web application with Tailwind CSS |
| **React Native & Expo 57** | Cross-platform iOS and Android mobile app |
| **PostgreSQL 16** | ACID-compliant relational database (Port 5435 / 5432) |
| **Prisma 6** | Type-safe ORM, data modeling (32 models), and migrations |
| **AI / Multimodal LLMs** | Gemini 2.0 Flash (Primary), OpenAI GPT-4o-mini, Groq Llama 3.3 |
| **Model Context Protocol (MCP)** | Standardized protocol for agentic context and tool invocation |
| **Docker & Docker Compose** | Local database containerization and production deployment |

---

## 🏗️ Architecture

The project follows a decoupled, 5-layer architecture separating client presentation, API routing, AI orchestration, data context federation, and relational persistence.

### Core Workflow
$$\text{Onboard} \longrightarrow \text{Goal Profile} \longrightarrow \text{Pod Placement} \longrightarrow \text{Daily Challenge} \longrightarrow \text{Multimodal Meal Log} \longrightarrow \text{AI Coaching} \longrightarrow \text{Peer Support} \longrightarrow \text{Progress Track}$$

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or v20+)
- **npm** or **pnpm**
- **Docker Desktop** (for local PostgreSQL database)
- **Git**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/OpenHealthAgents/SteadyAI.git
cd SteadyAI

# 2. Configure environment variables
# Copy .env configuration (pre-configured for local development)
cp .env.production.example .env

# 3. Install dependencies
npm install

# 4. Generate Prisma client
npx prisma generate
```

### Starting the Application

#### Option A: 1-Click Launchers (Windows)
```bat
:: 1. Start PostgreSQL Database container (Port 5435)
start-db.bat

:: 2. Launch Backend (Port 3000), Web (Port 3001), and Mobile Preview (Port 8081)
run-steadyai.bat
```

#### Option B: Manual Terminal Execution
```bash
# Terminal 1: Start PostgreSQL via Docker
docker run -d --name steadyai-postgres -p 5435:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=steadyai postgres:16-alpine

# Terminal 2: Run Prisma Migrations & Start Backend API (Port 3000)
npx prisma migrate dev
npm run dev

# Terminal 3: Start Web Application (Port 3001)
cd frontend/web
npm install
npm run dev

# Terminal 4: Start Mobile App Web Preview (Port 8081)
cd frontend/mobile
npm install
npm run web
```

### Accessing the Platform

| Service | Interface | Local URL |
| :--- | :--- | :--- |
| **Web Portal** | Next.js Frontend | [http://localhost:3001](http://localhost:3001) |
| **Mobile App** | Expo Web Preview | [http://localhost:8081](http://localhost:8081) |
| **Backend API** | Fastify REST Engine | [http://localhost:3000](http://localhost:3000) |
| **API Health Check** | System Status | [http://localhost:3000/api/health](http://localhost:3000/api/health) |
| **MCP Server** | Model Context Protocol | [http://localhost:3000/mcp](http://localhost:3000/mcp) |
| **Prisma Studio** | Visual Database Browser | `npx prisma studio` ([http://localhost:5555](http://localhost:5555)) |

---

## 🧪 Testing & Validation

```bash
# Run TypeScript compilation check
npm run typecheck

# Run End-to-End (E2E) feature verification
npm run test:e2e

# Run Model Context Protocol (MCP) tool tests
npm run test:mcp

# Run Integration tests
npm run test:integration
```

---

## 🔐 Health & AI Safety

- **Non-Diagnostic:** SteadyAI is designed for lifestyle, habit consistency, and preventive nutrition support. It does not provide medical diagnoses or prescribe medications.
- **Human-in-the-Loop:** Clinical and complex health queries are routed to certified human coaches via dedicated review queues.
- **Evidence-Based Guardrails:** AI educator micro-lessons include scientific citations and clear, non-judgmental disclaimers.
- **Privacy-First Data Minimization:** Autonomous agents interact through sanitized MCP summaries rather than unindexed raw user database records.

---

## 📂 Project Structure

```text
SteadyAI/
├── frontend/
│   ├── web/                  # Next.js 15 Web Portal (Port 3001)
│   ├── mobile/               # React Native / Expo Mobile App (Port 8081)
│   └── android/              # Native Android application
├── prisma/
│   └── schema.prisma         # PostgreSQL schema (32 models, 24 enums)
├── refactoragent/            # Agent toolchains, speech, and analysis modules
├── src/                      # Fastify backend application (Port 3000)
│   ├── agents/               # Meal Planning, Habit Coach & Community Guide agents
│   ├── config/               # Environment & app configuration
│   ├── db/                   # Prisma database client instance
│   ├── mcp/                  # Model Context Protocol tools & services
│   ├── middleware/           # JWT authentication & RBAC middleware
│   ├── routes/               # API route controllers (Auth, Challenges, Nutrition, Store)
│   ├── scripts/              # Seed & exercise media asset scripts
│   ├── services/             # Nutrition AI vision, LLM adapters, business services
│   ├── types/                # TypeScript declaration extensions
│   ├── utils/                # Helper utilities
│   ├── app.ts                # Fastify app builder
│   └── server.ts             # Server entrypoint
├── .env                      # Local environment configuration
├── docker-compose.yml        # Multi-service container orchestration
├── Dockerfile.backend        # Backend container specification
├── Dockerfile.web            # Web frontend container specification
├── package.json              # Project dependencies & npm scripts
├── tsconfig.json             # TypeScript compiler configuration
├── run-steadyai.bat          # 1-Click launcher for Backend, Web & Mobile
└── start-db.bat              # 1-Click launcher for PostgreSQL container
```

---

## 📜 Open-Source Attribution & References

- **Community & Platform Blueprint:** [SteadyAI Architecture Blueprint](https://chatgpt.com/share/699cce9a-633c-8002-bc5a-fd98990894ff)
- **Model Context Protocol:** [Anthropic MCP Specifications](https://modelcontextprotocol.io/)
- **Documentation Suite:** Available in [`docs/`](./docs/)

---

## ⚠️ Disclaimer

This platform is intended for preventive health support, nutrition awareness, habit formation, and demonstration purposes. It is not a substitute for professional medical advice, diagnosis, or clinical treatment. Always consult qualified healthcare professionals for medical conditions.

---

**Project:** SteadyAI  
**Focus:** Preventive Wellness • Community Accountability • AI Nutrition Vision • 30-Day Consistency Cohorts • Trust-First Commerce
