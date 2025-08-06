interface Quiz {
    id?: number;
    questionCount: number;
    timeMinutes: number;
    questions: Question[];
};

interface Question {
    id?: number;
    text: string;
    points: number;
    type: number;
    answers?: AnswerOption[];
    pairs?: ConnectPair[];
};

interface AnswerOption {
    id?: number;
    text: string;
    isCorrect: boolean;
};

interface ConnectPair {
    id?: number;
    left: string;
    right: string;
};

export type { Quiz, Question, AnswerOption, ConnectPair };