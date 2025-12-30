import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';
import { UnreadAlert } from '@/components/dashboard/unread-alert';

export default async function RadaDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // 1. Pobieramy profil
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'rada') redirect('/dashboard');

    // 2. Pobieramy Inwestycje
    // Pobieramy wszystko co należy do dzielnicy i nie jest zakończone
    const { data: allInvestments } = await supabase
        .from('investments')
        .select('*, districts(name), departments(name)')
        .eq('district_id', profile.district_id)
        .neq('status', 'COMPLETED') // Ukrywamy zakończone
        .neq('status', 'REJECTED')  // Ukrywamy odrzucone
        .order('updated_at', { ascending: false });

    // 3. Proste filtrowanie po flagach (True/False)
    // Jeśli flaga jest TRUE -> Nieprzeczytane (Góra)
    // Jeśli flaga jest FALSE/NULL -> Przeczytane (Dół)
    const unreadInvestments = allInvestments?.filter(inv => inv.is_unread_rd === true) || [];
    const readInvestments = allInvestments?.filter(inv => inv.is_unread_rd !== true) || [];

    console.log(unreadInvestments);

    return (
        <div className="max-w-[1600px] mx-auto p-8 space-y-12 pb-32">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Panel Rady Dzielnicy</h1>
                    <p className="text-slate-500 mt-2">
                        Dzielnica: <strong>
                        {allInvestments?.[0]?.districts?.name || 'Twoja Dzielnica'}
                    </strong>
                    </p>
                </div>

                <Link
                    href="/rada/nowa-inwestycja"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                >
                    <span>+</span> Nowy Wniosek
                </Link>
            </div>

            {/* SEKCJA 1: SKRZYNKA ODBIORCZA (NIEPRZECZYTANE) */}
            {unreadInvestments.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        🔔 Wymagają Twojej uwagi
                        <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full shadow-sm animate-pulse">
              {unreadInvestments.length}
            </span>
                    </h2>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 shadow-inner space-y-4">
                        {unreadInvestments.map((inv) => (
                            <UnreadAlert key={inv.id} investment={inv} />
                        ))}
                    </div>
                </div>
            )}

            {/* SEKCJA 2: POZOSTAŁE SPRAWY */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    📂 Wszystkie aktywne sprawy
                    <span className="text-slate-400 text-sm font-normal">({readInvestments.length})</span>
                </h2>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Nazwa Inwestycji</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Wydział</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Koszt</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                            <th className="px-6 py-4 text-right">Akcja</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">

                        {/* PUSTO */}
                        {readInvestments.length === 0 && unreadInvestments.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                                    Brak aktywnych wniosków.
                                </td>
                            </tr>
                        )}

                        {/* WSZYSTKO NA GÓRZE */}
                        {readInvestments.length === 0 && unreadInvestments.length > 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic bg-slate-50/30">
                                    Wszystkie sprawy oczekują na przejrzenie w sekcji powyżej ⬆️
                                </td>
                            </tr>
                        )}

                        {readInvestments.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {inv.title}
                                </td>
                                <td className="px-6 py-4 text-slate-600">

                                    {inv.departments?.name || '-'}
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-slate-700">
                                    {inv.total_cost > 0
                                        ? new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(inv.total_cost)
                                        : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={inv.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={`/investments/${inv.id}`}
                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs uppercase tracking-wide px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                    >
                                        Szczegóły →
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