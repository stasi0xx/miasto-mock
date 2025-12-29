'use client'

import { useActionState } from 'react';
import { createInvestment } from '@/lib/actions/investments';
import { useFormStatus } from 'react-dom';

// Komponent przycisku (musi być oddzielny, żeby użyć useFormStatus)
function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-slate-900 text-white py-2 px-4 rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
            {pending ? 'Wysyłanie...' : 'Zgłoś do wyceny'}
        </button>
    );
}

export function CreateInvestmentForm() {
    // useActionState zastępuje useFormState w React 19
    const initialState = { message: null, errors: {} };
    const [state, dispatch] = useActionState(createInvestment, initialState);

    return (
        <form action={dispatch} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">

            {/* Tytuł */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                    Nazwa Inwestycji
                </label>
                <input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="np. Remont chodnika na ul. Lipowej"
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    aria-describedby="title-error"
                />
                {state.errors?.title && (
                    <p id="title-error" className="mt-1 text-sm text-red-500">
                        {state.errors.title.join(', ')}
                    </p>
                )}
            </div>

            {/* Opis */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                    Opis i Uzasadnienie
                </label>
                <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Opisz zakres prac..."
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    aria-describedby="desc-error"
                />
                {state.errors?.description && (
                    <p id="desc-error" className="mt-1 text-sm text-red-500">
                        {state.errors.description.join(', ')}
                    </p>
                )}
            </div>

            {/* Błąd globalny formularza */}
            {state.message && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                    {state.message}
                </div>
            )}

            <SubmitButton />
        </form>
    );
}