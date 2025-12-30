'use client'

import { assignDepartment } from '@/lib/actions/investments';
import { useActionState } from 'react'; // React 19 hook
import { useFormStatus } from 'react-dom';

type Department = {
    id: string;
    name: string;
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            disabled={pending}
            className="ml-2 bg-slate-900 text-white text-xs px-3 py-2 rounded hover:bg-slate-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
            {pending ? '...' : 'Przypisz'}
        </button>
    );
}

export function AssignDepartmentForm({
                                         investmentId,
                                         departments
                                     }: {
    investmentId: string,
    departments: Department[]
}) {
    // Fix: Używamy useActionState do obsługi Server Action
    const initialState = { message: null };
    const [state, dispatch] = useActionState(assignDepartment, initialState);

    return (
        <form action={dispatch} className="flex flex-col">
            <div className="flex items-center">
                <input type="hidden" name="investmentId" value={investmentId} />

                <select
                    name="departmentId"
                    required
                    className="text-sm border border-slate-300 rounded p-1.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none w-48"
                    defaultValue=""
                >
                    <option value="" disabled>-- Wybierz Wydział --</option>
                    {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                            {dept.name}
                        </option>
                    ))}
                </select>

                <SubmitButton />
            </div>

            {/* Obsługa błędu - jeśli coś pójdzie nie tak, wyświetli się pod dropdownem */}
            {state?.message && (
                <p className="text-red-600 text-[10px] mt-1 font-bold">
                    ⚠️ {state.message}
                </p>
            )}
        </form>
    );
}