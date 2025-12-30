import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { logout } from '@/lib/actions/auth';
import Link from 'next/link';

export default async function DashboardLayout({
                                                  children,
                                              }: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Pobierz rolę użytkownika, żeby wiedzieć co wyświetlić w menu
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, districts(name)')
        .eq('id', user.id)
        .single();

    const roleHomePaths: Record<string, string> = {
        rada: '/rada',
        urzad: '/urzad',
        brd: '/brd',
    };

    const homeHref = profile?.role ? (roleHomePaths[profile.role] || '/dashboard') : '/dashboard';

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-10 hidden md:block">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="font-bold text-xl text-slate-900">Inwestycje Miejskie</h2>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                        {/* @ts-ignore BŁĄD: profile?.districts?.name */}

                        {profile?.districts?.name || 'Biuro/Urząd'}
                    </p>
                </div>

                <nav className="p-4 space-y-1">
                    <Link
                        href={homeHref}
                        className="flex items-center gap-3 px-4 py-3 text-slate-900 bg-slate-100/50 hover:bg-slate-100 rounded-lg transition-colors font-bold mb-4 border border-slate-200/50"
                    >
                        🏠 Strona Główna
                    </Link>
                    <Link
                        href="/investments"
                        className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                    >
                        📂 Przegląd Inwestycji
                    </Link>

                    {/* Przycisk tylko dla Rady - Create New */}
                    {profile?.role === 'rada' && (
                        <Link
                            href="/rada/nowa-inwestycja"
                            className="flex items-center gap-3 px-4 py-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium mt-4"
                        >
                            + Nowy Wniosek
                        </Link>
                    )}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-slate-100">
                    <form action={logout}>
                        <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
                            Wyloguj się
                        </button>
                    </form>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 md:ml-64 p-8">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}