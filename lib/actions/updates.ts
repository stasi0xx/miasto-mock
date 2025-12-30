// lib/actions/updates.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { createUpdateSchema, CreateUpdateState } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function addInvestmentUpdate(
    investmentId: string,
    prevState: CreateUpdateState,
    formData: FormData
): Promise<CreateUpdateState> {
    const supabase = await createClient();

    // 1. Autoryzacja
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { message: 'Nie jesteś zalogowany.' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile || !['rada', 'urzad', 'brd'].includes(profile.role)) {
        return { message: 'Brak uprawnień do dodawania wiadomości.' };
    }

    // 2. Walidacja danych wejściowych
    const rawData = {
        content: formData.get('content') as string,
        file: formData.get('file') as File | null,
    };

    // Hack: Jeśli plik jest pusty (size 0), traktujemy go jako undefined dla Zoda
    if (rawData.file && rawData.file.size === 0) {
        rawData.file = null;
    }

    const validatedFields = createUpdateSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Błąd walidacji formularza.',
        };
    }

    const { content, file } = validatedFields.data;
    let fileUrl = null;
    let fileName = null;

    // 3. Upload pliku (jeśli istnieje)
    if (file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${investmentId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('investments') // UPEWNIJ SIĘ, ŻE MASZ TAKI BUCKET W SUPABASE!
            .upload(filePath, file);

        if (uploadError) {
            console.error('Błąd uploadu:', uploadError);
            return { message: 'Nie udało się przesłać pliku.' };
        }

        // Pobranie publicznego URL (lub signed URL jeśli bucket jest prywatny)
        const { data: publicUrlData } = supabase.storage
            .from('investments')
            .getPublicUrl(filePath);

        fileUrl = publicUrlData.publicUrl;
        fileName = file.name;
    }

    // 4. Zapis do bazy danych
    const { error: dbError } = await supabase.from('updates').insert({
        investment_id: investmentId,
        author_id: user.id,
        author_role: profile.role,
        type: file ? 'FILE' : 'TEXT', // Uproszczenie, w Twoim modelu może być hybryda
        content: content || null,
        file_url: fileUrl,
        file_name: fileName,
        // Logika powiadomień - kto od kogo wymaga potwierdzenia
        requires_ack_from_rd: profile.role === 'urzad', // Jeśli pisze urząd, rada musi potwierdzić
        requires_ack_from_dept: profile.role === 'rada', // Jeśli pisze rada, wydział musi potwierdzić
    });

    if (dbError) {
        console.error('Błąd bazy:', dbError);
        return { message: 'Nie udało się zapisać wiadomości w bazie.' };
    }

    // 5. Revalidacja i przekierowanie
    revalidatePath(`/investments/${investmentId}`);
    redirect(`/investments/${investmentId}`);
}