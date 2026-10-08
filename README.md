# ⚡ APTITUDE ARENA

> **"Practice aptitude. Compete live. Get placement-ready."**

A production-ready, real-time multiplayer aptitude and logical reasoning competition platform engineered for college students, university placement cells, and campus recruitment drives.

Aptitude Arena transforms solitary multiple-choice question practice into high-stakes, synchronized competitive rounds supporting 50–100+ concurrent players per arena room with a server-authoritative engine, live leaderboards, tactical power-ups, collegiate leagues, and automated anti-cheat defenses.

---

## 🏛️ Real-Time Multiplayer Engine Architecture

### 1. Server is the Sole Referee
The server is completely authoritative:
- **Never Trusts Browser Timers:** All deadlines and countdowns are determined by high-precision server epoch timestamps (`serverStartTime`, `serverEndTime`).
- **Never Trusts Browser Scores or Submissions:** Scores, streaks, speed bonuses, and ranks are calculated exclusively by the server.
- **Never Leaks Correct Answers:** The `isCorrect` flag is stripped before questions are broadcast. Correct answers and step-by-step explanations are revealed only after the server closes the active question round.
- **Client is a Display Layer:** The browser merely renders the server state and emits intent actions (`answer:submit`, `room:join`).

```
[Student Browser]                 [Aptitude Arena Engine]
       │                                     │
       │─── 1. socket: room:join ───────────>│ (Validates PIN, generates session token)
       │<── 2. ack: room:state ──────────────│ (Sends lobby state with player list)
       │                                     │
       │                                [Host clicks Start]
       │<── 3. broadcast: game:starting ─────│ (Synchronized 4-second countdown)
       │                                     │
       │<── 4. direct: question:start ───────│ (Options scrambled uniquely for player)
       │                                     │
       │─── 5. emit: answer:submit ─────────>│ (Timestamp verified against deadline)
       │<── 6. ack: answer:result ───────────│ (Points + speed bonus calculated)
       │                                     │
       │<── 7. broadcast: question:reveal ───│ (Solution revealed + Cohort histogram)
       │<── 8. broadcast: leaderboard ───────│ (Rank deltas ↑/↓ computed server-side)
```

### 2. Room Lifecycle State Machine
Every competition room progresses through a strictly defined lifecycle:
1. `WAITING`: Players join the lobby via 6-character room PIN. Live grid updates as cadets join. Host inspects player readiness and squad balance.
2. `STARTING`: Host initiates the round. Server performs validation (questions exist, $\ge 1$ player present, room not already running) and initiates a synchronized 4-second countdown across all connected sockets.
3. `QUESTION_ACTIVE`: The server broadcasts the question to all players simultaneously with per-player randomized options. Tickers broadcast remaining time every second. Answers are accepted until server deadline or early completion.
4. `QUESTION_REVEAL`: Server locks the question, evaluates results, distributes personal feedback to each cadet, broadcasts the correct solution and question explanation, and renders live cohort answer distribution histograms.
5. `LEADERBOARD`: Intermission screen computing live standings with rank movement deltas (`↑ climbed`, `↓ dropped`, `— unchanged`).
6. `FINISHED`: Concludes match with podium honors, overall accuracy, speed metrics, and topic-wise diagnostics.

### 3. Synchronized Questions & Per-Player Option Shuffling
- **Simultaneous Question Delivery:** All players receive questions at the same server timestamp.
- **Anti-Peeking Option Shuffling:** To prevent students sitting adjacent to each other in campus computer labs from copying by option position (e.g., "choose B"), every player receives options in a unique randomized permutation:
  - Player A sees options in order: `[Option 3, Option 1, Option 4, Option 2]`
  - Player B sees options in order: `[Option 2, Option 4, Option 1, Option 3]`
  - The server maps the player's displayed selection back to the authoritative option ID before validation.

### 4. Network Delay Fairness Strategy
> *"If two players answer at approximately the same real-world time, network delay should not unfairly decide the winner."*

- **Server Receipt Timestamp:** The official recorded time of submission is `serverReceivedAt = Date.now()`.
- **Bounded Jitter Window (`MAX_NETWORK_GRACE_MS = 250ms`):** A strictly bounded 250ms grace threshold accommodates network packet travel time without allowing late answer exploitation. Submissions arriving beyond `serverEndTime + 250ms` are rejected with `Late answer`.
- **Speed Ratio Calculation:** Response time is evaluated relative to the question duration:
  $$\text{speedRatio} = \max\left(0, \min\left(1, \frac{\text{remainingTimeMs}}{\text{totalQuestionTimeMs}}\right)\right)$$
- **Equal Treatment:** All players in the room are measured against identical server clock boundaries.

### 5. Scoring System
- **Correct Answer:**
  - Base Points = `100 pts`
  - Speed Bonus = up to `+100 pts` based on the fraction of time remaining
  - Formula:
    $$\text{Score} = 100 + \text{round}(100 \times \text{speedRatio})$$
  - Fast correct answer: $\approx 200 \text{ points}$
  - Slow correct answer: $\approx 100 \text{ points}$
- **Wrong / Unanswered:** `0 points` (streak resets to 0, no negative deduction to keep placement practice constructive).
- **Tie-Breaker Hierarchy:**
  1. Total Score (descending)
  2. Number of Correct Answers (descending)
  3. Cumulative Response Time (ascending)

### 6. Early Question End
If **every active connected player** in the room has locked in their answer before the timer runs out, the server terminates the question immediately, bypassing idle waiting and advancing directly to `QUESTION_REVEAL`.

### 7. Fault-Tolerant Reconnection & Disconnect Handling
- **Non-Blocking Disconnects:** A player dropping connection does not pause or disrupt the match for remaining players. The player is marked `connected = false`.
- **Secure Reconnect Tokens:** Upon joining, each student receives an ephemeral `reconnectToken` persisted in session storage.
- **State Recovery:** When a disconnected student reopens the page or reconnects on a new socket:
  - The server re-authenticates them via token and maps the new socket ID.
  - If a question is currently active, the player receives the remaining server time and their specific option permutation.
  - If they already answered before dropping, their selected option is restored in a locked state.
  - Scores, streaks, and previous answers are preserved.
  - Verified by automated end-to-end test suite (`tests/reconnection-flow.test.ts`).

### 8. Spectator Mode & Projector Fullscreen
Enables auditorium projectors or faculty observers to join via `?spectator=true`.
- **Projector Fullscreen Mode:** One-click toggle entering distraction-free high-contrast display designed for 1080p and 4K auditorium projectors.
- **Information Security:** Correct answers and explanations are strictly hidden from spectators until the reveal phase.
- **Audience Insight:** Real-time answer submission counters, cohort distribution bars, and team battle progress.

---

## 📊 50+ Player Multi-Tier Concurrency Benchmark

The repository contains a reusable, automated load testing suite measuring real server throughput and latency across **50, 75, and 100 concurrent players**.

Run the benchmark anytime:
```bash
npm run benchmark
```

### Actual Benchmark Performance Matrix (Measured Data)

| Concurrent Players | Connection Success | Avg Join Latency | Q-Dispatch Latency | Answer Validation | Leaderboard Sorting | Engine Throughput | Heap Delta | Result |
|:------------------:|:------------------:|:----------------:|:------------------:|:-----------------:|:-------------------:|:-----------------:|:----------:|:------:|
| **50 Players**     | 100.0% (50/50)     | 0.016 ms         | 1.436 ms           | 0.038 ms          | 0.273 ms            | 12.1 ops/sec      | +1.85 MB   | ✅ PASS |
| **75 Players**     | 100.0% (75/75)     | 0.007 ms         | 0.272 ms           | 0.025 ms          | 0.083 ms            | 18.3 ops/sec      | -1.73 MB   | ✅ PASS |
| **100 Players**    | 100.0% (100/100)   | 0.010 ms         | 1.257 ms           | 0.014 ms          | 0.088 ms            | 24.4 ops/sec      | -0.25 MB   | ✅ PASS |

- **Fault Tolerance:** 10% of players dropped mid-match; room progression continued with 0 pauses or packet drops.
- **Reconnection Rate:** 100% of disconnected players successfully re-authenticated via secure tokens with scores intact.
- **Cumulative Errors:** 0 across all 3 tiers.

---

## 🛡️ Server-Authoritative Anti-Cheat & Security Protections

Aptitude Arena enforces active technical defenses verified by `tests/security-anti-cheat.test.ts`:

1. **Client Score Rejection:** The answer submission payload accepts only `roomCode`, `socketId`, `questionId`, and `displayedOptionId`. Points and score deltas are strictly calculated by the server.
2. **Client Timer Rejection:** Local browser clocks are completely ignored. Question deadlines are enforced via server epoch timestamps.
3. **Answer Replay Protection:** Attempting to submit a second answer for the same question throws `Duplicate answer: You have already submitted an answer for this question.`
4. **Late Answer Rejection:** Submissions arriving after `serverEndTime + 250ms` are rejected with `Late answer: Submission arrived after server question deadline.`
5. **Premature Answer Rejection:** Packets timestamped prior to `serverStartTime` are rejected with `Invalid submission timing: submission arrived before question start time.`
6. **Impossible Human Reaction Time Detection:** Responses arriving in under **120 milliseconds** are flagged as automated bot scripts / packet replay.
7. **Rate Limiting:** Minimum 150ms interval between actions to block automated flood tools.
8. **Unauthorized Host Protection:** Non-host sockets attempting to call `startGame` or reveal questions are rejected with security audit logging.
9. **Power-Up Quota Enforcement:** Client-side power-up duplication is impossible; usage counters and question active states are validated server-side.
10. **Structured Security Audit Trail:** All violations are logged through `logger.security()` with actor ID, socket ID, room code, and reason.

---

## ♿ Accessibility & Low-Data Mode

- **Low-Data Mode / Data Saver:**
  - One-click toggle in the header and mobile navigation.
  - Automatically suppresses heavy background animations, CSS blur filters, and glowing aurora backdrops.
  - Minimizes payload re-renders and smooths execution on slow hostel Wi-Fi and mobile networks.
- **WCAG Compliance (No Color Alone):**
  - All question options, feedback alerts, and leaderboards use explicit text labels and universal icons (`CheckCircle2` `✓` and `XCircle` `✕`) alongside color indicators.
  - Screen reader support with `aria-label`, `aria-checked`, and hidden `sr-only` descriptive strings.
  - High-contrast focus rings (`:focus-visible`) for complete keyboard navigation.

---

## 📜 Public Game Rules & Fair Play Charter (`/rules`)

Students and faculty can review official competition regulations anytime at [`/rules`](http://localhost:3000/rules):
- Server-authoritative referee explanations
- Base points, speed bonus decay curve, and tiebreaker hierarchy
- Tactical power-up rules and quotas
- Team battle mechanics
- College league ranking formula
- Anti-cheat and fair play policies

---

## 🏆 Competitive Aptitude Ecosystem

### 1. Collegiate League Rules & Fair Ranking Formula
Aptitude Arena prevents student volume-spamming from beating genuine cognitive skill:

$$\text{League Score} = \left( \sum_{i=1}^{\min(N, 20)} \text{score}_i \times 0.95^{i-1} + \min(600, \lfloor 50 \times \ln(1 + \max(0, N - 20)) \rfloor) \right) \times \sqrt{\frac{\text{Avg Accuracy}}{100}}$$

- **Top 20 Best Games:** Only your best 20 competitive matches contribute primary points, with an exponential decay factor ($0.95^{i-1}$) rewarding peak scores.
- **Logarithmic Activity Bonus:** Games played beyond 20 earn diminishing returns via a logarithmic function capped at 600 points.
- **Accuracy Multiplier:** Your aggregate accuracy directly multiplies your total score ($\sqrt{\text{Accuracy} / 100}$). A cadet with 20 high-accuracy rounds will consistently outscore an account with 500 spam rounds at 35% accuracy.

### 2. Seasons & Rollover System
- **Seasonal Lifecycles:** Each competitive season has a strictly defined start and end date (e.g., *Season 1: Autumn 2026*).
- **Season Freeze:** When a season concludes, standings freeze into permanent immutable `SeasonSnapshot` records.
- **Season Rollover:** New seasons start with fresh ladder points while preserving all lifetime profile achievements and historical season records.

### 3. Team Battles (`TEAM_BATTLE` Mode)
- **Squad Size:** Teams consist of **3 to 5 players** (e.g., *Team Alpha: CS & IT* vs *Team Beta: Mech & ECE*).
- **Squad Assignment:** Players join their preferred team in the lobby or hosts can enable auto-balancing.
- **Scoring:** The team score equals the sum of valid points earned by all connected squad members during each question.
- **Live Leaderboards:** Both team standings and individual cadet podiums are broadcast in real time.

### 4. Daily Challenge & Streak System
- **Synchronized Daily Quiz:** Every day at 00:00 UTC, a fresh 10-question aptitude challenge is activated. All students nationwide receive the identical question set on that day.
- **Anti-Spam Ranked Policy:** **Only your first attempt of the day counts toward the official leaderboard.** Subsequent attempts on the same day are recorded as practice rounds.
- **Consecutive Streak Tracking:**
  - Participating on consecutive days increases your active streak (e.g. 🔥 **7-Day Streak**).
  - A 24-to-48 hour grace period prevents accidental resets due to timezone differences.
  - Milestone badges unlock at **7**, **14**, and **30** days with bonus XP.

### 5. Specialized Topic Leagues
Students compete on dedicated topic ladders:
- **Quantitative Aptitude League**
- **Logical Reasoning League**
- **Verbal Ability League**
- **Data Interpretation League**
- **General Reasoning League**

### 6. Tactical Power-Ups & Quotas
During active questions, cadets can activate up to 3 tactical power-ups per match:
1. **`DOUBLE_POINTS` (2x Points):** Multiplies points for the current question by $2\times$ if answered correctly.
2. **`REMOVE_TWO` / `FIFTY_FIFTY`:** Eliminates two incorrect options from the student's display.
3. **`TIME_FREEZE` (+5s):** Grants +5.0 seconds of bonus grace time on the active question countdown.
4. **`SECOND_CHANCE` (Shield):** Protects against the first incorrect selection, allowing 1 retry before the timer expires.
- **Strict Quotas:** Maximum 1 use of each power-up per match, and maximum 3 total power-up activations per match.

### 7. Adaptive Difficulty Engine
When a host enables Adaptive Mode, the game engine monitors the collective cohort in real time:
- **Escalate Tier ($\text{EASY} \rightarrow \text{MEDIUM} \rightarrow \text{HARD} \rightarrow \text{EXPERT}$):**
  Triggered when room accuracy $\ge 75\%$ and average response time is $\le 55\%$ of the allowed limit.
- **Reduce Tier ($\text{EXPERT} \rightarrow \text{HARD} \rightarrow \text{MEDIUM} \rightarrow \text{EASY}$):**
  Triggered when room accuracy $\le 40\%$ or average response time exceeds $\ge 85\%$ of the limit.
- Higher difficulty questions award proportionally higher points (Easy: 100 pts, Medium: 150 pts, Hard: 200 pts, Expert: 300 pts).

### 8. Player Progression & Leveling Formula
- **Level Curve:**
  $$\text{Level} = 1 + \left\lfloor \sqrt{\frac{\text{XP}}{100}} \right\rfloor$$
- **Competitive Rank Tiers:**
  - **BRONZE:** Levels 1 – 4
  - **SILVER:** Levels 5 – 9
  - **GOLD:** Levels 10 – 19
  - **PLATINUM:** Levels 20 – 29
  - **DIAMOND:** Levels 30 – 44
  - **ARENA MASTER:** Levels 45+
- **Achievements:** 10 core medals including *First Win*, *Decathlete (10 Games)*, *Centurion (100 Correct)*, *Speed Demon (<3s Answer)*, *Flawless Cadet (100% Match Accuracy)*, and *Week of Steel (7-Day Streak)*.

---

## 📝 Question Authoring & Faculty Analytics

### 1. Question Set Authoring Suite (`/questions/new`)
- **Rich Question Creator:** Supports Question text, 4–6 options, correct answer toggle, step-by-step explanation, topic tags, difficulty tier, time limit (5–120s), and point weight.
- **Structured Table Builder:** Create rows and columns for Data Interpretation puzzles with mobile-responsive horizontal scrolling.
- **Diagram Image Uploader:** File-type validation (`image/png`, `image/jpeg`, `image/webp`) and size limits ($< 2\text{MB}$) to eliminate malicious uploads.
- **Drag-and-Drop Reordering:** Server-authoritative reordering persisted to PostgreSQL.
- **Full Question Preview Modal:** Simulates exact gameplay environment with countdown timer and interactive option selection before publishing.
- **CSV & JSON Bulk Import:** Upload formatted question banks with comprehensive field validation and inline error reporting.

### 2. Faculty Placement Analytics (`/faculty/analytics`)
- Cohort accuracy distributions across Quantitative, Logical, Verbal, and Data Interpretation.
- Topic weakness diagnostics flagging students at risk of missing campus recruitment aptitude cutoffs.
- CSV report exporting for training & placement cell documentation.

---

## 🔭 Observability, Logging & Caching

- **Structured Logger (`src/lib/logger.ts`):** Leveled JSON output (`DEBUG`, `INFO`, `WARN`, `ERROR`, `SECURITY`) with correlation IDs, room codes, actor IDs, and anti-cheat incident reporting.
- **In-Memory TTL Cache (`src/lib/cache.ts`):** High-speed in-memory caching with automatic eviction interval, stats reporting, and zero memory leaks.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling & UI System** | Tailwind CSS, Lucide Icons, Custom Accessible Component Library |
| **Real-Time Multiplayer** | Socket.IO 4.x, Server-Authoritative Game Engine |
| **Backend & API** | Node.js, Next.js Route Handlers, Session Cookies |
| **Database & ORM** | PostgreSQL, Prisma ORM 5.x |
| **Authentication & RBAC** | Password Hashing (bcrypt), Signed JWT Sessions, HTTP-only Cookies |
| **Validation** | Zod Schemas |
| **Testing** | Vitest (10 Test Files, 96 Automated Tests) |
| **Load Testing** | Custom Multi-Tier Concurrency Benchmark (50, 75, 100 Players) |
| **Observability** | Leveled Structured JSON Logger, In-Memory TTL Cache |
| **DevOps & CI/CD** | Docker, Docker Compose, GitHub Actions CI Workflow |

---

## 📁 Project Structure

```
aptiquiz/
├── prisma/
│   ├── schema.prisma             # Complete PostgreSQL schema (21 models + enums)
│   └── seed.js                   # Development seed script
├── server.ts                     # Custom Node server combining Next.js & Socket.IO
├── src/
│   ├── app/                      # Next.js App Router (28 routes)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx    # Sign in with quick-fill demo buttons
│   │   │   └── register/page.tsx # Student/Host registration
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx        # Dashboard layout with persistent sidebar
│   │   │   ├── dashboard/page.tsx# Cadet performance metrics & diagnostics
│   │   │   ├── daily/page.tsx    # Synchronized daily challenge & streak counter
│   │   │   ├── host/page.tsx     # Host portal & session manager
│   │   │   ├── questions/page.tsx# Syllabus & question sets library
│   │   │   ├── questions/new/    # Question authoring & CSV import
│   │   │   ├── league/page.tsx   # College vs College rankings & standings
│   │   │   ├── profile/page.tsx  # XP level, rank tiers & achievement medals
│   │   │   ├── faculty/analytics/# Placement cell diagnostic analytics
│   │   │   └── admin/page.tsx    # Super Admin platform console
│   │   ├── join/page.tsx         # Fast PIN entry portal
│   │   ├── rules/page.tsx        # Official Arena Rules & Fair Play Charter
│   │   ├── rooms/[code]/lobby/   # Live lobby, squad picker & player grid
│   │   ├── rooms/[code]/play/    # Synchronized arena gameplay & projector mode
│   │   ├── api/                  # Secure REST API endpoints
│   │   ├── globals.css           # Dark palette, Low-Data Mode & focus indicators
│   │   └── layout.tsx            # Global layout with AuthProvider & LowDataProvider
│   ├── components/
│   │   ├── ui/                   # Reusable UI component library (10 components)
│   │   ├── layout/               # Navbar, Sidebar, Footer
│   │   ├── game/                 # Timer, QuestionCard, OptionCard, Leaderboard, LobbyDisplay
│   │   ├── question/             # CSV Importer, Image Uploader, Table Builder, Preview Modal
│   │   ├── tournament/           # Bracket Viewer, Challenge Modal, Tournament Creator
│   │   └── providers/            # AuthProvider, LowDataProvider
│   ├── lib/
│   │   ├── engine/
│   │   │   ├── multiplayer-engine.ts # Server-authoritative referee game engine
│   │   │   ├── team-engine.ts    # Squad balancing & team score aggregation
│   │   │   ├── power-ups.ts      # Tactical abilities & quota validation
│   │   │   ├── adaptive-difficulty.ts # Real-time difficulty tier scaling
│   │   │   ├── room-code.ts      # Collision-resistant PIN generator
│   │   │   └── scoring.ts        # Speed-decay scoring & leaderboard sorting
│   │   ├── realtime/
│   │   │   ├── events.ts         # Strongly typed WebSocket event contracts
│   │   │   ├── socket-server.ts  # Socket.IO server event handlers
│   │   │   └── use-arena-socket.ts# Client React hook for real-time play & reconnect
│   │   ├── services/             # Auth, Question, Room, Season, Progression, Topic services
│   │   ├── validations/          # Zod validation schemas
│   │   ├── logger.ts             # Structured JSON logger & security audit trail
│   │   ├── cache.ts              # In-memory TTL cache with auto-purge
│   │   └── db.ts                 # Prisma client singleton
│   └── types/                    # Domain models and DTO interfaces
├── tests/
│   ├── auth-rbac.test.ts         # 4 Tests for authentication & RBAC
│   ├── competitive-ecosystem.test.ts # 23 Tests for power-ups, adaptive, progression, leagues
│   ├── multiplayer-engine.test.ts# 11 Tests for multiplayer referee & option shuffling
│   ├── question-authoring.test.ts# 20 Tests for question CRUD, CSV import, reordering
│   ├── reconnection-flow.test.ts # 3 Tests for socket drop, question advance & reconnect
│   ├── room-code.test.ts         # 4 Tests for PIN generation & collision resistance
│   ├── scoring.test.ts           # 5 Tests for decay scoring & streaks
│   ├── security-anti-cheat.test.ts# 9 Tests for fake scores, late answers, bot detection
│   ├── tournaments-and-leagues.test.ts # 13 Tests for brackets & campus clashes
│   ├── validation.test.ts        # 4 Tests for Zod schemas
│   └── load/
│       ├── 50-players.ts         # 50-player simulated load test
│       └── stress-benchmark.ts   # Multi-tier 50, 75, 100 player concurrency benchmark
├── Dockerfile                    # Multi-stage production container
├── docker-compose.yml            # PostgreSQL + Web container orchestration
├── .env.example                  # Documented environment variables
├── .github/workflows/ci.yml      # Automated GitHub Actions CI pipeline
└── README.md                     # Complete documentation
```

---

## 🔑 Environment Variables

| Variable | Description | Default / Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/aptitudearina?schema=public` |
| `JWT_SECRET` | Secret key used to sign session JWTs | `arena_super_secret_jwt_token_for_college_placement_prep_key_32bytes` |
| `SESSION_MAX_AGE_DAYS` | Duration of persistent login cookies | `7` |
| `NEXT_PUBLIC_APP_URL` | Base application URL | `http://localhost:3000` |
| `NEXT_PUBLIC_WS_URL` | Base WebSocket connection URL | `ws://localhost:3000` |
| `PORT` | Server listening port | `3000` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |

---

## 🚀 Quick Start & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
npx prisma generate
```

### 3. Run Development Server (Next.js + Socket.IO)
```bash
npm run server
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

### Unit & Integration Test Suite (Vitest)
```bash
npm run test
```
Executes all **10 test files and 96 automated tests** (100% passing):
- Room creation, capacity limits, duplicate display names
- Host privileges and starting guards
- Per-player option shuffling (verifying secrecy of `isCorrect`)
- Answer validation: correct vs incorrect scoring, speed bonuses
- Reconnection lifecycle: socket drops $\rightarrow$ question advances $\rightarrow$ reconnect with token $\rightarrow$ score preserved
- Server-authoritative anti-cheat: fake scores, client timers, duplicate answers, late answers, impossible reaction times (<120ms)
- Power-up inventory quotas and duplicate activation rejection
- Adaptive difficulty escalation and de-escalation
- Fair league ranking decay curves and seasonal freeze snapshots
- Team battle squad aggregation and dual leaderboards
- Daily challenge single-ranked-attempt policy and timezone streaks
- Password hashing & RBAC authorization checks

### TypeScript Static Type Checking
```bash
npm run type-check
```

### Multi-Tier Concurrency Benchmark (50, 75, 100 Players)
```bash
npm run benchmark
```

---

## 👥 Demo Accounts (Pre-Seeded)

All demo accounts use password: **`Password123!`**
*(Quick-fill buttons are available on `/login`)*

| Role | Name | Email | Permissions |
|---|---|---|---|
| **Student (Player)** | Arjun Sharma | `arjun@apex.edu` | Join rooms, compete, view diagnostic stats |
| **Student (Player)** | Sneha Patel | `sneha@apex.edu` | Join rooms, compete, view diagnostic stats |
| **Host / Quizmaster** | Prof. Alan Vance | `host@apex.edu` | Author sets, duplicate sets, host arena rooms |
| **Faculty** | Dr. Evelyn Reed | `faculty@apex.edu` | Placement syllabus authoring & analytics |
| **Super Admin** | System Admin | `admin@arena.edu` | Full platform administration |

---

## 🚢 Docker Deployment

```bash
docker compose up --build
```
Spins up PostgreSQL container and Aptitude Arena server listening on port 3000 with database healthchecks.

---

## 🔄 CI/CD Pipeline

Automated GitHub Actions workflow (`.github/workflows/ci.yml`) runs on all branches and pull requests:
1. Spins up PostgreSQL 16 test service
2. Installs dependencies (`npm ci`)
3. Generates Prisma client
4. Executes TypeScript static type-check (`npm run type-check`)
5. Runs complete Vitest test suite (`npm test`)
6. Executes multi-tier concurrency benchmark (`npm run benchmark`)
7. Compiles production Next.js build (`npm run build`)

---

## 📋 Production Readiness Checklist

- [x] **Server-Authoritative Game Engine:** Browser timers and scores never trusted.
- [x] **Room Lifecycle State Machine:** WAITING $\rightarrow$ STARTING $\rightarrow$ QUESTION_ACTIVE $\rightarrow$ QUESTION_REVEAL $\rightarrow$ LEADERBOARD $\rightarrow$ FINISHED.
- [x] **Option Permutation Shuffling:** Unique order per player; correct answers never leaked.
- [x] **Synchronized Timing:** Epoch timestamps with bounded 250ms network jitter grace.
- [x] **50+ Player Concurrency:** Verified with 50, 75, and 100 virtual players (0.014–0.038ms answer validation latency).
- [x] **Fault-Tolerant Reconnection:** Disconnects do not pause room; players reconnect with token and restore state.
- [x] **Anti-Cheat Audit:** Duplicate answers, late answers, premature answers, and sub-120ms bot submissions rejected.
- [x] **Tactical Power-Ups:** Double Points, 50:50, Time Freeze, Second Chance with strict match quotas.
- [x] **College Leagues & Seasons:** Fair decaying top-20 formula beating pure game volume; immutable season snapshots.
- [x] **Team Battles:** 3–5 cadet squads with aggregated team points.
- [x] **Daily Challenge & Streaks:** Synchronized 10-question challenge with timezone grace window.
- [x] **Question Authoring Suite:** CSV/JSON import, table builder, image support, drag-and-drop reordering, gameplay preview.
- [x] **Faculty Analytics:** Diagnostic cohort breakdowns by topic.
- [x] **Auditorium Spectator Mode:** Fullscreen projection mode with hidden solutions and cohort histograms.
- [x] **Host Live Dashboard:** Live answer count progress without host score tampering ability.
- [x] **Accessibility & Low-Data Mode:** WCAG compliant `✓` and `✕` indicators, screen reader labels, data saver toggle.
- [x] **Public Game Rules Page:** Accessible at `/rules`.
- [x] **Observability & DevOps:** Structured JSON logger, TTL in-memory cache, Dockerfile, docker-compose.yml, CI workflow.
