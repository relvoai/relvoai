import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInboxes } from '../features/inboxes/api';
import { Plus, Inbox, Users, MessageSquare, ChevronRight, Loader2, Mail, Send, Webhook, Phone, Globe } from 'lucide-react';
import { Button, cn } from '../components/UI';

export default function InboxList() {
    const navigate = useNavigate();
    const { data: inboxes, isLoading, error } = useInboxes();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <p className="text-destructive">Failed to load inboxes</p>
                <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Inboxes</h1>
                    <p className="text-muted-foreground">Manage your conversation channels</p>
                </div>
                <Button onClick={() => navigate('/inboxes/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Inbox
                </Button>
            </div>

            {/* Inbox List */}
            {inboxes && inboxes.length > 0 ? (
                <div className="grid gap-4">
                    {inboxes.map((inbox) => (
                        <div
                            key={inbox.id}
                            onClick={() => navigate(`/inboxes/${inbox.id}`)}
                            className={cn(
                                "p-4 bg-card rounded-lg cursor-pointer shadow-sm",
                                "hover:border-primary/50 hover:shadow-sm transition-all",
                                "flex items-center justify-between group"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                                    {(() => {
                                        const type = inbox.channels?.[0]?.type;
                                        switch (type) {
                                            case 'email': return <Mail className="w-5 h-5" />;
                                            case 'telegram': return <Send className="w-5 h-5" />;
                                            case 'whatsapp': return <Phone className="w-5 h-5" />;
                                            case 'api': return <Webhook className="w-5 h-5" />;
                                            case 'web_chat': return <Globe className="w-5 h-5" />;
                                            default: return <Inbox className="w-5 h-5" />;
                                        }
                                    })()}
                                </div>
                                <div>
                                    <h3 className="font-semibold">{inbox.name}</h3>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            {inbox.channels_count} channel{inbox.channels_count !== 1 ? 's' : ''}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3.5 h-3.5" />
                                            {inbox.agents_count} agent{inbox.agents_count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                    inbox.is_active
                                        ? "bg-green-500/10 text-green-600"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {inbox.is_active ? 'Active' : 'Inactive'}
                                </span>
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-12 text-center border border-dashed border-border rounded-lg">
                    <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No inboxes yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first inbox to start receiving conversations</p>
                    <Button onClick={() => navigate('/inboxes/create')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Inbox
                    </Button>
                </div>
            )}
        </div>
    );
}
