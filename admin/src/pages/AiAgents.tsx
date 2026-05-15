import React from 'react';
import { Plus, Bot, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import {
    Button,
    Card,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../components/UI';
import {
    useAiAgents,
    useCreateAiAgent,
    useDeleteAiAgent,
    type AiAgentResource,
} from '../features/ai-agents/api';
import AgentCard from '../features/ai-agents/components/AgentCard';
import AgentForm from '../features/ai-agents/components/AgentForm';
import { usePermissions } from '../hooks/usePermissions';

export default function AiAgents() {
    const navigate = useNavigate();
    const { can } = usePermissions();
    const canManage = can('ai.agents.manage');
    const { data: agents, isLoading, error } = useAiAgents();
    const createAgent = useCreateAiAgent();
    const deleteAgent = useDeleteAiAgent();
    const [createOpen, setCreateOpen] = React.useState(false);

    const handleDelete = (agent: AiAgentResource): void => {
        if (!confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) {
            return;
        }
        deleteAgent.mutate(agent.id);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="AI Agents"
                description="Design autonomous assistants that handle conversations, escalate when needed, and learn from your knowledge base."
                action={
                    canManage ? (
                        <Button onClick={() => setCreateOpen(true)} className="rounded-xl">
                            <Plus className="w-4 h-4 mr-2" /> New agent
                        </Button>
                    ) : null
                }
            />

            {isLoading && (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {error && (
                <Card className="p-6 text-center rounded-2xl border-destructive/30 bg-destructive/5">
                    <p className="text-sm text-destructive">Failed to load agents: {(error as Error).message}</p>
                </Card>
            )}

            {!isLoading && !error && (agents?.length ?? 0) === 0 && (
                <Card className="p-12 text-center rounded-2xl">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold">Build your first AI agent</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                        Give it a name, a persona, attach it to a channel, then train it on your docs. Takes less than two minutes.
                    </p>
                    {canManage && (
                        <Button className="mt-6 rounded-xl" onClick={() => setCreateOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Create agent
                        </Button>
                    )}
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(agents ?? []).map((agent) => (
                    <React.Fragment key={agent.id}>
                        <AgentCard agent={agent} onDelete={canManage ? handleDelete : undefined} />
                    </React.Fragment>
                ))}
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-primary" />
                            Create AI Agent
                        </DialogTitle>
                    </DialogHeader>
                    <AgentForm
                        mode="create"
                        submitting={createAgent.isPending}
                        onCancel={() => setCreateOpen(false)}
                        onSubmit={(payload) => {
                            createAgent.mutate(payload, {
                                onSuccess: (agent) => {
                                    setCreateOpen(false);
                                    navigate(`/ai/agents/${agent.id}`);
                                },
                            });
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
