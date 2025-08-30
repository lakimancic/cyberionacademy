interface Quiz {
  id?: number;
  questionCount: number;
  timeMinutes: number;
  questions: Question[];
}

interface Question {
  id?: number;
  text: string;
  points: number;
  type: number;
  answers?: AnswerOption[];
  pairs?: ConnectPair[];
}

interface AnswerOption {
  id?: number;
  text: string;
  isCorrect: boolean;
}

interface ConnectPair {
  id?: number;
  left: string;
  right: string;
}

interface QuestionDetails {
  id: number;
  points: number;
  text: string;
  type: number;
  answer?: string;
  options?: {
    id: number;
    text: string;
    isCorrect?: boolean;
  }[];
  leftPairs?: {
    id: number;
    left: string;
  }[];
  rightPairs?: {
    right: string;
  }[];
  pairs?: {
    id: number;
    left: string;
    right: string;
  }[];
}

interface AnswersSave {
  [quizId: number]: {
    [questionId: number]: {
      pairs?: {
        id: number;
        left: string;
        right: string;
      }[];
      answer?: string;
      options?: {
        [optId: number]: {
          isCorrect: boolean;
        };
      };
    };
  };
}

export type {
  Quiz,
  Question,
  AnswerOption,
  ConnectPair,
  QuestionDetails,
  AnswersSave,
};
