export type Role = "PLAYER" | "HOST" | "FACULTY" | "COLLEGE_ADMIN" | "SUPER_ADMIN";

export type Topic =
  | "QUANTITATIVE"
  | "LOGICAL"
  | "VERBAL"
  | "DATA_INTERPRETATION"
  | "GENERAL_REASONING";

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "EXPERT";

export type Visibility = "PUBLIC" | "PRIVATE" | "COLLEGE_ONLY";

export type GameMode = "CLASSIC" | "SPEED" | "TEAM_BATTLE" | "PRACTICE";

export type RoomStatus =
  | "LOBBY"
  | "IN_PROGRESS"
  | "QUESTION_ACTIVE"
  | "QUESTION_RESULT"
  | "FINISHED";

export type PowerUpType =
  | "FIFTY_FIFTY"
  | "REMOVE_TWO"
  | "DOUBLE_POINTS"
  | "TIME_FREEZE"
  | "SECOND_CHANCE";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  collegeId?: string | null;
  collegeName?: string | null;
  createdAt: string;
}

export interface AuthSession {
  user: SafeUser;
  token: string;
  expiresAt: number;
}

export interface QuestionOptionDTO {
  id?: string;
  text: string;
  imageUrl?: string | null;
  isCorrect: boolean;
}

export interface QuestionDTO {
  id?: string;
  questionSetId?: string;
  text: string;
  explanation?: string | null;
  topic: Topic;
  difficulty: Difficulty;
  imageUrl?: string | null;
  tableData?: string | null;
  tags?: string | null;
  usageCount?: number;
  timeLimit: number;
  points: number;
  order: number;
  options: QuestionOptionDTO[];
}

export interface QuestionSetDTO {
  id: string;
  title: string;
  description?: string | null;
  topic?: Topic;
  difficulty?: Difficulty;
  estimatedDuration?: number;
  tags?: string | null;
  isArchived?: boolean;
  isPublished?: boolean;
  ownerId: string;
  ownerName?: string;
  collegeId?: string | null;
  visibility: Visibility;
  questionCount?: number;
  createdAt: string;
  updatedAt: string;
  questions?: QuestionDTO[];
}

export interface RoomDTO {
  id: string;
  code: string;
  hostId: string;
  hostName?: string;
  collegeId?: string | null;
  questionSetId: string;
  questionSetTitle?: string;
  gameMode?: GameMode;
  timePerQuestion?: number | null;
  questionCount?: number | null;
  status: RoomStatus;
  maxPlayers: number;
  currentQuestionIndex: number;
  playerCount?: number;
  createdAt: string;
}

export interface RoomPlayerDTO {
  id: string;
  roomId: string;
  userId?: string | null;
  displayName: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  answeredQuestions: number;
  totalAnswerTime: number;
  connected: boolean;
  joinedAt: string;
}

export interface LeaderboardEntryDTO {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
  correctAnswers: number;
  accuracy: number;
  streak?: number;
}

export interface LeagueDTO {
  id: string;
  name: string;
  season: string;
  startDate: string;
  endDate: string;
  collegeId?: string | null;
  collegeName?: string | null;
  participantCount?: number;
}

export interface QuestionPerformanceDTO {
  questionId: string;
  text: string;
  topic: Topic;
  difficulty: Difficulty;
  attempts: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  correctPercent: number;
  wrongPercent: number;
  skippedPercent: number;
  averageResponseTime: number;
}

export interface FacultyAnalyticsDTO {
  totalGames: number;
  totalStudents: number;
  averageAccuracy: number;
  averageScore: number;
  averageResponseTime: number;
  topicBreakdown: {
    topic: Topic;
    accuracy: number;
    totalAttempts: number;
    avgScore: number;
  }[];
  difficultyBreakdown: {
    difficulty: Difficulty;
    accuracy: number;
    totalAttempts: number;
  }[];
  mostDifficultQuestions: QuestionPerformanceDTO[];
  mostIncorrectQuestions: QuestionPerformanceDTO[];
  fastestQuestions: QuestionPerformanceDTO[];
  slowestQuestions: QuestionPerformanceDTO[];
}

export interface GameHistoryDTO {
  id: string;
  code: string;
  questionSetId: string;
  questionSetTitle: string;
  hostId: string;
  hostName: string;
  gameMode: GameMode;
  status: RoomStatus;
  playerCount: number;
  winnerName?: string | null;
  winnerScore?: number | null;
  averageAccuracy: number;
  createdAt: string;
  endedAt?: string | null;
}

export interface GameSessionDetailDTO {
  room: RoomDTO;
  leaderboard: LeaderboardEntryDTO[];
  questionAnalytics: QuestionPerformanceDTO[];
  playerResults: {
    playerId: string;
    displayName: string;
    score: number;
    accuracy: number;
    avgResponseTime: number;
    rank: number;
    answers: {
      questionId: string;
      isCorrect: boolean;
      responseTime: number;
      points: number;
    }[];
  }[];
}

export interface PlayerProfileAnalyticsDTO {
  user: SafeUser;
  totalGames: number;
  totalWins: number;
  averageScore: number;
  overallAccuracy: number;
  bestStreak: number;
  topicStrengths: {
    topic: Topic;
    accuracy: number;
    attempts: number;
  }[];
  recentGames: {
    roomId: string;
    code: string;
    title: string;
    score: number;
    rank: number;
    accuracy: number;
    date: string;
  }[];
}

export type TournamentStatus = "UPCOMING" | "REGISTRATION" | "IN_PROGRESS" | "COMPLETED";
export type TournamentFormat = "SINGLE_ELIMINATION" | "ROUND_ROBIN" | "DOUBLE_ELIMINATION";
export type MatchStatus = "SCHEDULED" | "PENDING" | "LIVE" | "COMPLETED" | "CANCELLED";
export type ChallengeStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "IN_PROGRESS" | "COMPLETED";
export type DivisionTier = "DIAMOND" | "GOLD" | "SILVER";

export interface CollegeStandingDTO {
  rank: number;
  collegeId: string;
  collegeName: string;
  shortName: string;
  score: number;
  gamesPlayed: number;
  winRate?: number;
  eloRating?: number;
  division?: DivisionTier;
  logo?: string | null;
}

export interface TournamentDTO {
  id: string;
  title: string;
  description?: string | null;
  season: string;
  status: TournamentStatus;
  format: TournamentFormat;
  minColleges: number;
  maxColleges: number;
  startDate: string;
  endDate: string;
  prizePool?: string | null;
  questionSetId?: string | null;
  participantCount: number;
  matches?: TournamentMatchDTO[];
  participants?: TournamentParticipantDTO[];
}

export interface TournamentParticipantDTO {
  id: string;
  tournamentId: string;
  collegeId: string;
  collegeName: string;
  shortName: string;
  seed: number;
  score: number;
  eliminated: boolean;
}

export interface TournamentMatchDTO {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  roundName?: string;
  college1Id?: string | null;
  college1Name?: string | null;
  college1Short?: string | null;
  college2Id?: string | null;
  college2Name?: string | null;
  college2Short?: string | null;
  score1: number;
  score2: number;
  winnerCollegeId?: string | null;
  winnerCollegeName?: string | null;
  roomId?: string | null;
  status: MatchStatus;
  scheduledAt?: string | null;
  completedAt?: string | null;
}

export interface BracketRoundDTO {
  round: number;
  name: string;
  matches: TournamentMatchDTO[];
}

export interface CollegeChallengeDTO {
  id: string;
  challengerCollegeId: string;
  challengerCollegeName: string;
  challengerShortName: string;
  opponentCollegeId: string;
  opponentCollegeName: string;
  opponentShortName: string;
  challengerUserId?: string | null;
  questionSetId?: string | null;
  questionSetTitle?: string | null;
  status: ChallengeStatus;
  scheduledAt?: string | null;
  roomId?: string | null;
  roomCode?: string | null;
  challengerScore: number;
  opponentScore: number;
  winnerCollegeId?: string | null;
  winnerCollegeName?: string | null;
  message?: string | null;
  createdAt: string;
}
