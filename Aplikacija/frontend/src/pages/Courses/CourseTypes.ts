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

export type { CourseData, CourseItem };