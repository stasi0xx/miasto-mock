'use client'

import { useActionState } from 'react'
import { login } from '@/lib/actions/auth'
import { useFormStatus } from 'react-dom'

function LoginButton() {
    const { pending } = useFormStatus()
    return (
        <button
            disabled={pending}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
            {pending ? 'Logowanie...' : 'Zaloguj się'}
        </button>
    )
}

export default function LoginPage() {
    const [state, dispatch] = useActionState(login, null)

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form action={dispatch} className="bg-white p-8 rounded shadow-md w-96 space-y-4">
                <h1 className="text-2xl font-bold mb-4 text-center">System Inwestycji</h1>

                <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input name="email" type="email" required className="w-full border p-2 rounded" />
                </div>

                <div>
                    <label className="block text-sm mb-1">Hasło</label>
                    <input name="password" type="password" required className="w-full border p-2 rounded" />
                </div>

                {state?.message && (
                    <p className="text-red-500 text-sm text-center">{state.message}</p>
                )}

                <LoginButton />
            </form>
        </div>
    )
}