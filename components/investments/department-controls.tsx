'use client'

import { updateCost, transferInvestment } from '@/lib/actions/investments';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

type Department = { id: string; name: string };

function SubmitButton({ label, color = 'bg-slate-900' }: { label: string, color?: string }) {
    const { pending } = useFormStatus();
    return (
        <button
            disabled={pending}
            className={`w-full py-2 px-4 rounded-lg font-bold text-white transition-all shadow-sm disabled:opacity-50 text-sm ${color} hover:opacity-90`}
        >
            {pending ? 'Przetwarzanie...' : label}
        </button>
    );
}

// Definiujemy bezpieczny stan początkowy dla TypeScripta
const initialState = { message: null as string | null };

export function DepartmentControls({
                                       investmentId,
                                       departments,
                                       currentCost
                                   }: {
    investmentId: string,
    departments: Department[],
    currentCost: number
}) {
    const [activeTab, setActiveTab] = useState<'COST' | 'TRANSFER' | null>(null);

    // POPRAWKA: Używamy 'initialState' z jawnym typem (string | null)
    const [costState, costDispatch] = useActionState(updateCost, initialState);
    const [transferState, transferDispatch] = useActionState(transferInvestment, initialState);

    if (!activeTab) {
        return (
            <div className="grid grid-cols-2 gap-4 mt-8">
                <button
                    onClick={() => setActiveTab('COST')}
                    className="border border-slate-300 bg-white p-4 rounded-xl text-slate-700 font-bold hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                    💰 Zmień Kosztorys
                </button>
                <button
                    onClick={() => setActiveTab('TRANSFER')}
                    className="border border-slate-300 bg-white p-4 rounded-xl text-slate-700 font-bold hover:border-orange-500 hover:text-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                    ⇄ Przekaż Sprawę
                </button>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mt-8 relative animate-in fade-in slide-in-from-top-2">
            <button
                onClick={() => setActiveTab(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-sm"
            >
                ✕ Anuluj
            </button>

            {/* --- ZMIANA KOSZTÓW --- */}
            {activeTab === 'COST' && (
                <form action={costDispatch} className="space-y-4">
                    <input type="hidden" name="investmentId" value={investmentId} />
                    <h3 className="text-lg font-bold text-slate-900">Aktualizacja Budżetu</h3>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nowa Kwota Całkowita (PLN)</label>
                        <input
                            type="text"
                            name="newCost"
                            defaultValue={currentCost}
                            className="w-full p-2 border border-slate-300 rounded font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Powód zmiany (Uzasadnienie)</label>
                        <textarea
                            name="reason"
                            rows={2}
                            required
                            placeholder="np. Wzrost cen materiałów budowlanych..."
                            className="w-full p-2 border border-slate-300 rounded text-sm"
                        ></textarea>
                    </div>

                    {costState?.message && <p className="text-red-600 text-sm font-bold">{costState.message}</p>}
                    <SubmitButton label="Zatwierdź Nowy Koszt" color="bg-blue-600" />
                </form>
            )}

            {/* --- TRANSFER --- */}
            {activeTab === 'TRANSFER' && (
                <form action={transferDispatch} className="space-y-4">
                    <input type="hidden" name="investmentId" value={investmentId} />
                    <h3 className="text-lg font-bold text-slate-900">Przekazanie Inwestycji</h3>
                    <p className="text-sm text-slate-600 bg-orange-100 p-3 rounded border border-orange-200">
                        ⚠️ Uwaga: Po przekazaniu sprawy Twój wydział straci możliwość jej edycji. Sprawa zniknie z Waszej listy "Do zrobienia".
                    </p>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Wybierz Wydział Docelowy</label>

                        <select
                            name="targetDepartmentId"
                            required
                            defaultValue=""
                            className="w-full p-2 border border-slate-300 rounded bg-white"
                        >
                            <option value="" disabled>-- Wybierz z listy --</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>

                    </div>

                    {transferState?.message && <p className="text-red-600 text-sm font-bold">{transferState.message}</p>}
                    <SubmitButton label="Przekaż Inwestycję" color="bg-orange-600" />
                </form>
            )}
        </div>
    );
}