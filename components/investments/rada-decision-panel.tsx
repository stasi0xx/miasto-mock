'use client'

import { acceptValuation, rejectValuation, deferValuation, resumeInvestment } from '@/lib/actions/investments';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

function SubmitButton({ label, color }: { label: string, color: string }) {
    const { pending } = useFormStatus();
    return (
        <button
            disabled={pending}
            className={`w-full py-2 px-4 rounded-lg font-bold text-white transition-all shadow-md disabled:opacity-50 ${color}`}
        >
            {pending ? 'Przetwarzanie...' : label}
        </button>
    );
}

// Dodajemy prop 'currentStatus'
export function RadaDecisionPanel({
                                      investmentId,
                                      currentStatus
                                  }: {
    investmentId: string,
    currentStatus: string
}) {
    const [decision, setDecision] = useState<'ACCEPT' | 'REJECT' | 'DEFER' | null>(null);

    // Istniejący hook dla akceptacji
    const [acceptState, acceptDispatch] = useActionState(acceptValuation, { message: null });

    // NOWY HOOK DLA WZNOWIENIA (Fix dla linii 39)
    const [resumeState, resumeDispatch] = useActionState(resumeInvestment, { message: null });

    if (currentStatus === 'COST_APPROVAL_PENDING') {
        return (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 shadow-sm relative">
                <div className="flex items-start gap-4">
                    <div className="text-4xl">💰</div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-blue-900 mb-2">Zmiana Kosztorysu</h3>
                        <p className="text-blue-800 mb-4">
                            Wydział zaktualizował koszty inwestycji. Wymagana jest nowa uchwała Rady Dzielnicy akceptująca zmianę budżetu.
                        </p>

                        {/* Formularz Akceptacji Zmiany (Używamy tej samej akcji acceptValuation, bo ona robi dokładnie to co chcemy: Status -> RD_ACCEPTED + PDF) */}
                        <form action={acceptDispatch} className="bg-white p-4 rounded-lg border border-blue-100">
                            <input type="hidden" name="investmentId" value={investmentId} />

                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Załącz Nową Uchwałę (PDF)
                            </label>
                            <input
                                type="file"
                                name="file"
                                accept="application/pdf"
                                required
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 mb-4"
                            />

                            {acceptState?.message && (
                                <p className="text-red-600 font-bold text-sm mb-2">⚠️ {acceptState.message}</p>
                            )}

                            <div className="flex gap-3">
                                <SubmitButton label="Zatwierdź Nowy Koszt" color="bg-blue-600 hover:bg-blue-700" />

                                {/* Opcjonalnie Odrzucenie - jeśli chcesz */}
                                {/* <button type="button" className="...">Odrzuć</button> */}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // SCENARIUSZ 1: INWESTYCJA JEST ODŁOŻONA -> POKAZUJEMY "WZNÓW"
    if (currentStatus === 'DEFERRED') {
        return (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-8 text-center shadow-sm">
                <h3 className="text-xl font-bold text-orange-900 mb-2">Inwestycja Odłożona</h3>
                <p className="text-orange-700 mb-6">
                    Ta inwestycja została odłożona w czasie. Jeśli Rada ma środki lub zmieniła zdanie, możecie wznowić proces.
                </p>

                {/* TUTAJ ZMIANA: action={resumeDispatch} zamiast resumeInvestment */}
                <form action={resumeDispatch}>
                    <input type="hidden" name="investmentId" value={investmentId} />

                    {/* Opcjonalnie wyświetl błąd */}
                    {resumeState?.message && (
                        <p className="text-red-600 font-bold text-sm mb-2">{resumeState.message}</p>
                    )}

                    <SubmitButton label="↺ Wznów Procedowanie (Wróć do Decyzji)" color="bg-orange-600 hover:bg-orange-700" />
                </form>
            </div>
        );
    }

    // SCENARIUSZ 2: MENU GŁÓWNE (VALUATION_READY)
    if (!decision) {
        return (
            <div className="bg-white border-2 border-slate-200 rounded-xl p-8 text-center shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Decyzja Rady Dzielnicy</h3>
                <p className="text-slate-500 mb-6">Wycena jest gotowa. Jakie kroki podejmuje Rada?</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setDecision('ACCEPT')}
                        className="p-6 rounded-xl border-2 border-green-100 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all group"
                    >
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">✅</div>
                        <div className="font-bold text-green-800">Akceptujemy</div>
                        <div className="text-xs text-green-600 mt-1">Mamy środki, wrzucamy uchwałę</div>
                    </button>

                    <button
                        onClick={() => setDecision('DEFER')}
                        className="p-6 rounded-xl border-2 border-orange-100 bg-orange-50 hover:bg-orange-100 hover:border-orange-300 transition-all group"
                    >
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">zzz</div>
                        <div className="font-bold text-orange-800">Odkładamy</div>
                        <div className="text-xs text-orange-600 mt-1">Brak środków w tym roku</div>
                    </button>

                    <button
                        onClick={() => setDecision('REJECT')}
                        className="p-6 rounded-xl border-2 border-red-100 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all group"
                    >
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">⛔</div>
                        <div className="font-bold text-red-800">Odrzucamy</div>
                        <div className="text-xs text-red-600 mt-1">Rezygnujemy z inwestycji</div>
                    </button>
                </div>
            </div>
        );
    }

    // SCENARIUSZ 3: FORMULARZE SZCZEGÓŁOWE
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 relative">
            <button
                onClick={() => setDecision(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
                ✕ Anuluj
            </button>

            {/* 1. AKCEPTACJA */}
            {decision === 'ACCEPT' && (
                <form action={acceptDispatch} className="space-y-4">
                    <input type="hidden" name="investmentId" value={investmentId} />
                    <h3 className="text-lg font-bold text-green-800">Zatwierdzenie Inwestycji</h3>
                    <p className="text-sm text-slate-600">Aby przejść dalej, musisz załączyć plik PDF z podjętą uchwałą.</p>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Uchwała Rady (PDF)</label>
                        <input type="file" name="file" accept="application/pdf" required className="w-full text-sm" />
                    </div>

                    {acceptState?.message && (
                        <p className="text-red-600 text-sm font-bold">⚠️ {acceptState.message}</p>
                    )}

                    <SubmitButton label="Zatwierdź i Wyślij do Biura" color="bg-green-600 hover:bg-green-700" />
                </form>
            )}

            {/* 2. ODŁOŻENIE */}
            {decision === 'DEFER' && (
                <form action={deferValuation} className="space-y-4">
                    <input type="hidden" name="investmentId" value={investmentId} />
                    <h3 className="text-lg font-bold text-orange-800">Odłożenie Inwestycji</h3>
                    <p className="text-sm text-slate-600">Status zmieni się na "Odłożone". Będzie można wrócić do tematu później.</p>
                    <SubmitButton label="Potwierdź Odłożenie" color="bg-orange-500 hover:bg-orange-600" />
                </form>
            )}

            {/* 3. ODRZUCENIE */}
            {decision === 'REJECT' && (
                <form action={rejectValuation} className="space-y-4">
                    <input type="hidden" name="investmentId" value={investmentId} />
                    <h3 className="text-lg font-bold text-red-800">Odrzucenie Inwestycji</h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Powód odrzucenia (Opcjonalnie)</label>
                        <textarea name="reason" rows={3} className="w-full p-2 border rounded" placeholder="np. Zbyt wysokie koszty..."></textarea>
                    </div>

                    <SubmitButton label="Potwierdź Odrzucenie" color="bg-red-600 hover:bg-red-700" />
                </form>
            )}
        </div>
    );
}