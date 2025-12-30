'use client'

import { submitValuation } from '@/lib/actions/investments';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50"
        >
            {pending ? 'Przesyłanie...' : 'Zatwierdź Wycenę i Prześlij do Rady'}
        </button>
    );
}

export function ValuationForm({ investmentId }: { investmentId: string }) {
    const initialState = { message: null };
    const [state, dispatch] = useActionState(submitValuation, initialState);

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Wycena Inwestycji (Metryczka)</h3>

            <form action={dispatch} className="space-y-4">
                <input type="hidden" name="investmentId" value={investmentId} />

                {/* KWOTA */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Całkowity Koszt Realizacji (PLN)
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            name="cost"
                            placeholder="np. 45000,00"
                            required
                            pattern="[0-9]+([.,][0-9]+)?"
                            className="w-full p-3 pl-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <span className="text-slate-500 font-bold">PLN</span>
                        </div>
                    </div>
                </div>

                {/* PLIK PDF */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Metryczka (PDF)
                    </label>
                    <input
                        type="file"
                        name="file"
                        accept="application/pdf"
                        required
                        className="w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-slate-400 mt-1">Tylko pliki PDF. Maksymalny rozmiar 5MB.</p>
                </div>

                {/* BŁĘDY */}
                {state?.message && (
                    <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg font-medium">
                        ⚠️ {state.message}
                    </div>
                )}

                <SubmitButton />
            </form>
        </div>
    );
}