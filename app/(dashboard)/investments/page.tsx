import { createClient } from '@/utils/supabase/server';
import { StatusBadge } from '@/components/ui/status-badge';
import { SearchFilters } from '@/components/investments/search-filters';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AllInvestmentsPage({
                                                     searchParams,
                                                 }: {
    searchParams: Promise<{ q?: string; status?: string }>;
}) {
    const params = await searchParams;
    const queryTerm = params.q || '';
    const statusFilter = params.status || '';

    const supabase = await createClient();

    // Security Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Budowanie zapytania
    // RLS zadba o to, żeby Rada nie widziała cudzych, nawet jak usunie filtry.
    let query = supabase
        .from('investments')
        .select('*, districts(name), departments(name)')
        .order('created_at', { ascending: false });

    // Aplikowanie filtrów UI
    if (queryTerm) {
        query = query.ilike('title', `%${queryTerm}%`);
    }

    if (statusFilter && statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
    }

    const { data: investments, error } = await query;

    return (
        <div className="max-w-[1600px] mx-auto p-8 space-y-8">

            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Rejestr Inwestycji</h1>
                <p className="text-slate-500 mt-2">Przeglądaj wszystkie inwestycje dostępne dla Twojej jednostki.</p>
            </div>

            {/* FILTRY (CLIENT COMPONENT) */}
            <SearchFilters />

            {/* WYNIKI */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Nazwa Inwestycji</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Dzielnica</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Wydział</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Koszt</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right"></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {investments?.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    Brak wyników dla podanych filtrów.
                                </td>
                            </tr>
                        ) : (
                            investments?.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {inv.title}
                                        <div className="text-xs text-slate-400 font-normal mt-1 truncate max-w-[300px]">
                                            {inv.description}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {inv.districts?.name || inv.districts?.[0]?.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {inv.departments?.name || inv.departments?.[0]?.name || '-'}
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
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-all"
                                            title="Zobacz szczegóły"
                                        >
                                            ➝
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* FOOTER TABELI */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                    <span>Znaleziono: <strong>{investments?.length || 0}</strong> pozycji</span>
                    {/* Tu można dodać paginację w przyszłości */}
                </div>
            </div>

        </div>
    );
}