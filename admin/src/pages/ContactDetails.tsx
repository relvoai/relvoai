import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContact, useUpdateContact, useContactConversations, useContactNotes, useCreateContactNote, useMergeContact, useContacts } from '../features/contacts/api';
import { Button, Input, Avatar, Badge, Card, Tabs, TabsList, TabsTrigger, TabsContent, Separator, Textarea } from '../components/UI';
import { CountrySelect, CountryCodeSelect } from '../components/CountrySelect';
import { ChevronRight, Mail, Phone, MapPin, Globe, Github, Facebook, Instagram, Twitter, MessageSquare, Loader2, StickyNote, Merge, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';

function ContactHistoryTab({ contactId }: { contactId: string }) {
    const { data: conversations, isLoading } = useContactConversations(contactId);

    // Unwrap if necessary
    const list = (conversations as any)?.data || conversations || [];

    if (isLoading) return <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />;

    if (list.length === 0) return <div className="text-center p-4 text-muted-foreground text-sm">No conversation history.</div>;

    return (
        <div className="space-y-3">
            {list.map((conv: any) => (
                <div key={conv.id} className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${conv.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {conv.status === 'open' ? 'Op' : 'Cl'}
                        </div>
                        <div>
                            <div className="text-sm font-medium">{conv.subject || 'No Subject'}</div>
                            <div className="text-xs text-muted-foreground">{new Date(conv.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" asChild>
                        <Link to={`/inbox/${conv.id}`}><ArrowRight className="w-4 h-4" /></Link>
                    </Button>
                </div>
            ))}
        </div>
    );
}

function ContactNotesTab({ contactId }: { contactId: string }) {
    const { data: notesData, isLoading } = useContactNotes(contactId);
    const createNote = useCreateContactNote();
    const [content, setContent] = useState('');

    // Unwrap if necessary (handles both array and data envelope)
    const notes = (notesData as any)?.data || notesData || [];

    const handleAdd = () => {
        if (!content.trim()) return;
        createNote.mutate({ id: contactId, data: { content } }, {
            onSuccess: () => setContent('')
        });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Textarea
                    placeholder="Add a note..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="min-h-[80px] text-sm"
                />
                <div className="flex justify-end">
                    <Button size="sm" onClick={handleAdd} disabled={createNote.isPending || !content.trim()}>
                        {createNote.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <StickyNote className="w-3 h-3 mr-1" />}
                        Add Note
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /> :
                    notes && notes.length > 0 ? (
                        notes.map((note) => (
                            <div key={note.id} className="bg-card p-3 rounded-lg border text-sm space-y-2">
                                <p>{note.content}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Avatar src={note.user?.avatar_url} fallback={note.user?.name?.[0]} className="w-4 h-4" />
                                    <span>{note.user?.name || 'Agent'}</span>
                                    <span>•</span>
                                    <span>{new Date(note.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground text-sm py-4">No notes yet</div>
                    )
                }
            </div>
        </div>
    );
}

function ContactMergeTab({ contactId }: { contactId: string }) {
    const [search, setSearch] = useState('');
    const { data: contactsData } = useContacts(1, search);
    const mergeContact = useMergeContact();
    const navigate = useNavigate();
    // Only safe if useContacts accepts 'search' param and debouncing happens inside hook or here.
    // Simplified for now assuming simple string match.

    const contacts = (contactsData as any)?.data || [];
    const potentialTargets = contacts.filter((c: any) => c.id !== contactId);

    const handleMerge = (targetId: string) => {
        if (!confirm('Merging will delete this contact and move all data to the target. Continue?')) return;
        mergeContact.mutate({ id: contactId, data: { target_contact_id: targetId } }, {
            onSuccess: (data) => {
                alert('Contacts merged successfully.');
                navigate(`/contacts/${targetId}`);
            }
        });
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Merging contacts will move all attributes, conversations, and notes to the target contact. The current contact will be deleted.
            </p>

            <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">Find target contact</label>
                <Input
                    placeholder="Search by name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                {potentialTargets.length > 0 ? potentialTargets.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md group">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Avatar src={c.avatar_url} fallback={c.name[0]} className="w-6 h-6" />
                            <div className="truncate text-sm font-medium">{c.name}</div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-xs opacity-0 group-hover:opacity-100" onClick={() => handleMerge(c.id)}>
                            Merge
                        </Button>
                    </div>
                )) : (
                    <div className="text-xs text-center text-muted-foreground py-2">No matching contacts found</div>
                )}
            </div>
        </div>
    );
}

export default function ContactDetails() {
    const { id } = useParams<{ id: string }>();
    const { data: dataResponse, isLoading, error } = useContact(id || '');
    // Handle both cases: if response is wrapped in 'data' prop or is direct
    const contact = (dataResponse as any)?.data || dataResponse;
    const updateContact = useUpdateContact();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('attributes');

    // Local state for editable fields (starting with defaults)
    const [phoneCode, setPhoneCode] = useState('234');
    const [country, setCountry] = useState((contact?.custom_attributes?.country as string) || 'Nigeria');

    // Wire up effects to sync with contact data if it loads later or changes
    React.useEffect(() => {
        if (contact?.custom_attributes?.country) {
            setCountry(contact.custom_attributes.country as string);
        }
        // Note: phone code might need to be parsed from contact.phone if it includes it, 
        // but for now we default to '234' or keep user selection.
    }, [contact]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !contact) {
        return (
            <div className="p-8 text-center text-destructive">
                Contact not found or error loading details.
                <br />
                <Link to="/contacts" className="text-primary hover:underline mt-4 inline-block">Back to Contacts</Link>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] -m-6">
            {/* Left Column - Profile & Edit */}
            <div className="w-[60%] border-r border-border overflow-y-auto p-8 bg-background">
                {/* Breadcrumbs */}
                <div className="flex items-center text-sm text-muted-foreground mb-6">
                    <Link to="/contacts" className="hover:text-foreground">Contacts</Link>
                    <ChevronRight className="w-4 h-4 mx-2" />
                    <span className="text-foreground">{contact.name}</span>
                </div>

                {/* Header Actions */}
                <div className="flex justify-end gap-3 mb-6">
                    <Button variant="secondary" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-0">Block contact</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">Send message</Button>
                </div>

                {/* Profile Header */}
                <div className="mb-8">
                    <Avatar
                        src={contact.avatar_url || ''}
                        fallback={contact.name?.[0]}
                        className="w-20 h-20 rounded-xl text-2xl font-medium mb-4 bg-amber-900/50 text-amber-500"
                    />
                    <h1 className="text-2xl font-bold mb-1">{contact.name}</h1>
                    <p className="text-sm text-muted-foreground mb-4">
                        Created {new Date(contact.created_at).toLocaleDateString()} • Last active {new Date(contact.updated_at).toLocaleDateString()}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {contact.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="rounded-md px-2 py-1 text-xs font-normal">
                                {tag}
                            </Badge>
                        ))}
                        <Button variant="outline" size="sm" className="h-6 text-xs border-dashed text-muted-foreground">+ tag</Button>
                    </div>
                </div>

                <Separator className="my-8" />

                {/* Edit Contact Details */}
                <div className="space-y-6">
                    <h3 className="text-sm font-semibold">Edit contact details</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="First Name" defaultValue={contact.name.split(' ')[0]} className="bg-muted/30" />
                        <Input placeholder="Last Name" defaultValue={contact.name.split(' ').slice(1).join(' ')} className="bg-muted/30" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <Input defaultValue={contact.email} className="pl-9 bg-muted/30" />
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                            <CountryCodeSelect
                                value={phoneCode}
                                onChange={setPhoneCode}
                                className="w-full"
                            />
                            <Input defaultValue={contact.phone} className="bg-muted/30" placeholder="Phone number" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            placeholder="Location"
                            defaultValue={(contact.custom_attributes?.location as string) || 'Port Harcourt'}
                            className="bg-muted/30"
                        />
                        <div className="relative">
                            <CountrySelect
                                value={country}
                                onChange={setCountry}
                                className="bg-muted/30"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Enter the bio" className="bg-muted/30" />
                        <Input placeholder="Enter the company name" className="bg-muted/30" />
                    </div>
                </div>

                <Separator className="my-8" />

                {/* Edit Social Links */}
                <div className="space-y-6">
                    <h3 className="text-sm font-semibold">Edit social links</h3>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-1 relative">
                            <Input placeholder="https://google.com" className="pl-8 bg-muted/30" />
                            <Github className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                        </div>
                        <Button variant="secondary" className="justify-start text-muted-foreground bg-muted/30 hover:bg-muted/50"><Facebook className="w-4 h-4 mr-2" /> Add Facebook</Button>
                        <Button variant="secondary" className="justify-start text-muted-foreground bg-muted/30 hover:bg-muted/50"><Instagram className="w-4 h-4 mr-2" /> Add Instagram</Button>
                        <Button variant="secondary" className="justify-start text-muted-foreground bg-muted/30 hover:bg-muted/50"><MessageSquare className="w-4 h-4 mr-2" /> Add TikTok</Button>
                        <Button variant="secondary" className="justify-start text-muted-foreground bg-muted/30 hover:bg-muted/50"><Twitter className="w-4 h-4 mr-2" /> Add Twitter</Button>
                        <Button variant="secondary" className="justify-start text-muted-foreground bg-muted/30 hover:bg-muted/50"><Github className="w-4 h-4 mr-2" /> Add Github</Button>
                    </div>

                    <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white w-32">Update contact</Button>
                </div>
            </div>

            {/* Right Column - Tabs */}
            <div className="w-[40%] bg-muted/10 p-8">
                <Tabs defaultValue="attributes" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="flex w-full bg-muted/40 p-1 rounded-xl mb-8 border border-border/40">
                        {['Attributes', 'History', 'Notes', 'Merge'].map(tab => (
                            <TabsTrigger
                                key={tab.toLowerCase()}
                                value={tab.toLowerCase()}
                                className="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:scale-[1.02] hover:bg-background/40 hover:text-foreground text-muted-foreground"
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="attributes" className="mt-0">
                        <div className="space-y-4">
                            {contact.custom_attributes && Object.keys(contact.custom_attributes).length > 0 ? (
                                <div className="grid gap-4">
                                    {Object.entries(contact.custom_attributes).map(([key, value]) => (
                                        <div key={key} className="grid grid-cols-3 gap-2 text-sm bg-muted/20 p-3 rounded-md">
                                            <div className="font-medium capitalize text-muted-foreground">{key.replace(/_/g, ' ')}</div>
                                            <div className="col-span-2">{String(value)}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-muted-foreground text-sm leading-relaxed p-4 border border-dashed rounded-lg text-center">
                                    No custom attributes found.
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                        <ContactHistoryTab contactId={contact.id} />
                    </TabsContent>

                    <TabsContent value="notes" className="mt-0">
                        <ContactNotesTab contactId={contact.id} />
                    </TabsContent>

                    <TabsContent value="merge" className="mt-0">
                        <ContactMergeTab contactId={contact.id} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
