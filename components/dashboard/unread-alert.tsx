'use client'

import { markAsRead } from '@/lib/actions/investments';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';

export function UnreadAlert({ investment }: { investment: any }) {
    const pathname = usePathname();

    // FIX: Bezpieczna data
    const dateToDisplay = investment.updated_at || investment.created_at;

    return (
        <div className="bg-white border-l-4 border-blue-500 rounded-r-xl shadow-sm p-4 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-2">

            {/* LEWA STRONA: INFORMACJE */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            {investment.updated_at ? 'Aktualizacja' : 'Nowe'}
          </span>
                    <span className="text-xs text-slate-400">
            {new Date(dateToDisplay).toLocaleDateString('pl-PL')}
          </span>
                </div>

                <h4 className="font-bold text-slate-900 text-lg mb-1">
                    <Link href={`/investments/${investment.id}`} className="hover:underline">
                        {investment.title}
                    </Link>
                </h4>
                <div className="flex items-center gap-3">
                    <StatusBadge status={investment.status} />
                    <span className="text-sm text-slate-500 truncate max-w-[300px]">{investment.description}</span>
                </div>
            </div>

            {/* PRAWA STRONA: PRZYCISK */}
            <form action={markAsRead} className="shrink-0">
                <input type="hidden" name="investmentId" value={investment.id} />
                <input type="hidden" name="pathname" value={pathname} />

                <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-colors text-sm border border-blue-200"
                >
                    <span>✓</span>
                    Oznacz jako przeczytane
                </button>
            </form>
        </div>
    );
}