import { z } from 'zod';

export const createInvestmentSchema = z.object({
    title: z.string()
        .min(5, { message: "Tytuł musi mieć minimum 5 znaków." })
        .max(100, { message: "Tytuł za długi (max 100 znaków)." }),
    description: z.string()
        .min(20, { message: "Opisz to dokładniej. Minimum 20 znaków." })
        .max(2000, { message: "Opis za długi." }),
});

export type CreateInvestmentState = {
    errors?: {
        title?: string[];
        description?: string[];
        _form?: string[];
    };
    message?: string | null;
};