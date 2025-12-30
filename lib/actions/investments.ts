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
    revalidatePath('/rada');
    redirect('/rada');
}

export async function assignDepartment(prevState: any, formData: FormData) {
    const investmentId = formData.get('investmentId') as string;
    const departmentId = formData.get('departmentId') as string;

    const supabase = await createClient();

    // 1. Security Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Brak autoryzacji' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'brd') {
        return { message: 'Tylko Biuro Rad Dzielnic może przydzielać sprawy.' };
    }

    // 2. Update Inwestycji
    const { error } = await supabase
        .from('investments')
        .update({
            department_id: departmentId,
            status: 'ASSIGNED',
            in_unread_urzad: true
        })
        .eq('id', investmentId);

    if (error) {
        console.error('Assign Error:', error);
        return { message: 'Błąd bazy danych' };
    }

    // 3. Revalidate - poprawiony URL bez "dashboard"
    revalidatePath('/brd');

    // Zwracamy sukces (lub null), żeby wyczyścić ewentualne błędy w stanie
    return { message: null };
}

export async function submitValuation(prevState: any, formData: FormData) {
    const investmentId = formData.get('investmentId') as string;
    const costString = formData.get('cost') as string;
    const file = formData.get('file') as File;

    const supabase = await createClient();

    // 1. Walidacja Autoryzacji (Security First)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Brak autoryzacji' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, department_id')
        .eq('id', user.id)
        .single();

    // Sprawdzamy czy to Urząd
    if (profile?.role !== 'urzad' || !profile.department_id) {
        return { message: 'Brak uprawnień do wyceny.' };
    }

    // Sprawdzamy czy ta inwestycja należy do tego wydziału
    const { data: investment } = await supabase
        .from('investments')
        .select('department_id, status')
        .eq('id', investmentId)
        .single();

    if (investment?.department_id !== profile.department_id) {
        return { message: 'To nie jest inwestycja Twojego wydziału.' };
    }

    // 2. Walidacja Danych
    // Zamiana przecinka na kropkę (dla polskiego formatu 100,50 -> 100.50)
    const cost = parseFloat(costString.replace(',', '.'));

    if (isNaN(cost) || cost <= 0) {
        return { message: 'Podaj poprawną kwotę wyceny.' };
    }

    if (!file || file.size === 0 || file.type !== 'application/pdf') {
        return { message: 'Wymagany jest plik PDF z wyceną (metryczką).' };
    }

    // 3. Upload Pliku do Supabase Storage
    // Unikalna nazwa pliku: timestamp_nazwa
    const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const { data: fileData, error: uploadError } = await supabase.storage
        .from('investments')
        .upload(fileName, file);

    if (uploadError) {
        console.error('Upload Error:', uploadError);
        return { message: 'Błąd przesyłania pliku.' };
    }

    // Generujemy publiczny URL (skoro bucket jest publiczny)
    const { data: { publicUrl } } = supabase.storage
        .from('investments')
        .getPublicUrl(fileName);

    // 4. Update Bazy Danych (Status + Koszt)
    const { error: dbError } = await supabase
        .from('investments')
        .update({
            total_cost: cost,
            status: 'VALUATION_READY',
            is_unread_rd: true,
            is_unread_brd: true,// Zmieniamy status!
        })
        .eq('id', investmentId);

    if (dbError) {
        return { message: 'Błąd aktualizacji bazy danych.' };
    }

    // 5. Dodanie wpisu do Historii (Updates)
    await supabase.from('updates').insert({
        investment_id: investmentId,
        author_id: user.id,
        author_role: 'urzad',
        type: 'FILE', // Traktujemy to jako plik/aktualizację
        content: `Dokonano wyceny na kwotę: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(cost)}. Załączono metryczkę.`,
        file_url: publicUrl,
        file_name: file.name,
        requires_ack_from_rd: true, // Rada musi to zobaczyć!
        requires_ack_from_dept: false
    });

    // 6. Sukces
    revalidatePath(`/investments/${investmentId}`); // URL bez dashboard :)
    return { message: null };
}

function sanitizeFilename(filename: string) {
    return filename
        .normalize('NFD') // Rozbija znaki diakrytyczne (np. ą => a + ogonek)
        .replace(/[\u0300-\u036f]/g, '') // Usuwa ogonki
        .replace(/\s+/g, '_') // Zamienia spacje na podkreślenia
        .replace(/[^a-zA-Z0-9_.-]/g, ''); // Usuwa wszystko co nie jest literą, cyfrą, _ . -
}

export async function acceptValuation(prevState: any, formData: FormData) {
    const investmentId = formData.get('investmentId') as string;
    const file = formData.get('file') as File;

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Brak autoryzacji' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, district_id')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'rada') return { message: 'Brak uprawnień.' };

    // Walidacja pliku
    if (!file || file.size === 0 || file.type !== 'application/pdf') {
        return { message: 'Musisz załączyć Uchwałę (PDF).' };
    }

    // 1. SANITYZACJA NAZWY (Poprawka na polskie znaki)
    const cleanName = sanitizeFilename(file.name);
    const fileName = `uchwala_${Date.now()}_${cleanName}`;

    // 2. UPLOAD
    const { error: uploadError } = await supabase.storage
        .from('investments')
        .upload(fileName, file);

    // LOGOWANIE BŁĘDU (Spójrz w terminal jak wystąpi błąd)
    if (uploadError) {
        console.error('BŁĄD UPLOADU SUPABASE:', uploadError);
        return { message: `Błąd wysyłania pliku: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
        .from('investments')
        .getPublicUrl(fileName);

    // 3. UPDATE STATUSU
    const { error: dbError } = await supabase
        .from('investments')
        .update({ status: 'RD_ACCEPTED' , is_unread_rd: false, is_unread_brd: true, is_unread_urzad: true})
        .eq('id', investmentId)
        .eq('district_id', profile.district_id);

    if (dbError) {
        console.error('BŁĄD BAZY:', dbError);
        return { message: 'Błąd aktualizacji statusu.' };
    }

    // 4. HISTORIA
    await supabase.from('updates').insert({
        investment_id: investmentId,
        author_id: user.id,
        author_role: 'rada',
        type: 'FILE',
        content: 'Rada Dzielnicy zaakceptowała wycenę. Uchwała w załączniku.',
        file_url: publicUrl,
        file_name: file.name // W bazie możemy zachować oryginalną nazwę dla wyświetlania
    });

    revalidatePath(`/investments/${investmentId}`);
    return { message: null };
}

// 2. ODRZUCENIE
export async function rejectValuation(formData: FormData) {
    const investmentId = formData.get('investmentId') as string;
    const reason = formData.get('reason') as string;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('investments')
        .update({ status: 'REJECTED', is_unread_brd: true, is_unread_urzad: true })
        .eq('id', investmentId);

    await supabase.from('updates').insert({
        investment_id: investmentId,
        author_id: user.id,
        author_role: 'rada',
        type: 'STATUS_CHANGE',
        content: `Inwestycja odrzucona przez Radę. Powód: ${reason}`
    });

    revalidatePath(`/investments/${investmentId}`);
}

// 3. ODŁOŻENIE (DEFER)
export async function deferValuation(formData: FormData) {
    const investmentId = formData.get('investmentId') as string;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('investments')
        .update({ status: 'DEFERRED', is_unread_brd: true, is_unread_urzad: true })
        .eq('id', investmentId);

    await supabase.from('updates').insert({
        investment_id: investmentId,
        author_id: user.id,
        author_role: 'rada',
        type: 'STATUS_CHANGE',
        content: 'Inwestycja odłożona w czasie (brak środków/decyzja Rady).'
    });

    revalidatePath(`/investments/${investmentId}`);
}

// Zmiana sygnatury: dodajemy 'prevState' na początku
export async function resumeInvestment(prevState: any, formData: FormData) {
    const investmentId = formData.get('investmentId') as string;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Brak autoryzacji' };

    const { error } = await supabase
        .from('investments')
        .update({ status: 'VALUATION_READY', is_unread_brd: true, is_unread_urzad: true })
        .eq('id', investmentId);

    if (error) {
        return { message: 'Błąd bazy danych.' };
    }

    await supabase.from('updates').insert({
        investment_id: investmentId,
        author_id: user.id,
        author_role: 'rada',
        type: 'STATUS_CHANGE',
        content: 'Rada Dzielnicy wznowiła procedowanie inwestycji.'
    });

    revalidatePath(`/investments/${investmentId}`);

    // Zwracamy null/sukces
    return { message: null };
}

export async function updateCost(prevState: any, formData: FormData) {
    const investmentId = formData.get('investmentId') as string;
    const newCostString = formData.get('newCost') as string;
    const reason = formData.get('reason') as string;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Brak autoryzacji' };

    // Konwersja
    const newCost = parseFloat(newCostString.replace(',', '.'));
    if (isNaN(newCost) || newCost <= 0) {
        return { message: 'Podaj poprawną kwotę.' };
    }

    // UPDATE: Zmiana kosztu ORAZ zmiana statusu
    const { error } = await supabase
        .from('investments')
        .update({
            total_cost: newCost,
            status: 'COST_APPROVAL_PENDING',
            is_unread_rd: true,
            is_unread_brd: true,// <--- NOWY STATUS: Rada musi to "klepnąć"
        })
        .eq('id', investmentId);

    if (error) return { message: 'Błąd bazy danych.' };

    // Log w historii
    await supabase.from('updates').insert({
        investment_id: investmentId,
        author_id: user.id,
        author_role: 'urzad',
        type: 'COST_CHANGE',
        content: `Zaktualizowano budżet inwestycji na kwotę: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(newCost)}.\nPowód: ${reason}.\nWymagana ponowna akceptacja Rady.`,
        requires_ack_from_rd: true
    });

    revalidatePath(`/investments/${investmentId}`);
    return { message: null };
}

// 2. PRZEKAZANIE DO INNEGO WYDZIAŁU (TRANSFER)
export async function transferInvestment(prevState: any, formData: FormData) {
    const investmentId = formData.get('investmentId') as string;
    const targetDepartmentId = formData.get('targetDepartmentId') as string;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Brak autoryzacji' };

    // 1. Pobieramy nazwę nowego wydziału
    const { data: dept } = await supabase
        .from('departments')
        .select('name')
        .eq('id', targetDepartmentId)
        .single();

    const deptName = dept?.name || 'Inny Wydział';

    // --- ZMIANA KOLEJNOŚCI ---

    // 2. NAJPIERW WPIS DO TIMELINE (Kiedy jeszcze jesteś właścicielem!)
    const { error: logError } = await supabase.from('updates').insert({
        investment_id: investmentId,
        author_id: user.id,
        author_role: 'urzad',
        type: 'STATUS_CHANGE',
        content: `Przekazano prowadzenie inwestycji do jednostki: ${deptName}.`,
        requires_ack_from_dept: true
    });

    if (logError) {
        console.error('Log Error:', logError);
        // Nie przerywamy, bo log to tylko dodatek, ważniejszy jest transfer
    }

    // 3. DOPIERO TERAZ TRANSFER (Update Bazy)
    const { error } = await supabase
        .from('investments')
        .update({ department_id: targetDepartmentId, is_unread_rd: true, is_unread_brd: true })
        .eq('id', investmentId);

    if (error) {
        console.error('Transfer Error:', error);
        // Jeśli transfer się nie udał, to wpis w historii będzie trochę mylący,
        // ale w MVP to mniejsze zło niż brak wpisu przy sukcesie.
        // W idealnym świecie użylibyśmy transakcji SQL (RPC), ale tu robimy JS logic.
        return { message: 'Błąd bazy danych. Nie udało się przekazać sprawy.' };
    }

    // 4. Przekierowanie
    redirect('/urzad');
}

export async function startImplementation(prevState: any, formData: FormData) {
    const investmentId = formData.get('investmentId') as string;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Brak autoryzacji' };

    // 1. SPRAWDZENIE ROLI: Tylko BRD może dać sygnał do startu
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'brd') {
        return { message: 'Tylko Biuro Rad Dzielnic może zlecić realizację.' };
    }

    // 2. UPDATE STATUSU
    const { error } = await supabase
        .from('investments')
        .update({ status: 'IN_PROGRESS', is_unread_rd: true, is_unread_urzad: true })
        .eq('id', investmentId);

    if (error) return { message: 'Błąd bazy danych.' };

    // 3. LOG (Ważne: To powiadomi Wydział przez system "Nieprzeczytane")
    await supabase.from('updates').insert({
        investment_id: investmentId,
        author_id: user.id,
        author_role: 'brd', // <-- Zmiana autora
        type: 'STATUS_CHANGE',
        content: 'Biuro Rad Dzielnic zleciło realizację inwestycji. Wydział może przystąpić do prac.',
        requires_ack_from_dept: true // Wydział zobaczy to jako "Do zrobienia"
    });

    revalidatePath(`/investments/${investmentId}`);
    return { message: null };
}

// 2. ZAKOŃCZENIE INWESTYCJI
export async function completeInvestment(prevState: any, formData: FormData) {
    const investmentId = formData.get('investmentId') as string;
    // Opcjonalnie: można dodać pole na uwagi końcowe w formData

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Brak autoryzacji' };

    // Update statusu
    const { error } = await supabase
        .from('investments')
        .update({ status: 'COMPLETED', is_unread_rd: true, is_unread_brd: true })
        .eq('id', investmentId);

    if (error) return { message: 'Błąd bazy danych.' };

    // Log
    await supabase.from('updates').insert({
        investment_id: investmentId,
        author_id: user.id,
        author_role: 'urzad',
        type: 'STATUS_CHANGE',
        content: 'Inwestycja została zakończona i odebrana.',
    });

    revalidatePath(`/investments/${investmentId}`);
    return { message: null };
}

export async function markAsRead(formData: FormData) {
    const investmentId = formData.get('investmentId') as string;
    const pathname = formData.get('pathname') as string;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Sprawdzamy rolę, żeby wiedzieć którą flagę zgasić
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile) return;

    // Mapa: Rola -> Nazwa kolumny do zgaszenia
    const columnMap: Record<string, string> = {
        rada: 'is_unread_rada',
        urzad: 'is_unread_urzad',
        brd: 'is_unread_brd'
    };

    const columnToUpdate = columnMap[profile.role];

    if (columnToUpdate) {
        await supabase
            .from('investments')
            .update({ [columnToUpdate]: false }) // Gasimy flagę (false)
            .eq('id', investmentId);
    }

    revalidatePath(pathname);
}

