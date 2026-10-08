import { Topic } from "@/types";

export interface MatchFeedbackDTO {
  headline: string;
  subheadline: string;
  insights: {
    type: "IMPROVEMENT" | "STRENGTH" | "SPEED" | "FOCUS_AREA";
    title: string;
    description: string;
    metric?: string;
  }[];
  placementReadinessRating: "TIER_1_READY" | "COMPETITIVE" | "DEVELOPING";
}

/**
 * Generate personalized constructive feedback after a competitive match
 */
export function generateMatchFeedback(params: {
  currentAccuracy: number;
  historicalAccuracy: number;
  currentAvgTimeSec: number;
  historicalAvgTimeSec: number;
  topicAccuracies?: { topic: Topic; accuracy: number; count: number }[];
  rank: number;
  totalPlayers: number;
}): MatchFeedbackDTO {
  const insights: MatchFeedbackDTO["insights"] = [];
  const accDelta = Math.round(params.currentAccuracy - params.historicalAccuracy);
  const timeDelta = Math.round((params.historicalAvgTimeSec - params.currentAvgTimeSec) * 10) / 10;

  // 1. Accuracy Growth Insight
  if (accDelta > 0) {
    insights.push({
      type: "IMPROVEMENT",
      title: "Accuracy Trending Up",
      description: `Your accuracy climbed by +${accDelta}% compared to your overall baseline.`,
      metric: `+${accDelta}%`,
    });
  } else if (params.currentAccuracy >= 85) {
    insights.push({
      type: "IMPROVEMENT",
      title: "High Precision Performance",
      description: `Maintained a strong ${params.currentAccuracy}% accuracy throughout the round.`,
      metric: `${params.currentAccuracy}%`,
    });
  }

  // 2. Speed Insight
  if (timeDelta > 0.5) {
    insights.push({
      type: "SPEED",
      title: "Faster Response Latency",
      description: `You answered questions ${timeDelta}s faster per question than your average pace.`,
      metric: `-${timeDelta}s`,
    });
  }

  // 3. Topic Strength Insight
  if (params.topicAccuracies && params.topicAccuracies.length > 0) {
    const sortedTopics = [...params.topicAccuracies].sort((a, b) => b.accuracy - a.accuracy);
    const bestTopic = sortedTopics[0];
    if (bestTopic && bestTopic.accuracy >= 70) {
      insights.push({
        type: "STRENGTH",
        title: `Strongest in ${bestTopic.topic.replace(/_/g, " ")}`,
        description: `Delivered ${bestTopic.accuracy}% accuracy on ${bestTopic.topic.toLowerCase().replace(/_/g, " ")} questions.`,
        metric: `${bestTopic.accuracy}%`,
      });
    }

    const weakestTopic = sortedTopics[sortedTopics.length - 1];
    if (weakestTopic && weakestTopic.accuracy < 60 && weakestTopic.topic !== bestTopic.topic) {
      insights.push({
        type: "FOCUS_AREA",
        title: `Recommended Practice: ${weakestTopic.topic.replace(/_/g, " ")}`,
        description: `Focus on solo practice drills in ${weakestTopic.topic.toLowerCase().replace(/_/g, " ")} to boost campus standing.`,
      });
    }
  }

  // Placement Readiness
  let placementReadinessRating: MatchFeedbackDTO["placementReadinessRating"] = "DEVELOPING";
  if (params.currentAccuracy >= 80 && params.currentAvgTimeSec <= 8.0) {
    placementReadinessRating = "TIER_1_READY";
  } else if (params.currentAccuracy >= 65) {
    placementReadinessRating = "COMPETITIVE";
  }

  let headline = "Great effort in the arena!";
  let subheadline = "Every completed round sharpens your placement aptitude instincts.";

  if (accDelta > 5 || params.currentAccuracy >= 90) {
    headline = "You're improving fast!";
    subheadline = "Outstanding cognitive focus and question decision speed.";
  } else if (params.rank <= Math.ceil(params.totalPlayers * 0.2)) {
    headline = "Top tier placement performance!";
    subheadline = "Ranked among the upper quartile of today's competitive round.";
  }

  return {
    headline,
    subheadline,
    insights,
    placementReadinessRating,
  };
}
