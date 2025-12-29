'use server'

import { createClient } from '@/utils/supabase/server'; // Zakładam, że masz ten helper
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createInvestmentSchema, CreateInvestmentState } from '@/lib/schemas';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function createInvestment(
    prevState: CreateInvestmentState,
    formData: FormData
): Promise<CreateInvestmentState> {
    // 1. Walidacja Zod
    const validatedFields = createInvestmentSchema.safeParse({
        title: formData.get('title'),
        description: formData.get('description'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Błąd walidacji formularza.',
        };
    }

    const { title, description } = validatedFields.data;
    const supabase = await createClient();

    // 2. Autoryzacja i Pobranie Kontekstu (Security First)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { message: 'Nieautoryzowany dostęp.' };
    }

    // Pobieramy ID dzielnicy przypisanej do usera
    const { data: profile } = await supabase
        .from('profiles')
        .select('district_id, role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'rada' || !profile.district_id) {
        return { message: 'Tylko Rada Dzielnicy może zgłaszać inwestycje.' };
    }

    // 3. Insert do Bazy Danych
    const { error: dbError } = await supabase
        .from('investments')
        .insert({
            title: title,
            description: description,
            district_id: profile.district_id,
            status: 'NEW', // Domyślny status
            cost_covered_by_city: false
        });

    if (dbError) {
        console.error('Database Error:', dbError);
        return { message: 'Błąd bazy danych. Spróbuj ponownie.' };
    }

    // 4. Powiadomienie Email (Fire-and-forget, nie blokujemy response'a błędem maila)
    try {
        await resend.emails.send({
            from: 'system@twojamiasto.pl',
            to: 'biuro@raddzielnic.pl', // Hardcoded dla MVP
            subject: `Nowe zgłoszenie: ${title}`,
            html: `<p>Dzielnica zgłosiła nową inwestycję: <strong>${title}</strong></p>`
        });
    } catch (emailError) {
        console.warn('Email notification failed:', emailError);
    }

    // 5. Revalidate & Redirect
    revalidatePath('/dashboard/investments');
    redirect('/dashboard/investments');
}