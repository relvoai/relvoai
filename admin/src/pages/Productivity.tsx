import React, { useState } from 'react';
import { CannedReplyResource } from '../types';
import { useCannedReplies, useCreateCannedReply, useDeleteCannedReply } from '../features/cannedReplies/api';
import { Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Button, Input, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Textarea, Switch } from '../components/UI';
import { Plus, Search, Command, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { extractApiError } from '../core/http/error';

export default function Productivity() {
  const [search, setSearch] = useState('');
  const { data: replies, isLoading, error } = useCannedReplies(search || undefined);
  const createReply = useCreateCannedReply();
  const deleteReply = useDeleteCannedReply();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ shortcut: '', content: '', is_shared: true });
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setFormData({ shortcut: '/', content: '', is_shared: true });
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.shortcut || !formData.content) return;
    const cleanShortcut = formData.shortcut.startsWith('/') ? formData.shortcut : `/${formData.shortcut}`;
    setFormError(null);

    createReply.mutate(
      { shortcut: cleanShortcut, content: formData.content, is_shared: formData.is_shared },
      {
        onSuccess: () => setIsDialogOpen(false),
        onError: (err) => setFormError(extractApiError(err, 'Failed to create canned reply.')),
      }
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    deleteReply.mutate(id);
  };

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
        <p className="text-destructive">Failed to load canned replies</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Canned Replies</h1>
          <p className="text-muted-foreground mt-1">Quick response templates for faster support.</p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" />
          New Reply
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>All Replies</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shortcuts..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shortcut</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {replies?.map((reply) => (
                <TableRow key={reply.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted">
                        <Command className="h-3 w-3" />
                      </div>
                      <span className="font-mono text-xs">{reply.shortcut}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">
                    {reply.content}
                  </TableCell>
                  <TableCell>
                    <Badge variant={reply.is_shared ? "secondary" : "outline"}>
                      {reply.is_shared ? 'Global' : 'Personal'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:text-destructive"
                      onClick={() => handleDelete(reply.id)}
                      disabled={deleteReply.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!replies || replies.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No canned replies yet. Create your first one!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Canned Reply</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Shortcut</label>
              <Input
                value={formData.shortcut}
                onChange={e => setFormData({ ...formData, shortcut: e.target.value })}
                placeholder="/hello"
              />
              <p className="text-xs text-muted-foreground">Type this in chat to insert content</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                placeholder="Hi there! How can I help you today?"
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Shared Reply</div>
                <div className="text-xs text-muted-foreground">Available to all agents</div>
              </div>
              <Switch
                checked={formData.is_shared}
                onCheckedChange={checked => setFormData({ ...formData, is_shared: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createReply.isPending}>
              {createReply.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}