import React, { useState } from 'react';
import { UserResource } from '../types';
import { useUsers, useCreateUser, useDeleteUser } from '../features/users/api';
import { useRoles } from '../features/roles/api';
import { Button, Badge, Avatar, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Card } from '../components/UI';
import { Plus, MoreVertical, Shield, User as UserIcon, Edit, Trash, Loader2, AlertCircle } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { ColumnDef } from '@tanstack/react-table';
import { extractApiError } from '../core/http/error';

interface CreateForm {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    password: string;
    password_confirmation: string;
    /** Role name (e.g. "admin", "agent"). Backend expects names, not ids. */
    role_name: string;
}

const EMPTY_FORM: CreateForm = {
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    password_confirmation: '',
    role_name: '',
};

export default function Users() {
    const { data: users, isLoading, error: loadError } = useUsers();
    const { data: roles } = useRoles();
    const createUser = useCreateUser();
    const deleteUser = useDeleteUser();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<CreateForm>(EMPTY_FORM);
    const [formError, setFormError] = useState<string | null>(null);

    const openCreate = (): void => {
        setFormData(EMPTY_FORM);
        setFormError(null);
        setIsDialogOpen(true);
    };

    const handleCreate = (): void => {
        if (!formData.email || !formData.first_name || !formData.last_name || !formData.username || !formData.password) {
            setFormError('First name, last name, username, email, and password are required.');
            return;
        }
        if (formData.password !== formData.password_confirmation) {
            setFormError('Password and confirmation do not match.');
            return;
        }
        setFormError(null);
        createUser.mutate(
            {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                username: formData.username,
                password: formData.password,
                password_confirmation: formData.password_confirmation,
                roles: formData.role_name ? [formData.role_name] : undefined,
            },
            {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    setFormData(EMPTY_FORM);
                },
                onError: (err) => setFormError(extractApiError(err, 'Failed to create user.')),
            }
        );
    };

    const handleDelete = (user: UserResource): void => {
        if (!window.confirm(`Deactivate user "${user.first_name} ${user.last_name}"?`)) return;
        deleteUser.mutate(user.id);
    };

    const columns: ColumnDef<UserResource>[] = [
        {
            accessorKey: 'user',
            header: 'User',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <Avatar src={row.original.avatar_url} fallback={row.original.first_name[0]} />
                    <div>
                        <div className="text-foreground font-medium">{row.original.first_name} {row.original.last_name}</div>
                        <div className="text-xs text-muted-foreground">{row.original.email}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'roles',
            header: 'Role',
            cell: ({ row }) => {
                const roleName = row.original.roles?.[0];
                if (!roleName) {
                    return <span className="text-muted-foreground text-sm">—</span>;
                }
                const isAdminRole = ['admin', 'owner', 'super_admin'].includes(roleName);
                return (
                    <div className="flex items-center gap-2">
                        {isAdminRole ? <Shield className="w-4 h-4 text-primary" /> : <UserIcon className="w-4 h-4 text-muted-foreground" />}
                        <span className="capitalize">{roleName.replace('_', ' ')}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.is_active ? 'success' : 'destructive'} className="rounded-md px-2 py-0.5 font-normal">
                    {row.original.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            accessorKey: 'last_login',
            header: 'Last Login',
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">
                    {row.original.last_login_at ? new Date(row.original.last_login_at).toLocaleString() : 'Never'}
                </span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(row.original)}
                            >
                                <Trash className="w-4 h-4 mr-2" /> Deactivate
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Users"
                description="Manage system access and agent accounts."
                action={<Button className="gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> Add User</Button>}
            />
            {loadError && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{extractApiError(loadError, 'Failed to load users.')}</span>
                </div>
            )}
            <Card className="border-0 shadow-sm">
                <DataTable columns={columns} data={users ?? []} isLoading={isLoading} searchKey="user" />
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        {formError && (
                            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">First Name</label>
                                <Input value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Last Name</label>
                                <Input value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Username</label>
                            <Input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="e.g. jdoe" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Min 8 characters" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confirm Password</label>
                                <Input type="password" value={formData.password_confirmation} onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })} placeholder="Repeat password" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                value={formData.role_name}
                                onChange={e => setFormData({ ...formData, role_name: e.target.value })}
                            >
                                <option value="">No role (can be assigned later)</option>
                                {roles?.map(role => (
                                    <option key={role.id} value={role.name}>{role.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={createUser.isPending}>
                            {createUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
