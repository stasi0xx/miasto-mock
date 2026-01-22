import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';
import { UnreadAlert } from '@/components/dashboard/unread-alert';

const formatMoney = (amount: number) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(amount);

export default async function UrzadDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || profile.role !== 'urzad') redirect('/dashboard');
    if (!profile.department_id) return <div className="p-8 text-red-600">Brak przypisanego wydziału.</div>;

    const { data: allInvestments } = await supabase
        .from('investments')
        .select('*, districts(name), departments(name)')
        .neq('status', 'COMPLETED')
        .eq('department_id', profile.department_id)
        .order('updated_at', { ascending: false });

    const unreadInvestments = allInvestments?.filter(inv => inv.is_unread_urzad === true) || [];
    const readInvestments = allInvestments?.filter(inv => inv.is_unread_urzad !== true) || [];

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-8 md:space-y-12 pb-24 md:pb-8">

            {/* HEADER */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Panel Wydziału</h1>
                <p className="text-slate-500 mt-1 text-sm md:text-base">
                    Jednostka: <strong className="text-slate-900">{allInvestments?.[0]?.departments?.name || 'Twój Wydział'}</strong>
                </p>
            </div>

            {/* SEKCJA 1: INBOX */}
            {unreadInvestments.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        📥 Skrzynka Odbiorcza
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                            {unreadInvestments.length}
                        </span>
                    </h2>
                    <div className="border-l-4 border-slate-300 pl-4 space-y-3">
                        {unreadInvestments.map((inv) => (
                            <UnreadAlert key={inv.id} investment={inv} />
                        ))}
                    </div>
                </div>
            )}

            {/* SEKCJA 2: ZADANIA */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    📋 Bieżące Zadania
                    <span className="text-slate-400 text-sm font-normal">({readInvestments.length})</span>
                </h2>

                {/* --- MOBILE CARDS --- */}
                <div className="md:hidden space-y-4">
                    {readInvestments.map((inv) => (
                        <Link
                            key={inv.id}
                            href={`/investments/${inv.id}`}
                            className="block bg-white p-5 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <StatusBadge status={inv.status} />
                                <span className="text-xs font-mono font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded">
                                    {inv.total_cost > 0 ? formatMoney(inv.total_cost) : 'Wycena'}
                                </span>
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-1">{inv.title}</h3>
                            <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-500">
                                <span>📍 {inv.districts?.name || 'Ogólnomiejskie'}</span>
                            </div>
                        </Link>
                    ))}
                    {readInvestments.length === 0 && unreadInvestments.length === 0 && (
                        <div className="text-center py-10 text-slate-500">Brak zadań.</div>
                    )}
                </div>

                {/* --- DESKTOP TABLE --- */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Inwestycja</th>
                            <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Dzielnica (Klient)</th>
                            <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Budżet</th>
                            <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">Status</th>
                            <th className="px-6 py-5 w-[100px]"></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                        {readInvestments.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-6 py-4 font-medium text-slate-900 align-middle">
                                    {inv.title}
                                </td>
                                <td className="px-6 py-4 text-slate-600 align-middle">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                                        {inv.districts?.name || '-'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-sm text-slate-700 align-middle">
                                    {inv.total_cost > 0 ? formatMoney(inv.total_cost) : '—'}
                                </td>
                                <td className="px-6 py-4 text-center align-middle">
                                    <div className="inline-flex"><StatusBadge status={inv.status} /></div>
                                </td>
                                <td className="px-6 py-4 text-right align-middle">
                                    <Link
                                        href={`/investments/${inv.id}`}
                                        className="text-sm font-medium text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        Otwórz
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}