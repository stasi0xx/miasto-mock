import Link from 'next/link';
import { logout } from '@/lib/actions/auth';

type MobileNavProps = {
    role?: string;
    districtName?: string;
};

export function MobileNav({ role, districtName }: MobileNavProps) {
    // Mapowanie ról na ścieżki (to samo co w layout, DRY!)
    const roleHomePaths: Record<string, string> = {
        rada: '/rada',
        urzad: '/urzad',
        brd: '/brd',
    };

    const homeHref = role ? (roleHomePaths[role] || '/dashboard') : '/dashboard';

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden pb-safe">
            {/* Pasek informacyjny - mały hack żeby wiedzieli kim są */}
            <div className="bg-slate-50 px-4 py-1 text-[10px] text-center text-slate-500 uppercase tracking-widest border-b border-slate-100 truncate">
                {districtName || 'Biuro/Urząd'}
            </div>

            <div className="grid grid-cols-4 h-16 items-center">
                {/* HOME */}
                <Link
                    href={homeHref}
                    className="flex flex-col items-center justify-center h-full gap-1 text-slate-500 hover:text-primary active:text-primary transition-colors"
                >
                    <span className="text-xl">🏠</span>
                    <span className="text-[10px] font-medium">Start</span>
                </Link>

                {/* INWESTYCJE */}
                <Link
                    href="/investments"
                    className="flex flex-col items-center justify-center h-full gap-1 text-slate-500 hover:text-primary active:text-primary transition-colors"
                >
                    <span className="text-xl">📂</span>
                    <span className="text-[10px] font-medium">Rejestr</span>
                </Link>

                {/* AKCJA SPECJALNA (tylko dla Rady) lub PUSTY SLOT */}
                {role === 'rada' ? (
                    <Link
                        href="/rada/nowa-inwestycja"
                        className="flex flex-col items-center justify-center h-full gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-0.5">
                            <span className="text-lg font-bold">+</span>
                        </div>
                        <span className="text-[10px] font-medium">Nowy</span>
                    </Link>
                ) : (
                    // Placeholder żeby układ się nie rozjechał
                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                        <span>—</span>
                    </div>
                )}

                {/* WYLOGUJ */}
                <form action={logout} className="h-full">
                    <button className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-red-600 transition-colors">
                        <span className="text-xl">🚪</span>
                        <span className="text-[10px] font-medium">Wyjdź</span>
                    </button>
                </form>
            </div>
        </nav>
    );
}