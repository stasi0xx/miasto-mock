import { CreateInvestmentForm } from '@/components/investments/create-form';
import Link from 'next/link';

export default function NewInvestmentPage() {
    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            {/* Przycisk powrotu */}
            <div className="mb-8">
                <Link
                    href="/rada"
                    className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
                >
                    ← Wróć do listy inwestycji
                </Link>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="mb-8 border-b border-gray-100 pb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Nowy Wniosek Inwestycyjny</h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Wypełnij formularz poniżej, aby zgłosić nową inwestycję do Biura Rad Dzielnic.
                        Po zgłoszeniu wniosek trafi do weryfikacji i wyceny.
                    </p>
                </div>

                <CreateInvestmentForm />
            </div>
        </div>
    );
}