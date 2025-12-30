// app/(dashboard)/investments/[id]/add-update/page.tsx
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


    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-32 pt-8">
            {/* Breadcrumbs / Back Link */}
            <div>
                <Link
                    href={`/investments/${id}`}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    Wróć do szczegółów inwestycji
                </Link>
            </div>



            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {/* ts-ignore */}
                    <span>{investment.districts?.name}</span>
                    <span>•</span>
                    <span>Nowa Wiadomość</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                    Dodaj wiadomość do: <span className="text-blue-600">{investment.title}</span>
                </h1>
                <p className="text-slate-600 mt-2">
                    Wiadomość trafi do historii realizacji i powiadomi odpowiednie osoby.
                </p>
            </div>

            {/* Formularz */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50">
                <AddUpdateForm investmentId={id} />
            </div>
        </div>
    );
}