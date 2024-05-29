
export type SearchLogRequest = {
    prompts: SearchLogCondition;
};

export type SearchLogCondition = {
    page: string;
    torokuDt: string;
    bango: string;
    email: string;
    content: string;
}