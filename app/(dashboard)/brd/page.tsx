import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { StatusBadge } from '@/components/ui/status-badge'; // Używamy Twojego istniejącego badge'a
import { AssignDepartmentForm } from '@/components/investments/assign-department';
import Link from 'next/link';

export default async function BRDDashboard() {
    const supabase = await createClient();

    // 1. Sprawdzenie Roli (Security)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'brd') redirect('/dashboard');

    // 2. Pobranie Danych (Inwestycje + Wydziały + Dzielnice)
    // Pobieramy wszystko, bo BRD widzi wszystko
    const { data: investments } = await supabase
        .from('investments')
        .select('*, districts(name), departments(name)')
        .neq('status', 'COMPLETED')
        .order('created_at', { ascending: false });

    const { data: departments } = await supabase
        .from('departments')
        .select('*');

    // 3. Podział na grupy (Client-side logic on server is fine here)
    const newInvestments = investments?.filter(i => i.status === 'NEW') || [];
    const otherInvestments = investments?.filter(i => i.status !== 'NEW') || [];

    // @ts-ignore
    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-12">

            <div className="flex justify-between items-end border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Biuro Rad Dzielnic</h1>
                    <p className="text-slate-500 mt-1">Centrum zarządzania inwestycjami miejskimi</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-600">Do przypisania: <span className="text-blue-600 text-xl">{newInvestments.length}</span></p>
                </div>
            </div>

            {/* SEKCJA 1: DO PRZYPISANIA (ACTIONABLE) */}
            {newInvestments.length > 0 && (
                <section className="bg-blue-50/50 border border-blue-100 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        🔥 Nowe Wnioski (Wymagają Działania)
                    </h2>
                    <div className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Inwestycja</th>
                                <th className="px-6 py-3">Dzielnica</th>
                                <th className="px-6 py-3">Data</th>
                                <th className="px-6 py-3">Akcja (Przypisz Wydział)</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {newInvestments.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-900">{inv.title}</p>
                                        <p className="text-slate-500 text-xs truncate max-w-md">{inv.description}</p>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700">

                                        {inv.districts?.[0]?.name || inv.districts?.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {new Date(inv.created_at).toLocaleDateString('pl-PL')}
                                    </td>
                                    <td className="px-6 py-4">
                                        {/* KOMPONENT PRZYPISYWANIA */}
                                        <AssignDepartmentForm
                                            investmentId={inv.id}
                                            departments={departments || []}
                                        />
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* SEKCJA 2: POZOSTAŁE (READ ONLY) */}
            <section>
                <h2 className="text-lg font-bold text-slate-800 mb-4">Wszystkie Inwestycje w Toku</h2>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Nazwa</th>
                            <th className="px-6 py-3">Dzielnica</th>
                            <th className="px-6 py-3">Przypisany Wydział</th>
                            <th className="px-6 py-3 text-right">Budżet</th>
                            <th className="px-6 py-3 text-right"></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {otherInvestments.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50 group">
                                <td className="px-6 py-4">

                                    <StatusBadge status={inv.status} />
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {inv.title}
                                </td>
                                <td className="px-6 py-4 text-slate-600">

                                    {inv.districts?.[0]?.name || inv.districts?.name}
                                </td>
                                <td className="px-6 py-4 text-slate-600">

                                    {inv.departments?.[0]?.name || inv.departments?.name || '-'}
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-slate-700">
                                    {inv.total_cost > 0
                                        ? new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(inv.total_cost)
                                        : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={`/investments/${inv.id}`}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-xs uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Szczegóły
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {otherInvestments.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    Brak innych inwestycji.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </section>

        </div>
    );
}