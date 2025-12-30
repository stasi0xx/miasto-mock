import React from 'react';

// Definicja mapy statusów: Tłumaczenie + Kolory
const statusConfig: Record<string, { label: string; className: string }> = {
    // 1. Etap początkowy
    NEW: {
        label: 'Nowy Wniosek',
        className: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    ASSIGNED: {
        label: 'Weryfikacja Wydziału', // Brzmi lepiej niż "Przypisane"
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },

    // 2. Etap wyceny i decyzji
    VALUATION_READY: {
        label: 'Gotowa Wycena',
        className: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    COST_APPROVAL_PENDING: {
        label: 'Wymagana Akceptacja Zmian', // Dla zmiany kosztów
        className: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' // Pulsowanie zwraca uwagę
    },

    // 3. Decyzje Rady
    RD_ACCEPTED: {
        label: 'Zatwierdzono (Uchwała)',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    DEFERRED: {
        label: 'Odłożone w Czasie',
        className: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    REJECTED: {
        label: 'Odrzucone',
        className: 'bg-red-50 text-red-700 border-red-200'
    },

    // 4. Realizacja
    IN_PROGRESS: {
        label: 'W Realizacji',
        className: 'bg-sky-100 text-sky-800 border-sky-200 font-bold'
    },
    COMPLETED: {
        label: 'Inwestycja Zakończona',
        className: 'bg-slate-100 text-slate-700 border-slate-300'
    },
};

export function StatusBadge({ status }: { status: string }) {
    // Pobieramy konfigurację dla danego statusu lub fallback (jeśli status jest nieznany)
    const config = statusConfig[status] || {
        label: status, // Jeśli nie znamy, pokazujemy surowy kod (do debugowania)
        className: 'bg-gray-100 text-gray-600 border-gray-200'
    };

    return (
        <span
            className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        whitespace-nowrap transition-colors
        ${config.className}
      `}
        >
      {/* Kropka statusu (opcjonalna, dodaje elegancji) */}
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 mr-2" aria-hidden="true" />
            {config.label}
    </span>
    );
}