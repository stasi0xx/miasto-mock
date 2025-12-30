'use client'

import { completeInvestment } from '@/lib/actions/investments';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

function ConfirmButton({ label }: { label: string }) {
    const { pending } = useFormStatus();
    return (
        <button
            disabled={pending}
            className="py-2 px-4 rounded-lg font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md disabled:opacity-50"
        >
            {pending ? 'Zapisywanie...' : label}
        </button>
    );
}

export function ExecutionControls({
                                      investmentId,
                                      status
                                  }: {
    investmentId: string,
    status: string
}) {
    const [completeState, completeDispatch] = useActionState(completeInvestment, { message: null });
    const [confirmMode, setConfirmMode] = useState(false);

    // Wyświetlamy TYLKO jeśli jest już "W Realizacji" (bo startuje teraz BRD)
    if (status !== 'IN_PROGRESS') {
        return null;
    }

    return (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl mt-8 transition-all">
            <h3 className="text-lg font-bold text-blue-900 mb-2">Inwestycja w toku</h3>

            {/* WIDOK DOMYŚLNY */}
            {!confirmMode && (
                <>
                    <p className="text-blue-700 mb-4 text-sm">
                        Prace trwają. Po odbiorze końcowym oznacz inwestycję jako zakończoną.
                    </p>
                    <button
                        onClick={() => setConfirmMode(true)}
                        className="w-full py-3 px-6 rounded-lg font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all"
                    >
                        🏁 Zakończ Inwestycję
                    </button>
                </>
            )}

            {/* WIDOK POTWIERDZENIA */}
            {confirmMode && (
                <div className="bg-white p-4 rounded-lg border border-blue-200 animate-in fade-in zoom-in-95 duration-200">
                    <p className="font-bold text-slate-800 mb-1">Potwierdź zakończenie</p>
                    <p className="text-xs text-slate-500 mb-4">
                        Upewnij się, że dokonano odbiorów technicznych.
                    </p>

                    <form action={completeDispatch} className="flex gap-3">
                        <input type="hidden" name="investmentId" value={investmentId} />
                        <ConfirmButton label="Potwierdzam Zakończenie" />
                        <button
                            type="button"
                            onClick={() => setConfirmMode(false)}
                            className="py-2 px-4 rounded-lg font-medium text-slate-600 hover:bg-slate-100 border border-slate-200"
                        >
                            Anuluj
                        </button>
                    </form>
                    {completeState?.message && <p className="text-red-600 mt-2 text-sm">{completeState.message}</p>}
                </div>
            )}
        </div>
    );
}