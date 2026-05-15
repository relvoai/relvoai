import React from 'react';
import { UploadCloud, FileText, Link as LinkIcon, Type, Loader2, X } from 'lucide-react';
import { Button, Input, Textarea, cn } from '../../../components/UI';
import { useCreateKnowledgeSource, type KnowledgeType } from '../api';

interface Props {
    agentId: string;
}

const TABS: ReadonlyArray<{ id: KnowledgeType; label: string; icon: typeof FileText; description: string }> = [
    { id: 'pdf', label: 'PDF', icon: FileText, description: 'Drop a PDF up to 20 MB — we chunk and index it.' },
    { id: 'text', label: 'Text', icon: Type, description: 'Paste raw content (product docs, FAQs). Up to 500k characters.' },
    { id: 'url', label: 'URL', icon: LinkIcon, description: 'Point to a public URL — we crawl the page and index it.' },
];

function prettyBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function KnowledgeUploader({ agentId }: Props) {
    const [tab, setTab] = React.useState<KnowledgeType>('text');
    const [name, setName] = React.useState('');
    const [rawText, setRawText] = React.useState('');
    const [sourceUrl, setSourceUrl] = React.useState('');
    const [file, setFile] = React.useState<File | null>(null);
    const [dragging, setDragging] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const create = useCreateKnowledgeSource();

    const reset = (): void => {
        setName('');
        setRawText('');
        setSourceUrl('');
        setFile(null);
        setError(null);
    };

    const submit = async (): Promise<void> => {
        setError(null);
        const trimmedName = name.trim();

        if (tab === 'pdf') {
            if (!file) {
                setError('Pick a PDF file to upload.');
                return;
            }
            if (file.size > 20 * 1024 * 1024) {
                setError('PDF must be 20 MB or smaller.');
                return;
            }
            const finalName = trimmedName || file.name.replace(/\.pdf$/i, '');
            await create.mutateAsync({ agentId, data: { type: 'pdf', name: finalName, file } });
        } else if (tab === 'text') {
            if (!rawText.trim()) {
                setError('Paste the text you want to train on.');
                return;
            }
            if (rawText.length > 500000) {
                setError('Text must be under 500,000 characters.');
                return;
            }
            const finalName = trimmedName || `Text snippet (${new Date().toLocaleDateString()})`;
            await create.mutateAsync({ agentId, data: { type: 'text', name: finalName, raw_text: rawText } });
        } else {
            if (!sourceUrl.trim()) {
                setError('Paste a URL.');
                return;
            }
            try {
                // Rough client-side URL check (server re-validates)
                new URL(sourceUrl.trim());
            } catch {
                setError('That doesn\'t look like a valid URL.');
                return;
            }
            const finalName = trimmedName || sourceUrl.trim();
            await create.mutateAsync({ agentId, data: { type: 'url', name: finalName, source_url: sourceUrl.trim() } });
        }
        reset();
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped && dropped.type === 'application/pdf') {
            setFile(dropped);
        } else if (dropped) {
            setError('Only PDF files are supported here.');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                            setTab(t.id);
                            setError(null);
                        }}
                        className={cn(
                            'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                            tab === t.id
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                    >
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                    </button>
                ))}
            </div>

            <p className="text-sm text-muted-foreground">
                {TABS.find((t) => t.id === tab)?.description}
            </p>

            <div className="space-y-2">
                <label className="text-sm font-medium">Label (optional)</label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={tab === 'url' ? 'e.g. Pricing page' : 'A short name to recognise this source'}
                />
            </div>

            {tab === 'pdf' && (
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={cn(
                        'relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
                        dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/20'
                    )}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                            const picked = e.target.files?.[0] ?? null;
                            setFile(picked);
                            setError(null);
                        }}
                    />
                    {file ? (
                        <div className="flex items-center justify-center gap-3">
                            <FileText className="w-6 h-6 text-primary" />
                            <div className="text-left">
                                <div className="font-medium text-sm">{file.name}</div>
                                <div className="text-xs text-muted-foreground">{prettyBytes(file.size)}</div>
                            </div>
                            <button
                                type="button"
                                className="p-1 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFile(null);
                                }}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground" />
                            <div className="text-sm font-medium">Drop a PDF, or click to pick</div>
                            <div className="text-xs text-muted-foreground">Up to 20 MB</div>
                        </div>
                    )}
                </div>
            )}

            {tab === 'text' && (
                <Textarea
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste FAQs, docs, process descriptions..."
                />
            )}

            {tab === 'url' && (
                <Input
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://yourdomain.com/docs"
                />
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center justify-end">
                <Button onClick={submit} disabled={create.isPending}>
                    {create.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                    Train on this source
                </Button>
            </div>
        </div>
    );
}

export default KnowledgeUploader;
