import React, { useState } from 'react';
import { DepartmentResource } from '../types';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '../features/departments/api';
import { Card, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Switch } from '../components/UI';
import { Plus, Users, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { extractApiError } from '../core/http/error';

export default function Departments() {
  const { data: departments, isLoading, error } = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentResource | null>(null);
  const [formData, setFormData] = useState({ name: '', is_active: true });
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setFormData({ name: '', is_active: true });
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (dept: DepartmentResource) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, is_active: dept.is_active });
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      setFormError('Department name is required.');
      return;
    }
    setFormError(null);

    if (editingDept) {
      updateDepartment.mutate(
        { id: editingDept.id, data: formData },
        {
          onSuccess: () => setIsDialogOpen(false),
          onError: (err) => setFormError(extractApiError(err, 'Failed to update department.')),
        }
      );
    } else {
      createDepartment.mutate(formData, {
        onSuccess: () => setIsDialogOpen(false),
        onError: (err) => setFormError(extractApiError(err, 'Failed to create department.')),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    deleteDepartment.mutate(id);
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
        <p className="text-destructive">Failed to load departments</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  const isSaving = createDepartment.isPending || updateDepartment.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Departments</h1>
          <p className="text-muted-foreground mt-1">Organize your team into functional groups.</p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" />
          Add Department
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Agents</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments?.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-medium text-foreground">{d.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{d.users_count} agents</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={d.is_active ? 'success' : 'secondary'}>
                    {d.is_active ? 'Active' : 'Archived'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(d)}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!departments || departments.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No departments yet. Create your first one!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? 'Edit Department' : 'Create Department'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Department Name</label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sales, Support"
              />
            </div>
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Active Status</div>
                <div className="text-xs text-muted-foreground">Allow agents to be assigned</div>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}