export type Role = 'admin' | 'brd' | 'urzad' | 'rada';

export type InvestmentStatus =
    | 'NEW'
    | 'ASSIGNED'
    | 'VALUATION_READY'
    | 'RD_ACCEPTED'
    | 'IMPLEMENTED'
    | 'REJECTED';

export interface Investment {
    id: string;
    title: string;
    description: string;
    district_id: string;
    department_id: string | null;
    total_cost: number;
    status: InvestmentStatus;
    cost_covered_by_city: boolean;
    created_at: string;
}

export interface InvestmentUpdate {
    id: string;
    investment_id: string;
    author_id: string;
    author_role: Role;
    type: 'TEXT' | 'FILE' | 'STATUS_CHANGE' | 'COST_CHANGE';
    content: string | null;
    file_url: string | null;
    file_name: string | null;
    requires_ack_from_rd: boolean;
    requires_ack_from_dept: boolean;
    is_acked_by_rd: boolean;
    is_acked_by_dept: boolean;
    created_at: string;
}