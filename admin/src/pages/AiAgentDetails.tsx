import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Radio, BookOpen, SlidersHorizontal, Sparkles, Settings2 } from 'lucide-react';
import { Button, Card, Tabs, TabsContent, TabsList, TabsTrigger, cn } from '../components/UI';
import {
    useAiAgent,
    useUpdateAiAgent,
    type AgentUpsertPayload,
} from '../features/ai-agents/api';
import AgentForm from '../features/ai-agents/components/AgentForm';
import AgentChannelAttachments from '../features/ai-agents/components/AgentChannelAttachments';
import HandoffPolicyEditor from '../features/ai-agents/components/HandoffPolicyEditor';
import KnowledgeUploader from '../features/ai-agents/components/KnowledgeUploader';
import KnowledgeTable from '../features/ai-agents/components/KnowledgeTable';

export default function AiAgentDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: agent, isLoading, error } = useAiAgent(id);
    const update = useUpdateAiAgent();

    const handleSave = (payload: AgentUpsertPayload): void => {
        if (!id) {
            return;
        }
        update.mutate({ id, data: payload });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !agent) {
        return (
            <Card className="p-8 text-center rounded-2xl border-destructive/30 bg-destructive/5">
                <p className="text-destructive">Failed to load agent</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/ai/agents')}>
                    Back to agents
                </Button>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/ai/agents')}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            {agent.name}
                            <span
                                className={cn(
                                    'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-semibold',
                                    agent.is_active
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-muted text-muted-foreground'
                                )}
                            >
                                {agent.is_active ? 'Active' : 'Off'}
                            </span>
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {agent.provider ?? '—'} · {agent.model ?? '—'} · temp {agent.temperature?.toFixed?.(2) ?? '0.00'}
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="h-11 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="gap-2 rounded-lg">
                        <Sparkles className="w-3.5 h-3.5" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="instructions" className="gap-2 rounded-lg">
                        <Settings2 className="w-3.5 h-3.5" /> Instructions
                    </TabsTrigger>
                    <TabsTrigger value="channels" className="gap-2 rounded-lg">
                        <Radio className="w-3.5 h-3.5" /> Channels
                    </TabsTrigger>
                    <TabsTrigger value="training" className="gap-2 rounded-lg">
                        <BookOpen className="w-3.5 h-3.5" /> Training
                    </TabsTrigger>
                    <TabsTrigger value="handoff" className="gap-2 rounded-lg">
                        <SlidersHorizontal className="w-3.5 h-3.5" /> Handoff
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <Card className="p-6 rounded-2xl">
                        <AgentForm
                            mode="edit"
                            defaultValues={agent}
                            submitting={update.isPending}
                            onSubmit={handleSave}
                        />
                    </Card>
                </TabsContent>

                <TabsContent value="instructions">
                    <Card className="p-6 rounded-2xl space-y-4">
                        <div>
                            <h3 className="font-semibold">Instruction stack</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                The final prompt assembled at chat time combines three layers:
                            </p>
                        </div>
                        <ol className="space-y-3 text-sm">
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                    1
                                </span>
                                <div>
                                    <div className="font-medium">Global system instruction</div>
                                    <div className="text-muted-foreground text-xs">
                                        Set platform-wide in AI → System Instruction. Applies to every agent.
                                    </div>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                    2
                                </span>
                                <div>
                                    <div className="font-medium">Agent persona</div>
                                    <div className="text-muted-foreground text-xs">Set on the Overview tab.</div>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                    3
                                </span>
                                <div>
                                    <div className="font-medium">Custom instructions (below)</div>
                                    <div className="text-muted-foreground text-xs">
                                        Fine-grained rules, do's and don'ts, tone guidelines specific to this agent.
                                    </div>
                                </div>
                            </li>
                        </ol>
                        <InstructionEditor agent={agent} onSave={handleSave} saving={update.isPending} />
                    </Card>
                </TabsContent>

                <TabsContent value="channels">
                    <Card className="p-6 rounded-2xl">
                        <div className="mb-4">
                            <h3 className="font-semibold">Channel attachments</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Pin this agent to one or more channels. Mark a primary to auto-handle inbound messages.
                            </p>
                        </div>
                        <AgentChannelAttachments agent={agent} />
                    </Card>
                </TabsContent>

                <TabsContent value="training">
                    <div className="space-y-4">
                        <Card className="p-6 rounded-2xl">
                            <h3 className="font-semibold mb-1">Add a source</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Training happens in the background. Expect status to flip from Processing to Ready within a minute or two.
                            </p>
                            <KnowledgeUploader agentId={agent.id} />
                        </Card>
                        <KnowledgeTable agentId={agent.id} />
                    </div>
                </TabsContent>

                <TabsContent value="handoff">
                    <Card className="p-6 rounded-2xl">
                        <div className="mb-6">
                            <h3 className="font-semibold">Handoff policy</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Define when the AI should hand the conversation to a human teammate.
                            </p>
                        </div>
                        <HandoffPolicyEditor
                            value={agent.handoff_policy}
                            onChange={(policy) => handleSave({ handoff_policy: policy })}
                        />
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

interface InstructionEditorProps {
    agent: {
        custom_instructions: string | null;
    };
    saving: boolean;
    onSave: (data: AgentUpsertPayload) => void;
}

const INSTRUCTION_MAX = 4000;

function InstructionEditor({ agent, saving, onSave }: InstructionEditorProps) {
    const [value, setValue] = React.useState(agent.custom_instructions ?? '');
    React.useEffect(() => {
        setValue(agent.custom_instructions ?? '');
    }, [agent.custom_instructions]);

    const dirty = value !== (agent.custom_instructions ?? '');

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Custom instructions</label>
                <span className="text-xs text-muted-foreground tabular-nums">
                    {value.length} / {INSTRUCTION_MAX}
                </span>
            </div>
            <textarea
                rows={10}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={INSTRUCTION_MAX}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={`e.g.\n- Only answer from knowledge sources. If unsure, escalate.\n- Never quote prices above $500 without confirmation.\n- Always sign off with the company name.`}
            />
            <div className="flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    disabled={!dirty}
                    onClick={() => setValue(agent.custom_instructions ?? '')}
                >
                    Reset
                </Button>
                <Button disabled={!dirty || saving} onClick={() => onSave({ custom_instructions: value.trim() || null })}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save instructions
                </Button>
            </div>
        </div>
    );
}
