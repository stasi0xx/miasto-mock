'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { markAsRead } from '@/lib/actions/investments';

// Definiujemy typ propsów, żeby TS nie krzyczał
type UnreadAlertProps = {
    investment: {
        id: string;
        title: string;
        districts?: { name: string } | { name: string }[] | null; // Obsługa dziwnych typów Supabase
        is_unread_rd?: boolean;
        is_unread_urzad?: boolean;
    };
};

export function UnreadAlert({ investment }: UnreadAlertProps) {
    const [isPending, startTransition] = useTransition();

    // Helper do bezpiecznego wyciągania nazwy dzielnicy
    // @ts-ignore - ignorujemy błędy typowania Supabase dla prostoty
    const districtName = Array.isArray(investment.districts)
        ? investment.districts[0]?.name
        : investment.districts?.name;

    // Wykrywamy kontekst (czy to alert dla Rady czy Urzędu) na podstawie flagi
    // Jeśli is_unread_rd jest true, to znaczy, że wyświetlamy to radnemu itd.
    const roleToUpdate = investment.is_unread_rd ? 'rada' : 'urzad';

    const handleMarkAsRead = () => {
        startTransition(async () => {
            await markAsRead(investment.id, roleToUpdate);
        });
    };

    if (!investment) return null;

    return (
        <div className={`
            relative overflow-hidden
            bg-white p-4 rounded-xl border-l-4 shadow-sm transition-all
            flex flex-col md:flex-row md:items-center justify-between gap-4
            ${isPending ? 'opacity-50 grayscale' : 'opacity-100'}
            border-red-500 shadow-red-100
        `}>
            {/* Treść powiadomienia */}
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Nowa aktywność
                </div>

                <h3 className="font-bold text-slate-900 leading-snug">
                    {investment.title}
                </h3>

                <p className="text-sm text-slate-500">
                    Dzielnica: {districtName || 'Ogólnomiejskie'}
                </p>
            </div>

            {/* Akcje (Przyciski) - Na mobile będą pod spodem, na desktopie po prawej */}
            <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 md:border-none w-full md:w-auto">
                <Link
                    href={`/investments/${investment.id}`}
                    className="flex-1 md:flex-none text-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                >
                    Zobacz
                </Link>

                <button
                    onClick={handleMarkAsRead}
                    disabled={isPending}
                    className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-lg transition-colors disabled:cursor-wait whitespace-nowrap"
                >
                    {isPending ? 'Oznaczanie...' : 'Oznacz jako przeczytane'}
                </button>
            </div>
        </div>
    );
}