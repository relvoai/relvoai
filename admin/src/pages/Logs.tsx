import React, { useState } from 'react';
import { useAuditLogs, AuditLogResource } from '../features/audit-logs/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { ColumnDef } from '@tanstack/react-table';
import { Input } from '../components/UI';
import { Search } from 'lucide-react';

export default function Logs() {
    const [search, setSearch] = useState('');
    const { data: logs, isLoading } = useAuditLogs({ search: search || undefined, per_page: 100 });

    const columns: ColumnDef<AuditLogResource>[] = [
        {
            accessorKey: 'created_at',
            header: 'Time',
            cell: ({ row }) => (
                <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {new Date(row.original.created_at).toLocaleString()}
                </span>
            ),
        },
        {
            accessorKey: 'event',
            header: 'Event',
            cell: ({ row }) => <span className="font-medium">{row.original.event}</span>,
        },
        {
            accessorKey: 'user_name',
            header: 'User',
        },
        {
            accessorKey: 'auditable_type',
            header: 'Resource',
            cell: ({ row }) => {
                const type = row.original.auditable_type;
                if (!type) return <span className="text-muted-foreground">-</span>;
                const shortType = type.split('\\').pop() || type;
                return <span className="text-muted-foreground">{shortType}</span>;
            },
        },
        {
            accessorKey: 'ip_address',
            header: 'IP Address',
            cell: ({ row }) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {row.original.ip_address || '-'}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Audit Logs" description="Track system events and user actions." />
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search events or users..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>
            <DataTable columns={columns} data={logs || []} isLoading={isLoading} searchKey="event" />
        </div>
    );
}
