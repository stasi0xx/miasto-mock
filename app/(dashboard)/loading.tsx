export default function Loading() {
    return (
        <div className="space-y-8 animate-pulse">
            <div>
                <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-slate-200 rounded-lg border border-slate-100"></div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-12 bg-slate-100 border-b border-slate-200"></div>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 border-b border-slate-100 bg-white"></div>
                ))}
            </div>
        </div>
    );
}