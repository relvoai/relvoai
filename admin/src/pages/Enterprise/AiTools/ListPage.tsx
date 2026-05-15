import React from 'react';
import { Plus, Loader2, Trash2, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import {
    Button,
    Card,
    Badge,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '../../../components/UI';
import { LicenseGate } from '../../../core/license/LicenseGate';
import EnterpriseLockedNotice from './EnterpriseLockedNotice';
import { useAiTools, useDeleteAiTool, type AiCustomTool } from './hooks';

function AiToolsTable() {
    const navigate = useNavigate();
    const { data: tools, isLoading, error } = useAiTools();
    const deleteTool = useDeleteAiTool();

    const handleDelete = (tool: AiCustomTool): void => {
        if (!confirm(`Delete tool "${tool.name}"? This cannot be undone.`)) {
            return;
        }
        deleteTool.mutate(tool.id);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Custom AI Tools"
                description="Register HTTP endpoints your AI agents can call as tools. Enterprise feature."
                action={
                    <Button
                        onClick={() => navigate('/enterprise/ai-tools/new')}
                        className="rounded-xl"
                    >
                        <Plus className="w-4 h-4 mr-2" /> New tool
                    </Button>
                }
            />

            {isLoading && (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {error && (
                <Card className="p-6 text-center rounded-2xl border-destructive/30 bg-destructive/5">
                    <p className="text-sm text-destructive">
                        Failed to load AI tools: {(error as Error).message}
                    </p>
                </Card>
            )}

            {!isLoading && !error && (tools?.length ?? 0) === 0 && (
                <Card className="p-12 text-center rounded-2xl">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <Wrench className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold">No custom tools yet</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                        Register an external HTTP endpoint to extend what your agents can do.
                    </p>
                    <Button
                        className="mt-6 rounded-xl"
                        onClick={() => navigate('/enterprise/ai-tools/new')}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Create tool
                    </Button>
                </Card>
            )}

            {!isLoading && !error && (tools?.length ?? 0) > 0 && (
                <Card className="rounded-2xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Endpoint</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Agent</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(tools ?? []).map((tool) => (
                                <TableRow key={tool.id}>
                                    <TableCell className="font-medium">{tool.name}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-xs">
                                        {tool.endpoint}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{tool.http_method}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {tool.ai_agent_id ?? 'any agent'}
                                    </TableCell>
                                    <TableCell>
                                        {tool.enabled ? (
                                            <Badge variant="success">Enabled</Badge>
                                        ) : (
                                            <Badge variant="secondary">Disabled</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(tool)}
                                            disabled={deleteTool.isPending}
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
}

export default function AiToolsListPage() {
    return (
        <LicenseGate fallback={<EnterpriseLockedNotice />}>
            <AiToolsTable />
        </LicenseGate>
    );
}
