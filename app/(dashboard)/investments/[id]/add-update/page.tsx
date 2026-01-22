import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AddUpdateForm } from '@/components/investments/add-update-form';

export default async function AddUpdatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Sprawdzamy czy inwestycja istnieje (dla kontekstu)
    const { data: investment } = await supabase
        .from('investments')
        .select('title, districts(name)')
        .eq('id', id)
        .single();

    if (!investment) return notFound();

    // FIX: Brutalne rozwiązanie problemu TS2339 ("Property name does not exist on type never").
    // Rzutujemy na 'any', odcinając sprawdzanie typów w tym jednym miejscu.
    // W Runtime to zadziała poprawnie (zwróci obiekt lub tablicę).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const districts: any = investment.districts;

    // Bezpieczne pobranie nazwy niezależnie od tego czy Supabase zwrócił tablicę czy obiekt
    const districtName = Array.isArray(districts)
        ? districts[0]?.name
        : districts?.name;

    return (
        <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 pb-32 pt-4 md:pt-8 px-4 md:px-0">
            {/* Breadcrumbs / Back Link */}
            <div>
                <Link
                    href={`/investments/${id}`}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium group py-2"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    Wróć do szczegółów inwestycji
                </Link>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span className="bg-slate-100 px-2 py-1 rounded">
                        {districtName || 'Dzielnica'}
                    </span>
                    <span className="hidden md:inline">•</span>
                    <span className="text-blue-600">Nowa Wiadomość</span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                    Dodaj wiadomość do: <br className="md:hidden"/>
                    <span className="text-blue-600">{investment.title}</span>
                </h1>
                <p className="text-sm md:text-base text-slate-600 mt-2">
                    Wiadomość trafi do historii realizacji i powiadomi odpowiednie osoby.
                </p>
            </div>

            {/* Formularz */}
            <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50">
                <AddUpdateForm investmentId={id} />
            </div>
        </div>
    );
}