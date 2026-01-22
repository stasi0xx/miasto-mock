import { createClient } from '@/utils/supabase/server';
import { StatusBadge } from '@/components/ui/status-badge';
import { SearchFilters } from '@/components/investments/search-filters';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// Helper: Formatowanie waluty z użyciem "tabular nums" dla równego wyrównania
const formatMoney = (amount: number) =>
    new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0
    }).format(amount);

export default async function AllInvestmentsPage({
                                                     searchParams,
                                                 }: {
    searchParams: Promise<{ q?: string; status?: string }>;
}) {
    const params = await searchParams;
    const queryTerm = params.q || '';
    const statusFilter = params.status || '';

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    let query = supabase
        .from('investments')
        .select('*, districts(name), departments(name)')
        .order('created_at', { ascending: false });

    if (queryTerm) query = query.ilike('title', `%${queryTerm}%`);
    if (statusFilter && statusFilter !== 'ALL') query = query.eq('status', statusFilter);

    const { data: investments } = await query;

    return (
        <div className="w-full space-y-8 max-w-[1600px] mx-auto">

            {/* HEADER: Nowoczesny i czysty */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Rejestr Inwestycji</h1>
                    <p className="text-slate-500 mt-2 text-sm max-w-2xl">
                        Zarządzaj i monitoruj status wszystkich zadań inwestycyjnych w Twojej jednostce.
                    </p>
                </div>
                {/* Tu można dodać przycisk eksportu lub statystyki w przyszłości */}
            </div>

            {/* FILTRY */}
            <SearchFilters />

            {/* --- MODERN DESKTOP TABLE --- */}
            <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="border-b border-slate-100 bg-white">
                        <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider text-slate-400 w-[40%]">Inwestycja</th>
                        <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Lokalizacja</th>
                        <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Jednostka</th>
                        <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Budżet</th>
                        <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">Status</th>
                        <th className="px-6 py-5 w-[60px]"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                    {investments?.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 text-sm">Brak wyników dla podanych filtrów.</td></tr>
                    ) : (
                        investments?.map((inv) => (
                            <tr key={inv.id} className="group hover:bg-slate-50/80 transition-colors duration-200">
                                <td className="px-6 py-4 align-top">
                                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                        {inv.title}
                      </span>
                                        <span className="text-xs text-slate-500 font-normal line-clamp-1 max-w-[400px]">
                        {inv.description}
                      </span>
                                    </div>
                                </td>

                                <td className="px-6 py-4 align-middle">
                     <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                        {inv.districts?.name || 'Ogólnomiejskie'}
                     </span>
                                </td>

                                <td className="px-6 py-4 align-middle">
                                    {inv.departments?.name ? (
                                        <div className="text-sm text-slate-700 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                            {inv.departments.name}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">Do przydzielenia</span>
                                    )}
                                </td>

                                <td className="px-6 py-4 align-middle text-right">
                    <span className={`font-mono text-sm ${inv.total_cost > 0 ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                      {inv.total_cost > 0 ? formatMoney(inv.total_cost) : '—'}
                    </span>
                                </td>

                                <td className="px-6 py-4 align-middle text-center">
                                    <div className="inline-flex justify-center">
                                        <StatusBadge status={inv.status} />
                                    </div>
                                </td>

                                <td className="px-6 py-4 align-middle text-right">
                                    <Link
                                        href={`/investments/${inv.id}`}
                                        className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                        title="Zobacz szczegóły"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                    </Link>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>

                {/* FOOTER TABELI */}
                <div className="bg-slate-50/50 px-6 py-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                    <span>Wyświetlono <strong>{investments?.length || 0}</strong> pozycji</span>
                    <div className="flex gap-2 opacity-50 cursor-not-allowed">
                        <span>&larr; Poprzednia</span>
                        <span>Następna &rarr;</span>
                    </div>
                </div>
            </div>

            {/* --- MOBILE VIEW (CARDS) - Zachowane z poprzedniego kroku --- */}
            <div className="md:hidden space-y-4">
                {investments?.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 bg-white rounded-lg border border-slate-200">
                        Brak wyników.
                    </div>
                ) : (
                    investments?.map((inv) => (
                        <Link
                            key={inv.id}
                            href={`/investments/${inv.id}`}
                            className="block bg-white p-5 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-transform"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <StatusBadge status={inv.status} />
                                <span className="text-xs font-mono font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                  {inv.total_cost > 0 ? formatMoney(inv.total_cost) : 'Wycena'}
                </span>
                            </div>

                            <h3 className="font-semibold text-slate-900 text-base mb-1">{inv.title}</h3>
                            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{inv.description}</p>

                            <div className="flex items-center gap-3 text-xs text-slate-500 border-t border-slate-50 pt-3">
                <span className="flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    {inv.districts?.name || 'Ogólnomiejskie'}
                </span>
                                {inv.departments?.name && (
                                    <span className="flex items-center gap-1.5 truncate max-w-[150px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                        {inv.departments.name}
                  </span>
                                )}
                            </div>
                        </Link>
                    ))
                )}
            </div>

        </div>
    );
}