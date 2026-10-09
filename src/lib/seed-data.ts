import { SafeUser, Topic, Difficulty } from "@/types";

export interface SeedQuestion {
  id: string;
  text: string;
  explanation: string;
  topic: Topic;
  difficulty: Difficulty;
  tableData?: string;
  timeLimit: number;
  points: number;
  order: number;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

export interface SeedQuestionSet {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  collegeId: string;
  visibility: "PUBLIC" | "PRIVATE" | "COLLEGE_ONLY";
  createdAt: string;
  questions: SeedQuestion[];
}

export const DEMO_COLLEGE = {
  id: "college-apex-1",
  name: "Apex Institute of Technology",
  shortName: "AIT",
  logo: "https://images.unsplash.com/photo-1562774053-701939374585?w=100&q=80",
  location: "Bangalore, India",
  createdAt: new Date().toISOString(),
};

// Password for all demo accounts is Password123!
// Pre-computed bcrypt hash of "Password123!" with 10 salt rounds:
export const DEMO_PASSWORD_HASH = "$2a$10$lracWu49cbENBKYuc.WFy.4C4T5MMnXCpAvpm26/EwOXJ3Xvvkbua";

export const DEMO_USERS = [
  {
    id: "usr-admin-1",
    name: "System Admin",
    email: "admin@arena.edu",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "SUPER_ADMIN" as const,
    collegeId: DEMO_COLLEGE.id,
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-faculty-1",
    name: "Dr. Evelyn Reed",
    email: "faculty@apex.edu",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "FACULTY" as const,
    collegeId: DEMO_COLLEGE.id,
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-host-1",
    name: "Prof. Alan Vance",
    email: "host@apex.edu",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "HOST" as const,
    collegeId: DEMO_COLLEGE.id,
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-player-1",
    name: "Arjun Sharma",
    email: "arjun@apex.edu",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "PLAYER" as const,
    collegeId: DEMO_COLLEGE.id,
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-player-2",
    name: "Sneha Patel",
    email: "sneha@apex.edu",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "PLAYER" as const,
    collegeId: DEMO_COLLEGE.id,
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-player-3",
    name: "Rohan Mehta",
    email: "rohan@apex.edu",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "PLAYER" as const,
    collegeId: DEMO_COLLEGE.id,
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-player-4",
    name: "Priya Nair",
    email: "priya@apex.edu",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "PLAYER" as const,
    collegeId: DEMO_COLLEGE.id,
    createdAt: new Date().toISOString(),
  },
];

export const DEMO_QUESTION_SETS: SeedQuestionSet[] = [
  {
    id: "qs-quant-101",
    title: "Quantitative Aptitude: High-Frequency Placement Core",
    description: "Time & work, speed-distance-time, percentages, profit & loss, and numbers theory.",
    ownerId: "usr-host-1",
    collegeId: DEMO_COLLEGE.id,
    visibility: "PUBLIC",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "q-quant-1",
        text: "A train running at 54 km/h takes 20 seconds to pass an electric pole. What is the length of the train in meters?",
        explanation: "Speed in m/s = 54 * (5/18) = 15 m/s. Distance = Speed * Time = 15 * 20 = 300 meters.",
        topic: "QUANTITATIVE",
        difficulty: "EASY",
        timeLimit: 30,
        points: 100,
        order: 1,
        options: [
          { id: "opt-q1-1", text: "250 meters", isCorrect: false },
          { id: "opt-q1-2", text: "300 meters", isCorrect: true },
          { id: "opt-q1-3", text: "320 meters", isCorrect: false },
          { id: "opt-q1-4", text: "360 meters", isCorrect: false },
        ],
      },
      {
        id: "q-quant-2",
        text: "A can finish a task in 12 days, and B can finish the same task in 18 days. If they work together for 4 days, what fraction of work is left?",
        explanation: "Work per day = 1/12 + 1/18 = 5/36. In 4 days, they complete 4 * (5/36) = 20/36 = 5/9. Work remaining = 1 - 5/9 = 4/9.",
        topic: "QUANTITATIVE",
        difficulty: "MEDIUM",
        timeLimit: 40,
        points: 120,
        order: 2,
        options: [
          { id: "opt-q2-1", text: "5/9", isCorrect: false },
          { id: "opt-q2-2", text: "4/9", isCorrect: true },
          { id: "opt-q2-3", text: "1/3", isCorrect: false },
          { id: "opt-q2-4", text: "2/5", isCorrect: false },
        ],
      },
      {
        id: "q-quant-3",
        text: "If 15% of x is equal to 20% of y, then what is the ratio of x to y?",
        explanation: "0.15x = 0.20y => x/y = 20/15 = 4/3.",
        topic: "QUANTITATIVE",
        difficulty: "EASY",
        timeLimit: 25,
        points: 100,
        order: 3,
        options: [
          { id: "opt-q3-1", text: "3 : 4", isCorrect: false },
          { id: "opt-q3-2", text: "4 : 3", isCorrect: true },
          { id: "opt-q3-3", text: "5 : 4", isCorrect: false },
          { id: "opt-q3-4", text: "15 : 20", isCorrect: false },
        ],
      },
      {
        id: "q-quant-4",
        text: "A shopkeeper marks an article at 40% above cost price and allows a 15% discount. What is his net profit percentage?",
        explanation: "Let CP = 100. MP = 140. SP = 140 * 0.85 = 119. Profit = 119 - 100 = 19%.",
        topic: "QUANTITATIVE",
        difficulty: "HARD",
        timeLimit: 45,
        points: 150,
        order: 4,
        options: [
          { id: "opt-q4-1", text: "19%", isCorrect: true },
          { id: "opt-q4-2", text: "21%", isCorrect: false },
          { id: "opt-q4-3", text: "25%", isCorrect: false },
          { id: "opt-q4-4", text: "18.5%", isCorrect: false },
        ],
      },
    ],
  },
  {
    id: "qs-logic-201",
    title: "Logical Reasoning: Syllogisms & Seating Arrangements",
    description: "Deductive reasoning, linear and circular seating arrangements, and blood relations.",
    ownerId: "usr-faculty-1",
    collegeId: DEMO_COLLEGE.id,
    visibility: "PUBLIC",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "q-logic-1",
        text: "Statements: All routers are switches. Some switches are firewalls. Conclusions: I. Some firewalls are switches. II. Some routers are firewalls.",
        explanation: "Some switches are firewalls implies Some firewalls are switches (valid conversion). Relation between routers and firewalls is undetermined.",
        topic: "LOGICAL",
        difficulty: "MEDIUM",
        timeLimit: 35,
        points: 110,
        order: 1,
        options: [
          { id: "opt-ql1-1", text: "Only Conclusion I follows", isCorrect: true },
          { id: "opt-ql1-2", text: "Only Conclusion II follows", isCorrect: false },
          { id: "opt-ql1-3", text: "Both I and II follow", isCorrect: false },
          { id: "opt-ql1-4", text: "Neither follows", isCorrect: false },
        ],
      },
      {
        id: "q-logic-2",
        text: "Pointing to a photograph, Rohit said: 'Her mother is the only daughter of my mother.' How is Rohit related to the person in the photograph?",
        explanation: "The only daughter of Rohit's mother is Rohit's sister. Her mother is Rohit's sister, meaning Rohit is her maternal uncle.",
        topic: "LOGICAL",
        difficulty: "HARD",
        timeLimit: 40,
        points: 130,
        order: 2,
        options: [
          { id: "opt-ql2-1", text: "Father", isCorrect: false },
          { id: "opt-ql2-2", text: "Maternal Uncle", isCorrect: true },
          { id: "opt-ql2-3", text: "Brother", isCorrect: false },
          { id: "opt-ql2-4", text: "Nephew", isCorrect: false },
        ],
      },
      {
        id: "q-logic-3",
        text: "Complete the sequence: 4, 9, 25, 49, 121, ?",
        explanation: "Squares of prime numbers: 2^2=4, 3^2=9, 5^2=25, 7^2=49, 11^2=121. Next prime is 13; 13^2 = 169.",
        topic: "LOGICAL",
        difficulty: "EXPERT",
        timeLimit: 30,
        points: 150,
        order: 3,
        options: [
          { id: "opt-ql3-1", text: "144", isCorrect: false },
          { id: "opt-ql3-2", text: "169", isCorrect: true },
          { id: "opt-ql3-3", text: "196", isCorrect: false },
          { id: "opt-ql3-4", text: "225", isCorrect: false },
        ],
      },
    ],
  },
  {
    id: "qs-verbal-301",
    title: "Verbal Ability: Vocabulary & Sentence Structure",
    description: "Vocabulary, idioms, error spotting, and reading comprehension passages.",
    ownerId: "usr-host-1",
    collegeId: DEMO_COLLEGE.id,
    visibility: "PUBLIC",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "q-verb-1",
        text: "Select the word that is most nearly OPPOSITE in meaning to 'EPHEMERAL':",
        explanation: "'Ephemeral' means lasting for a very short time. 'Perpetual' means lasting forever or for an indefinitely long period.",
        topic: "VERBAL",
        difficulty: "EASY",
        timeLimit: 20,
        points: 90,
        order: 1,
        options: [
          { id: "opt-qv1-1", text: "Transient", isCorrect: false },
          { id: "opt-qv1-2", text: "Perpetual", isCorrect: true },
          { id: "opt-qv1-3", text: "Fleeting", isCorrect: false },
          { id: "opt-qv1-4", text: "Evanescent", isCorrect: false },
        ],
      },
      {
        id: "q-verb-2",
        text: "Identify the grammatically correct sentence:",
        explanation: "'Neither of the candidates has submitted' requires the singular verb 'has' because 'neither' is grammatically singular.",
        topic: "VERBAL",
        difficulty: "MEDIUM",
        timeLimit: 30,
        points: 110,
        order: 2,
        options: [
          { id: "opt-qv2-1", text: "Neither of the candidates have submitted their dossier.", isCorrect: false },
          { id: "opt-qv2-2", text: "Neither of the candidates has submitted his or her dossier.", isCorrect: true },
          { id: "opt-qv2-3", text: "Neither candidates have submitted their dossier.", isCorrect: false },
          { id: "opt-qv2-4", text: "Neither candidate have submitted dossier.", isCorrect: false },
        ],
      },
    ],
  },
  {
    id: "qs-di-401",
    title: "Data Interpretation: Placement Analytics & Tabular Data",
    description: "Interpreting campus placement matrices, quarterly growth tables, and charts.",
    ownerId: "usr-faculty-1",
    collegeId: DEMO_COLLEGE.id,
    visibility: "PUBLIC",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "q-di-1",
        text: "Based on the table below, what is the ratio of Software Engineering offers in 2024 to Cloud/DevOps offers in 2025?",
        tableData: JSON.stringify([
          { Year: "2023", "Software Eng": 120, "Cloud/DevOps": 40, "Data Analytics": 60 },
          { Year: "2024", "Software Eng": 150, "Cloud/DevOps": 60, "Data Analytics": 90 },
          { Year: "2025", "Software Eng": 180, "Cloud/DevOps": 100, "Data Analytics": 120 },
        ]),
        explanation: "Software Eng in 2024 = 150. Cloud/DevOps in 2025 = 100. Ratio = 150 : 100 = 3 : 2.",
        topic: "DATA_INTERPRETATION",
        difficulty: "MEDIUM",
        timeLimit: 40,
        points: 125,
        order: 1,
        options: [
          { id: "opt-qdi1-1", text: "5 : 3", isCorrect: false },
          { id: "opt-qdi1-2", text: "3 : 2", isCorrect: true },
          { id: "opt-qdi1-3", text: "4 : 3", isCorrect: false },
          { id: "opt-qdi1-4", text: "2 : 1", isCorrect: false },
        ],
      },
    ],
  },
  {
    id: "qs-gen-501",
    title: "General Reasoning: Spatial & Analytical Problem Solving",
    description: "Pattern matrices, spatial orientation, and critical thinking challenges.",
    ownerId: "usr-host-1",
    collegeId: DEMO_COLLEGE.id,
    visibility: "PUBLIC",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "q-gen-1",
        text: "In a clock showing 3:15, what is the exact acute angle between the hour and minute hands?",
        explanation: "At 3:15, minute hand is at 90 deg (15*6). The hour hand has moved 15 * 0.5 = 7.5 deg past the 3 mark. Angle = 7.5 degrees.",
        topic: "GENERAL_REASONING",
        difficulty: "MEDIUM",
        timeLimit: 30,
        points: 120,
        order: 1,
        options: [
          { id: "opt-qg1-1", text: "0 degrees", isCorrect: false },
          { id: "opt-qg1-2", text: "7.5 degrees", isCorrect: true },
          { id: "opt-qg1-3", text: "12 degrees", isCorrect: false },
          { id: "opt-qg1-4", text: "15 degrees", isCorrect: false },
        ],
      },
    ],
  },
];

export const DEMO_LEAGUE = {
  id: "league-season-1",
  name: "National Collegiate Placement League - Season 1",
  season: "Fall 2026",
  startDate: "2026-09-01T00:00:00Z",
  endDate: "2026-11-30T23:59:59Z",
  collegeId: DEMO_COLLEGE.id,
  collegeName: DEMO_COLLEGE.name,
};

export const DEMO_LEAGUE_STANDINGS = [
  { rank: 1, playerId: "usr-player-1", displayName: "Arjun Sharma", score: 2840, gamesPlayed: 14, accuracy: 0.92, college: "AIT" },
  { rank: 2, playerId: "usr-player-2", displayName: "Sneha Patel", score: 2610, gamesPlayed: 12, accuracy: 0.88, college: "AIT" },
  { rank: 3, playerId: "usr-player-3", displayName: "Rohan Mehta", score: 2380, gamesPlayed: 11, accuracy: 0.82, college: "AIT" },
  { rank: 4, playerId: "usr-player-4", displayName: "Priya Nair", score: 2190, gamesPlayed: 10, accuracy: 0.79, college: "AIT" },
  { rank: 5, playerId: "usr-ext-5", displayName: "Vikram Sen", score: 1950, gamesPlayed: 9, accuracy: 0.76, college: "NIT Surathkal" },
];
