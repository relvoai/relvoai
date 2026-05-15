import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContacts, useDeleteContact, Contact } from '../features/contacts/api';
import { Button, Avatar, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Input } from '../components/UI';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Mail, Phone, Loader2 } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { ColumnDef } from '@tanstack/react-table';
import { ContactSheet } from '../components/ContactSheet';
import { useDebounce } from '../hooks/useDebounce';

export default function Contacts() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    // Queries
    const { data, isLoading } = useContacts(page, debouncedSearch);
    const deleteContact = useDeleteContact();

    const handleCreate = () => {
        setSelectedContact(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (contact: Contact) => {
        setSelectedContact(contact);
        setIsSheetOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this contact?')) {
            deleteContact.mutate(id);
        }
    };

    const columns: ColumnDef<Contact>[] = [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <Avatar src={row.original.avatar_url || undefined} fallback={row.original.name?.[0]?.toUpperCase()} />
                    <div className="flex flex-col">
                        <span className="text-foreground font-medium">{row.original.name}</span>
                        <span className="text-xs text-muted-foreground">ID: {row.original.id.slice(0, 8)}</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "email",
            header: "Contact Info",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1 text-sm">
                    {row.original.email && (
                        <div className="flex items-center gap-2 text-foreground">
                            <Mail className="w-3 h-3 text-muted-foreground" /> {row.original.email}
                        </div>
                    )}
                    {row.original.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-3 h-3" /> {row.original.phone}
                        </div>
                    )}
                    {!row.original.email && !row.original.phone && <span className="text-muted-foreground italic">No contact info</span>}
                </div>
            )
        },
        {
            accessorKey: "tags",
            header: "Tags",
            cell: ({ row }) => (
                <div className="flex gap-1 flex-wrap">
                    {row.original.tags?.map(t => <Badge key={t} variant="secondary" className="text-xs font-normal border-border bg-muted">{t}</Badge>)}
                </div>
            )
        },
        {
            accessorKey: "created_at",
            header: "Created",
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">
                    {new Date(row.original.created_at).toLocaleDateString()}
                </span>
            )
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="text-right flex items-center justify-end gap-2">
                    <Link to={`/contacts/${row.original.id}`} className="text-sm font-medium text-primary hover:underline">
                        View Detail
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                                <Pencil className="w-4 h-4 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(row.original.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Contact
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ];

    const contacts = data ?? [];
    const hasMore = contacts.length >= 20;

    return (
        <div>
            <PageHeader
                title="Contacts"
                description="Manage your customer database and attributes."
                action={
                    <Button onClick={handleCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Contact</Button>
                }
            />

            <div className="flex items-center py-4">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search contacts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="bg-card rounded-md shadow-sm border-0">
                <DataTable
                    columns={columns}
                    data={contacts}
                    isLoading={isLoading}
                />
                {/* Simple Pagination Control */}
                <div className="flex items-center justify-end space-x-2 py-4 px-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {page}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={!hasMore || isLoading}
                    >
                        Next
                    </Button>
                </div>
            </div>

            <ContactSheet
                open={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                contact={selectedContact}
            />
        </div>
    );
}