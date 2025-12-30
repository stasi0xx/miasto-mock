import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/ui/status-badge';
import { ValuationForm } from '@/components/investments/valuation-form'; // Twój formularz wyceny
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import Link from 'next/link';
import { RadaDecisionPanel } from '@/components/investments/rada-decision-panel';
import { DepartmentControls } from '@/components/investments/department-controls';
import { ExecutionControls } from '@/components/investments/execution-controls'; // Dla Urzędu
import { BrdExecutionTrigger } from '@/components/investments/brd-execution-trigger'; // Dla BRD (Nowe)



export default async function InvestmentPage({ params }: { params: Promise<{ id: string }> }) {
    // W Next.js 15/16 params są Promise'm - trzeba awaitować
    const { id } = await params;

    const supabase = await createClient();

    // 1. AUTORYZACJA I POBRANIE PROFILU
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return notFound(); // Lub redirect do login

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const rolePaths: Record<string, string> = {
        rada: '/rada',
        urzad: '/urzad',
        brd: '/brd',
    };

    // Fallback do '/' jeśli rola jest dziwna
    const backLink = profile?.role ? (rolePaths[profile.role] || '/') : '/';

    // 2. POBRANIE INWESTYCJI
    // RLS zadziała tutaj automatycznie - jeśli nie masz prawa widzieć, dostaniesz błąd/null
    const { data: investment, error } = await supabase
        .from('investments')
        .select(`
      *,
      districts(name),
      departments(name)
    `)
        .eq('id', id)
        .single();

    supabase.from('investment_views').upsert({
        user_id: user.id,
        investment_id: investment.id, // lub investment.id
        last_viewed_at: new Date().toISOString()
    }).then();

    if (error || !investment) {
        return notFound();
    }

    // 3. POBRANIE HISTORII (UPDATES)
    const { data: updates } = await supabase
        .from('updates')
        .select(`
      *,
      profiles(email, role) 
    `)
        .eq('investment_id', id)
        .order('created_at', { ascending: true }); // Od najstarszych do najnowszych

    const { data: departmentsList } = await supabase.from('departments').select('*');

    // 4. LOGIKA BIZNESOWA UI
    const userRole = profile?.role;

    // Czy zalogowany urzędnik jest z tego samego wydziału co inwestycja?
    const isMyDepartment =
        userRole === 'urzad' &&
        investment.department_id === profile?.department_id;

    // Czy pokazać formularz wyceny?
    const showValuationForm =
        isMyDepartment &&
        investment.status === 'ASSIGNED';

    const showRadaDecision =
        profile?.role === 'rada' &&
        (
            investment.status === 'VALUATION_READY' ||
            investment.status === 'DEFERRED' ||
            investment.status === 'COST_APPROVAL_PENDING' // <--- Dodaj to
        );

    const showCommentBar = !showRadaDecision;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-32">

            <div className="mb-2">
                <Link
                    href={backLink}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    Wróć do Panelu {profile?.role === 'brd' ? 'Biura' : (profile?.role === 'rada' ? 'Rady' : 'Wydziału')}
                </Link>
            </div>

            {/* --- HEADER: KARTA INFORMACYJNA --- */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                {/* Pasek dekoracyjny */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                            <span>{investment.districts?.name}</span>
                            <span>•</span>
                            <span>{investment.departments?.name || 'Nieprzypisany'}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">{investment.title}</h1>
                        <p className="text-slate-600 text-lg leading-relaxed">{investment.description}</p>
                    </div>

                    <div className="text-right shrink-0 ml-8">
                        <StatusBadge status={investment.status} />
                        <div className="mt-4">
                            <p className="text-sm text-slate-400 uppercase font-semibold">Szacowany Koszt</p>
                            <p className="text-2xl font-mono font-bold text-slate-900">
                                {investment.total_cost > 0
                                    ? new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(investment.total_cost)
                                    : '---'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SEKCJA AKCJI (WARUNKOWA) --- */}

            {profile?.role === 'brd' && investment.status === 'RD_ACCEPTED' && (
                <BrdExecutionTrigger investmentId={investment.id} />
            )}

            {/* Formularz wyceny dla Urzędnika */}
            {showValuationForm && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ValuationForm investmentId={investment.id} />
                </div>
            )}
            {isMyDepartment && !['REJECTED', 'IMPLEMENTED'].includes(investment.status) && (
                <DepartmentControls
                    investmentId={investment.id}
                    departments={departmentsList || []}
                    currentCost={investment.total_cost}
                />
            )}
            {isMyDepartment && (
                <ExecutionControls
                    investmentId={investment.id}
                    status={investment.status}
                />
            )}

            {showRadaDecision && (
                <div className="mb-12 animate-in fade-in slide-in-from-bottom-4">
                    <RadaDecisionPanel
                        investmentId={investment.id}
                        currentStatus={investment.status} // <--- TO JEST NOWE
                    />
                </div>
            )}

            {/* --- TIMELINE / HISTORIA --- */}
            <div className="pt-8">
                <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                    Historia Realizacji
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">{updates?.length || 0}</span>
                </h3>

                <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pl-8 pb-8">
                    {updates?.map((update) => (
                        <div key={update.id} className="relative group">
                            {/* Kropka na osi */}
                            <div className="absolute -left-[41px] top-0 bg-white border-2 border-slate-300 w-6 h-6 rounded-full flex items-center justify-center text-[10px] group-hover:border-blue-500 group-hover:bg-blue-50 transition-colors">
                                {update.type === 'FILE' ? '📎' : '💬'}
                            </div>

                            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">
                        {update.profiles?.email}
                    </span>
                                        <span className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                      {update.author_role}
                    </span>
                                    </div>
                                    <time className="text-xs text-slate-400 font-mono">
                                        {format(new Date(update.created_at), 'dd MMM yyyy, HH:mm', { locale: pl })}
                                    </time>
                                </div>

                                <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                                    {update.content}
                                </p>

                                {/* Jeśli jest załącznik */}
                                {update.file_url && (
                                    <div className="mt-4">
                                        <a
                                            href={update.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-200"
                                        >
                                            📄 Otwórz Załącznik: {update.file_name}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {updates?.length === 0 && (
                        <p className="text-slate-400 text-sm italic">Brak wpisów w historii.</p>
                    )}
                </div>
            </div>

            {/* --- FOOTER Z AKCJAMI (Fixed bottom) --- */}

            {showCommentBar && (<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-4xl mx-auto flex justify-end gap-3">
                    {/* Tutaj w przyszłości dodasz "Dodaj Komentarz" dla wszystkich */}
                    <Link
                        href={`/investments/${id}/add-update`} // Placeholder, zrobimy to później
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium py-2 px-6 rounded-lg transition-colors text-sm flex items-center gap-2"
                    >
                        💬 Dodaj Wiadomość / Plik
                    </Link>
                </div>
            </div>) }

        </div>
    );
}