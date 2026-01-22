import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { StatusBadge } from '@/components/ui/status-badge';
import { AssignDepartmentForm } from '@/components/investments/assign-department';
import Link from 'next/link';

const formatMoney = (amount: number) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(amount);

export default async function BRDDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'brd') redirect('/dashboard');

    const { data: investments } = await supabase
        .from('investments')
        .select('*, districts(name), departments(name)')
        .neq('status', 'COMPLETED')
        .order('created_at', { ascending: false });

    const { data: departments } = await supabase.from('departments').select('*');

    const newInvestments = investments?.filter(i => i.status === 'NEW') || [];
    const otherInvestments = investments?.filter(i => i.status !== 'NEW') || [];

    // @ts-ignore
    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-8 md:space-y-12 pb-24 md:pb-8">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-6 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Biuro Rad Dzielnic</h1>
                    <p className="text-slate-500 mt-1 text-sm md:text-base">Centrum sterowania</p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Do przypisania: <span className="text-lg ml-1">{newInvestments.length}</span></p>
                </div>
            </div>

            {/* SEKCJA 1: DO PRZYPISANIA (ACTIONABLE) */}
            {newInvestments.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        🔥 Nowe Wnioski (Wymagają Działania)
                    </h2>

                    {/* MOBILE LIST */}
                    <div className="md:hidden grid gap-4">
                        {newInvestments.map((inv) => (
                            <div key={inv.id} className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">NOWY</span>
                                    <span className="text-xs text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="font-bold text-slate-900 mb-1">{inv.title}</p>
                                <p className="text-xs text-slate-600 mb-4">{inv.districts?.name}</p>

                                <div className="pt-3 border-t border-blue-100">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Przypisz wydział:</p>
                                    <AssignDepartmentForm investmentId={inv.id} departments={departments || []} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden ring-4 ring-blue-50/50">
                        <table className="w-full text-left">
                            <thead className="bg-blue-50/30 border-b border-blue-100 text-slate-500 font-semibold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Inwestycja</th>
                                <th className="px-6 py-4">Dzielnica</th>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4 w-[300px]">Akcja (Przypisz Wydział)</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                            {newInvestments.map((inv) => (
                                <tr key={inv.id} className="hover:bg-blue-50/20">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-900">{inv.title}</p>
                                        <p className="text-slate-500 text-xs truncate max-w-xs">{inv.description}</p>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700 align-middle">
                                        {inv.districts?.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs align-middle">
                                        {new Date(inv.created_at).toLocaleDateString('pl-PL')}
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <AssignDepartmentForm investmentId={inv.id} departments={departments || []} />
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* SEKCJA 2: POZOSTAŁE */}
            <section>
                <h2 className="text-lg font-bold text-slate-800 mb-4">W toku</h2>

                {/* MOBILE CARDS */}
                <div className="md:hidden space-y-4">
                    {otherInvestments.map((inv) => (
                        <Link
                            key={inv.id}
                            href={`/investments/${inv.id}`}
                            className="block bg-white p-5 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98]"
                        >
                            <div className="flex justify-between mb-2">
                                <StatusBadge status={inv.status} />
                                <span className="text-xs font-mono">{inv.total_cost > 0 ? formatMoney(inv.total_cost) : '-'}</span>
                            </div>
                            <p className="font-semibold text-slate-900">{inv.title}</p>
                        </Link>
                    ))}
                </div>

                {/* DESKTOP TABLE */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-slate-100 text-slate-400 font-semibold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Nazwa</th>
                            <th className="px-6 py-4">Dzielnica</th>
                            <th className="px-6 py-4">Przypisany Wydział</th>
                            <th className="px-6 py-4 text-right">Budżet</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                        {otherInvestments.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50 group">
                                <td className="px-6 py-4 align-middle"><StatusBadge status={inv.status} /></td>
                                <td className="px-6 py-4 font-medium text-slate-900 align-middle">{inv.title}</td>
                                <td className="px-6 py-4 text-slate-600 align-middle">{inv.districts?.name}</td>
                                <td className="px-6 py-4 text-slate-600 align-middle">
                                    {inv.departments?.name || <span className="text-red-400 text-xs">Brak</span>}
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-slate-700 align-middle">
                                    {inv.total_cost > 0 ? formatMoney(inv.total_cost) : '-'}
                                </td>
                                <td className="px-6 py-4 text-right align-middle">
                                    <Link
                                        href={`/investments/${inv.id}`}
                                        className="text-slate-400 hover:text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        ➝
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}