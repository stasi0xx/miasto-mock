import { z } from 'zod';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf'];

export const createUpdateSchema = z.object({
    content: z.string().optional(),
    file: z
        .instanceof(File)
        .optional()
        .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Maksymalny rozmiar pliku to 5MB.`)
        .refine(
            (file) => !file || ACCEPTED_FILE_TYPES.includes(file.type),
            'Dozwolone są tylko pliki PDF.'
        ),
}).refine((data) => data.content || data.file, {
    message: "Musisz wpisać wiadomość LUB dodać plik.",
    path: ["content"],
});

export type CreateUpdateState = {
    errors?: {
        content?: string[];
        file?: string[];
        _form?: string[];
    };
    message?: string | null;
};

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