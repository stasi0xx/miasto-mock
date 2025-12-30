'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce'; // Opcjonalne, ale zrobimy prościej bez bibliotek zewn. na razie

export function SearchFilters() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    // Funkcja aktualizująca URL
    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        replace(`${pathname}?${params.toString()}`);
    };

    const handleStatusChange = (status: string) => {
        const params = new URLSearchParams(searchParams);
        if (status && status !== 'ALL') {
            params.set('status', status);
        } else {
            params.delete('status');
        }
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">

            {/* Szukajka */}
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Szukaj po nazwie</label>
                <input
                    type="text"
                    placeholder="np. Remont chodnika..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                    onChange={(e) => handleSearch(e.target.value)}
                    defaultValue={searchParams.get('q')?.toString()}
                />
            </div>

            {/* Filtr Statusu */}
            <div className="w-full md:w-64">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                <select
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                    onChange={(e) => handleStatusChange(e.target.value)}
                    defaultValue={searchParams.get('status')?.toString() || 'ALL'}
                >
                    <option value="ALL">Wszystkie</option>
                    <option value="NEW">Nowe wnioski</option>
                    <option value="ASSIGNED">W analizie (Przypisane)</option>
                    <option value="VALUATION_READY">Wycena gotowa</option>
                    <option value="DEFERRED">Odłożone</option>
                    <option value="RD_ACCEPTED">Zaakceptowane (Uchwała)</option>
                    <option value="IMPLEMENTED">W realizacji</option>
                    <option value="REJECTED">Odrzucone</option>
                </select>
            </div>
        </div>
    );
}