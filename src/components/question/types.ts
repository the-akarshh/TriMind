import { Topic, Difficulty } from "@/types";

export interface QuestionFormItem {
  id: string;
  text: string;
  explanation: string;
  topic: Topic;
  difficulty: Difficulty;
  timeLimit: number;
  points: number;
  imageUrl?: string | null;
  tableData?: string | null;
  tags?: string | null;
  options: {
    id: string;
    text: string;
    imageUrl?: string | null;
    isCorrect: boolean;
  }[];
}
