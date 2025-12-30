'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export async function login(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const validated = loginSchema.safeParse(data)

    if (!validated.success) {
        return { message: 'Nieprawidłowe dane logowania' }
    }

    // 1. Logowanie w Auth
    const { data: authData, error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { message: error.message }
    }

    // 2. Pobranie roli z tabeli profiles
    // UWAGA: Zakładam, że masz tabelę 'profiles' z kolumną 'role' zgodnie z moimi poprzednimi instrukcjami SQL.
    if (authData.user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single()

        if (!profile) {
            // Fallback jeśli user jest w auth, ale nie ma profilu (błąd danych)
            return { message: 'Błąd konta użytkownika: Brak profilu.' }
        }

        // 3. Logika przekierowań
        switch (profile.role) {
            case 'rada':
                redirect('/rada')
                break // unreachable code after redirect, ale dla porządku
            case 'urzad':
                redirect('/urzad')
                break
            case 'brd':
                redirect('/brd')
                break
            default:
                redirect('/dashboard') // Fallback
        }
    }

    revalidatePath('/', 'layout')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login') // Wracamy do logowania
}