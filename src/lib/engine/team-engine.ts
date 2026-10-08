export interface EngineTeam {
  id: string;
  name: string;
  color: string;
  memberPlayerIds: Set<string>;
}

export interface TeamLeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  color: string;
  totalScore: number;
  playerCount: number;
  averageAccuracy: number;
  topPlayerName?: string;
  topPlayerScore?: number;
}

export const DEFAULT_TEAM_CONFIGS = [
  { id: "team-alpha", name: "Team Alpha (CS & IT)", color: "#8b5cf6" }, // Violet
  { id: "team-beta", name: "Team Beta (ECE & Mech)", color: "#06b6d4" }, // Cyan
  { id: "team-gamma", name: "Team Gamma (Civil & Chem)", color: "#f59e0b" }, // Amber
  { id: "team-delta", name: "Team Delta (Aerospace)", color: "#ec4899" }, // Pink
];

/**
 * Team Battle manager for multiplayer rooms
 */
export class TeamBattleManager {
  private teams = new Map<string, EngineTeam>();
  private playerToTeam = new Map<string, string>(); // playerId -> teamId

  constructor(customTeams?: { id: string; name: string; color: string }[]) {
    const list = customTeams || DEFAULT_TEAM_CONFIGS.slice(0, 2); // Default to 2 teams (Alpha vs Beta)
    for (const t of list) {
      this.teams.set(t.id, {
        id: t.id,
        name: t.name,
        color: t.color,
        memberPlayerIds: new Set(),
      });
    }
  }

  /**
   * Assign player to a team
   */
  public joinTeam(playerId: string, teamId: string): boolean {
    const targetTeam = this.teams.get(teamId);
    if (!targetTeam) return false;

    // Check team capacity (max 5 players per team)
    if (targetTeam.memberPlayerIds.size >= 5) {
      return false;
    }

    // Remove from previous team if any
    const oldTeamId = this.playerToTeam.get(playerId);
    if (oldTeamId && this.teams.has(oldTeamId)) {
      this.teams.get(oldTeamId)!.memberPlayerIds.delete(playerId);
    }

    targetTeam.memberPlayerIds.add(playerId);
    this.playerToTeam.set(playerId, teamId);
    return true;
  }

  public getPlayerTeam(playerId: string): EngineTeam | null {
    const teamId = this.playerToTeam.get(playerId);
    if (!teamId) return null;
    return this.teams.get(teamId) || null;
  }

  public getTeams(): EngineTeam[] {
    return Array.from(this.teams.values());
  }

  /**
   * Automatically balance players across teams
   */
  public autoBalance(playerIds: string[]) {
    const teamList = Array.from(this.teams.values());
    if (teamList.length === 0) return;

    playerIds.forEach((pId, idx) => {
      const target = teamList[idx % teamList.length];
      this.joinTeam(pId, target.id);
    });
  }

  /**
   * Compute live team leaderboard based on current player scores
   */
  public computeTeamLeaderboard(playerScores: Map<string, { displayName: string; score: number; accuracy: number }>): TeamLeaderboardEntry[] {
    const entries: TeamLeaderboardEntry[] = [];

    for (const [teamId, team] of this.teams.entries()) {
      let totalScore = 0;
      let totalAccuracy = 0;
      let activeCount = 0;
      let topPlayerName = "";
      let topPlayerScore = -1;

      for (const pId of team.memberPlayerIds) {
        const pStats = playerScores.get(pId);
        if (pStats) {
          totalScore += pStats.score;
          totalAccuracy += pStats.accuracy;
          activeCount += 1;
          if (pStats.score > topPlayerScore) {
            topPlayerScore = pStats.score;
            topPlayerName = pStats.displayName;
          }
        }
      }

      const avgAcc = activeCount > 0 ? Math.round((totalAccuracy / activeCount) * 10) / 10 : 0;

      entries.push({
        rank: 1,
        teamId,
        teamName: team.name,
        color: team.color,
        totalScore,
        playerCount: team.memberPlayerIds.size,
        averageAccuracy: avgAcc,
        topPlayerName: topPlayerName || undefined,
        topPlayerScore: topPlayerScore >= 0 ? topPlayerScore : undefined,
      });
    }

    // Sort by total score descending
    entries.sort((a, b) => b.totalScore - a.totalScore);
    entries.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    return entries;
  }
}
