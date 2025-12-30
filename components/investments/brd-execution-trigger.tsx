'use client'

import { startImplementation } from '@/lib/actions/investments';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            disabled={pending}
            className="w-full py-3 px-6 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all disabled:opacity-50"
        >
            {pending ? 'Przetwarzanie...' : '🚀 Zleć Realizację Wydziałowi'}
        </button>
    );
}

export function BrdExecutionTrigger({ investmentId }: { investmentId: string }) {
    const [state, dispatch] = useActionState(startImplementation, { message: null });
    const [showConfirm, setShowConfirm] = useState(false);

    if (!showConfirm) {
        return (
            <div className="bg-white border-2 border-emerald-100 p-6 rounded-xl mt-8 shadow-sm">
                <h3 className="text-lg font-bold text-emerald-900 mb-2">Zlecenie Realizacji</h3>
                <p className="text-slate-600 mb-4 text-sm">
                    Rada Dzielnicy dostarczyła uchwałę. Kliknij poniżej, aby oficjalnie przekazać inwestycję do realizacji właściwemu wydziałowi.
                </p>
                <button
                    onClick={() => setShowConfirm(true)}
                    className="bg-emerald-600 text-white font-bold py-2 px-4 rounded hover:bg-emerald-700 transition"
                >
                    Rozpocznij Procedurę
                </button>
            </div>
        );
    }

    return (
        <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-xl mt-8 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-emerald-900 mb-1">Potwierdź Zlecenie</h3>
            <p className="text-xs text-emerald-700 mb-4">
                Status zmieni się na "W Realizacji". Wydział otrzyma powiadomienie o konieczności rozpoczęcia prac.
            </p>

            <form action={dispatch} className="flex gap-3">
                <input type="hidden" name="investmentId" value={investmentId} />
                <SubmitButton />
                <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition"
                >
                    Anuluj
                </button>
            </form>
            {state?.message && <p className="text-red-600 mt-2 font-bold">{state.message}</p>}
        </div>
    );
}