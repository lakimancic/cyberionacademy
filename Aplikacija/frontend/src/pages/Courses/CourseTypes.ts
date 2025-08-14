interface CourseData {
    id?: number;
    title: string;
    difficulty: number;
    description: string;
    hasBanner: boolean;
    items: CourseItem[];
    lessonCount?: number;
    challengeCount?: number;
    review?: {
        text: string;
        stars: number;
        difficulty: number;
    },
    authorId?: string;
    authorName?: string;
    authorRole?: string;
};

interface CourseItem {
    id: number;
    name: string;
    categoryName: string;
    categoryShort: string;
    difficulty: number;
    type: number;
};

interface Course {
    id: number;
    title: string;
    description?: string;
    authorName?: string;
    authorId?: number;
    averageRating: number;
    difficulty: number;
    hasBanner: boolean;
    lessonCount: number;
    challengeCount: number;
};

export type { CourseData, CourseItem, Course };