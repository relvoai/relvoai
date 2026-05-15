import React from 'react';
import { useRoles } from '../features/roles/api';
import { Card, Badge, Button } from '../components/UI';
import { ShieldCheck, Edit3, Loader2 } from 'lucide-react';

export default function Roles() {
    const { data: roles, isLoading } = useRoles();

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Roles & Permissions</h1>
                    <p className="mt-1 text-muted-foreground">Configure access levels for your team.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {roles?.map(role => (
                    <Card key={role.id} className="flex flex-col">
                        <div className="flex-1 p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <ShieldCheck className="h-6 w-6 text-primary" />
                                </div>
                                <Badge variant="outline">{role.users_count} Users</Badge>
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-foreground">{role.name}</h3>
                            <p className="mb-4 text-sm text-muted-foreground">{role.description}</p>
                            <div className="inline-block rounded bg-muted px-2 py-1 text-xs font-medium text-foreground">
                                {role.permissions_count} Permissions Granted
                            </div>
                        </div>
                        <div className="flex justify-end border-t border-border bg-muted/30 p-4">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <Edit3 className="h-4 w-4" />
                                View Permissions
                            </Button>
                        </div>
                    </Card>
                ))}
                {roles?.length === 0 && (
                    <div className="col-span-3 py-12 text-center text-muted-foreground">
                        No roles configured.
                    </div>
                )}
            </div>
        </div>
    );
}
