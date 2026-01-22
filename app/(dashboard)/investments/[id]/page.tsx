import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/ui/status-badge';
import { ValuationForm } from '@/components/investments/valuation-form';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import Link from 'next/link';
import { RadaDecisionPanel } from '@/components/investments/rada-decision-panel';
import { DepartmentControls } from '@/components/investments/department-controls';
import { ExecutionControls } from '@/components/investments/execution-controls';
import { BrdExecutionTrigger } from '@/components/investments/brd-execution-trigger';

// Helper formatowania waluty
const formatMoney = (amount: number) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount);

export default async function InvestmentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. AUTORYZACJA
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return notFound();

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

    const backLink = profile?.role ? (rolePaths[profile.role] || '/') : '/';

    // 2. POBRANIE DANYCH
    const { data: investment, error } = await supabase
        .from('investments')
        .select('*, districts(name), departments(name)')
        .eq('id', id)
        .single();

    // Logowanie wyświetlenia (fire & forget)
    supabase.from('investment_views').upsert({
        user_id: user.id,
        investment_id: investment?.id,
        last_viewed_at: new Date().toISOString()
    }).then();

    if (error || !investment) return notFound();

    // 3. HISTORIA
    const { data: updates } = await supabase
        .from('updates')
        .select('*, profiles(email, role)')
        .eq('investment_id', id)
        .order('created_at', { ascending: true });

    const { data: departmentsList } = await supabase.from('departments').select('*');

    // 4. LOGIKA UI
    const userRole = profile?.role;
    const isMyDepartment = userRole === 'urzad' && investment.department_id === profile?.department_id;

    const showValuationForm = isMyDepartment && investment.status === 'ASSIGNED';

    const showRadaDecision = profile?.role === 'rada' && (
        investment.status === 'VALUATION_READY' ||
        investment.status === 'DEFERRED' ||
        investment.status === 'COST_APPROVAL_PENDING'
    );

    const showCommentBar = !showRadaDecision;

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-32 md:pb-24">

            {/* BREADCRUMB */}
            <div className="mb-2 px-1">
                <Link
                    href={backLink}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors font-medium group py-2"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    Wróć do Panelu
                </Link>
            </div>

            {/* --- HEADER: KARTA INFORMACYJNA --- */}
            <div className="bg-white p-5 md:p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
                    <div className="w-full">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500">
                            <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">
                                {investment.districts?.name}
                            </span>
                            <span className="text-slate-300 hidden md:inline">•</span>
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                                {investment.departments?.name || 'Nieprzypisany'}
                            </span>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 leading-tight">
                            {investment.title}
                        </h1>
                        <p className="text-slate-600 text-sm md:text-lg leading-relaxed">
                            {investment.description}
                        </p>
                    </div>

                    <div className="w-full md:w-auto md:text-right shrink-0 flex flex-row md:flex-col justify-between md:justify-start items-center md:items-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 gap-4">
                        <StatusBadge status={investment.status} />
                        <div className="md:mt-4 text-right">
                            <p className="text-[10px] md:text-sm text-slate-400 uppercase font-semibold">Szacowany Koszt</p>
                            <p className="text-xl md:text-2xl font-mono font-bold text-slate-900">
                                {investment.total_cost > 0 ? formatMoney(investment.total_cost) : '---'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SEKCJE AKCJI --- */}

            {/* Kontener na formularze z odpowiednim paddingiem na mobile */}
            <div className="space-y-6">
                {profile?.role === 'brd' && investment.status === 'RD_ACCEPTED' && (
                    <BrdExecutionTrigger investmentId={investment.id} />
                )}

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
                    <ExecutionControls investmentId={investment.id} status={investment.status} />
                )}

                {showRadaDecision && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <RadaDecisionPanel investmentId={investment.id} currentStatus={investment.status} />
                    </div>
                )}
            </div>

            {/* --- TIMELINE --- */}
            <div className="pt-4 md:pt-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6 md:mb-8 flex items-center gap-2 px-1">
                    Historia Realizacji
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full border border-slate-200">
                        {updates?.length || 0}
                    </span>
                </h3>

                <div className="relative border-l-2 border-slate-200 ml-2 md:ml-4 space-y-8 pl-6 md:pl-8 pb-8">
                    {updates?.map((update) => (
                        <div key={update.id} className="relative group">
                            {/* Kropka */}
                            <div className="absolute -left-[37px] md:-left-[41px] top-0 bg-white border-2 border-slate-300 w-6 h-6 rounded-full flex items-center justify-center text-[10px] z-10 group-hover:border-blue-500 group-hover:bg-blue-50 transition-colors">
                                {update.type === 'FILE' ? '📎' : '💬'}
                            </div>

                            <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm truncate max-w-[200px]">
                                            {update.profiles?.email}
                                        </span>
                                        <span className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-slate-200">
                                            {update.author_role}
                                        </span>
                                    </div>
                                    <time className="text-xs text-slate-400 font-mono">
                                        {format(new Date(update.created_at), 'dd.MM.yyyy, HH:mm', { locale: pl })}
                                    </time>
                                </div>

                                <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                                    {update.content}
                                </p>

                                {update.file_url && (
                                    <div className="mt-4">
                                        <a
                                            href={update.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors border border-blue-200/60 w-full md:w-auto"
                                        >
                                            <span className="text-xl">📄</span>
                                            <span className="truncate">Załącznik: {update.file_name}</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {updates?.length === 0 && (
                        <p className="text-slate-400 text-sm italic pl-2">Brak wpisów w historii.</p>
                    )}
                </div>
            </div>

            {/* --- ACTION BAR (Responsive) --- */}
            {showCommentBar && (
                <div className="fixed bottom-16 md:bottom-0 left-0 md:left-64 right-0 p-4 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 transition-all">
                    <div className="max-w-4xl mx-auto flex justify-end">
                        <Link
                            href={`/investments/${id}/add-update`}
                            className="w-full md:w-auto bg-slate-900 text-white hover:bg-slate-800 font-medium py-3 px-6 rounded-xl md:rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-lg md:shadow-none"
                        >
                            <span>💬</span> Dodaj Wiadomość / Plik
                        </Link>
                    </div>
                </div>
            )}

        </div>
    );
}