// components/investments/add-update-form.tsx
'use client';

import { useActionState } from 'react'; // React 19
import { addInvestmentUpdate } from '@/lib/actions/updates';
import { useFormStatus } from 'react-dom';

// Mały komponent przycisku, żeby obsłużyć stan pending
function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
            {pending ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Wysyłanie...
                </>
            ) : (
                <>✉️ Wyślij Wiadomość</>
            )}
        </button>
    );
}

export function AddUpdateForm({ investmentId }: { investmentId: string }) {
    const initialState = { message: null, errors: {} };
    // Bindujemy ID inwestycji do akcji, żeby nie przesyłać go w hidden input (security)
    const addUpdateWithId = addInvestmentUpdate.bind(null, investmentId);

    const [state, dispatch] = useActionState(addUpdateWithId, initialState);

    return (
        <form action={dispatch} className="space-y-6">

            {/* Global Error Message */}
            {state.message && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm font-medium">
                    ⚠️ {state.message}
                </div>
            )}

            {/* TEXT AREA */}
            <div>
                <label htmlFor="content" className="block text-sm font-semibold text-slate-700 mb-2">
                    Treść wiadomości
                </label>
                <textarea
                    id="content"
                    name="content"
                    rows={5}
                    placeholder="Wpisz treść wiadomości, uzasadnienie lub komentarz..."
                    className="w-full rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
                {state.errors?.content && (
                    <p className="mt-1 text-sm text-red-500">{state.errors.content[0]}</p>
                )}
            </div>

            {/* FILE UPLOAD */}
            <div>
                <label htmlFor="file" className="block text-sm font-semibold text-slate-700 mb-2">
                    Załącznik (PDF, max 5MB)
                </label>
                <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors group">
                    <input
                        type="file"
                        id="file"
                        name="file"
                        accept="application/pdf"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="pointer-events-none">
                        <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform">📄</span>
                        <span className="text-sm text-slate-500 group-hover:text-slate-800">
                    Kliknij lub przeciągnij plik PDF tutaj
                </span>
                    </div>
                </div>
                {state.errors?.file && (
                    <p className="mt-1 text-sm text-red-500">{state.errors.file[0]}</p>
                )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
                <SubmitButton />
            </div>
        </form>
    );
}