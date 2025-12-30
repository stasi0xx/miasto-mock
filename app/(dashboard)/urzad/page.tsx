import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';
import { UnreadAlert } from '@/components/dashboard/unread-alert';

export default async function UrzadDashboard() {
    const supabase = await createClient();

    // 1. Sprawdzamy Usera
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // 2. Sprawdzamy Profil
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Zabezpieczenie: Czy to na pewno Urząd?
    if (!profile || profile.role !== 'urzad') {
        redirect('/dashboard');
    }

    // Zabezpieczenie: Czy urzędnik ma przypisany wydział?
    if (!profile.department_id) {
        return (
            <div className="p-8 text-center text-red-600">
                Błąd: Twoje konto nie jest przypisane do żadnego wydziału. Skontaktuj się z administratorem.
            </div>
        );
    }

    // 3. Pobieramy Inwestycje WYDZIAŁU
    // Filtrujemy po department_id, ukrywamy zakończone
    const { data: allInvestments, error } = await supabase
        .from('investments')
        .select('*, districts(name), departments(name)')
        .neq('status', 'COMPLETED')
        .eq('department_id', profile.department_id) // <--- KLUCZOWA ZMIANA: Tylko Twój wydział
        .order('updated_at', { ascending: false });

    if (error) {
        console.error("Błąd pobierania:", error);
    }

    // 4. FILTROWANIE PO FLAGACH (Urzad)
    const unreadInvestments = allInvestments?.filter(inv => inv.is_unread_urzad === true) || [];
    const readInvestments = allInvestments?.filter(inv => inv.is_unread_urzad !== true) || [];

    return (
        <div className="max-w-[1600px] mx-auto p-8 space-y-12 pb-32">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Panel Wydziału</h1>
                    <p className="text-slate-500 mt-2">
                        Jednostka: <strong>
                        {/* Wyświetlamy nazwę wydziału z pierwszego rekordu lub fallback */}
                        {allInvestments?.[0]?.departments?.name || 'Twój Wydział'}
                    </strong>
                    </p>
                </div>

                {/* Urzędnik rzadko dodaje wnioski, więc usunąłem przycisk "Nowy Wniosek",
                    ale jeśli potrzebujesz, możesz go tu przywrócić */}
            </div>

            {/* SEKCJA 1: SKRZYNKA ODBIORCZA (NIEPRZECZYTANE) */}
            {unreadInvestments.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        📥 Skrzynka Odbiorcza
                        <span className="bg-red-600 text-white text-xs px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                            {unreadInvestments.length}
                        </span>
                    </h2>

                    <div className="bg-white border-l-4 border-slate-300 p-6 rounded-r-2xl shadow-lg shadow-slate-200/50 space-y-4">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                            Poniższe sprawy wymagają Twojej reakcji lub zapoznania się ze zmianami:
                        </p>
                        {unreadInvestments.map((inv) => (
                            <UnreadAlert key={inv.id} investment={inv} />
                        ))}
                    </div>
                </div>
            )}

            {/* SEKCJA 2: BIEŻĄCE ZADANIA */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    📋 Bieżące Zadania
                    <span className="text-slate-400 text-sm font-normal">({readInvestments.length})</span>
                </h2>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Nazwa Inwestycji</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Dzielnica (Wnioskodawca)</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Budżet</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                            <th className="px-6 py-4 text-right">Akcja</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">

                        {/* PUSTO */}
                        {readInvestments.length === 0 && unreadInvestments.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                                    <span className="text-4xl block mb-2">✅</span>
                                    Brak aktywnych zadań. Wszystko zrobione!
                                </td>
                            </tr>
                        )}

                        {/* WSZYSTKO W SKRZYNCE */}
                        {readInvestments.length === 0 && unreadInvestments.length > 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic bg-slate-50/30">
                                    Wszystkie sprawy znajdują się w skrzynce odbiorczej powyżej ⬆️
                                </td>
                            </tr>
                        )}

                        {readInvestments.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {inv.title}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {/* Wyświetlamy Dzielnicę zamiast Wydziału */}

                                    {inv.districts?.name || '-'}
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
                                        className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium text-xs uppercase tracking-wide px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                    >
                                        Otwórz →
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