export type QuestionGradeInput = {
    questionId: string;
    questionText: string;
    modelAnswer: string;
    studentAnswer: string;
    degree: number;
    aiNotes?: string | null;
    modelImages?: string[];
    studentImages?: string[];
};
export type QuestionGradeResult = {
    questionId: string;
    score: number;
    feedback: string;
};
export declare function gradeExam(questions: QuestionGradeInput[]): Promise<QuestionGradeResult[]>;
//# sourceMappingURL=gemini.d.ts.map