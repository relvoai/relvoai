import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Contact, useCreateContact, useUpdateContact } from '../features/contacts/api';
import { Button, Input, Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, Separator } from '../components/UI';
import { Loader2, Plus, Trash2, X } from 'lucide-react';

interface ContactSheetProps {
    open: boolean;
    onClose: () => void;
    contact?: Contact | null; // If present, edit mode
}

interface ContactFormData {
    name: string;
    email: string;
    phone: string;
    avatar_url: string;
    tags: string; // Comma separated for input
    custom_attributes: { key: string; value: string }[];
}

export function ContactSheet({ open, onClose, contact }: ContactSheetProps) {
    const createContact = useCreateContact();
    const updateContact = useUpdateContact();

    const isEdit = !!contact;
    const isLoading = createContact.isPending || updateContact.isPending;

    const { register, control, handleSubmit, reset, setValue } = useForm<ContactFormData>({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            avatar_url: '',
            tags: '',
            custom_attributes: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "custom_attributes"
    });

    useEffect(() => {
        if (open) {
            if (contact) {
                reset({
                    name: contact.name,
                    email: contact.email || '',
                    phone: contact.phone || '',
                    avatar_url: contact.avatar_url || '',
                    tags: contact.tags.join(', '),
                    custom_attributes: Object.entries(contact.custom_attributes || {}).map(([key, value]) => ({
                        key,
                        value: String(value)
                    }))
                });
            } else {
                reset({
                    name: '',
                    email: '',
                    phone: '',
                    avatar_url: '',
                    tags: '',
                    custom_attributes: []
                });
            }
        }
    }, [open, contact, reset]);

    const onSubmit = (data: ContactFormData) => {
        const payload = {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            avatar_url: data.avatar_url || null,
            tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
            custom_attributes: data.custom_attributes.reduce((acc, curr) => {
                if (curr.key) acc[curr.key] = curr.value;
                return acc;
            }, {} as Record<string, unknown>)
        };

        if (isEdit && contact) {
            updateContact.mutate({ id: contact.id, data: payload }, {
                onSuccess: onClose
            });
        } else {
            createContact.mutate(payload, {
                onSuccess: onClose
            });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{isEdit ? 'Edit Contact' : 'New Contact'}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? 'Update contact details and attributes.' : 'Add a new contact to your database.'}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name <span className="text-red-500">*</span></label>
                            <Input {...register('name', { required: true })} placeholder="John Doe" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input {...register('email')} type="email" placeholder="john@example.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone</label>
                                <Input {...register('phone')} placeholder="+1 234 567 890" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Avatar URL</label>
                            <Input {...register('avatar_url')} placeholder="https://..." />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tags</label>
                            <Input {...register('tags')} placeholder="vip, lead, customer" />
                            <p className="text-xs text-muted-foreground">Comma separated values</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Custom Attributes</h4>
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ key: '', value: '' })}>
                                <Plus className="w-3 h-3 mr-1" /> Add Attribute
                            </Button>
                        </div>

                        {fields.length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                                No custom attributes defined
                            </div>
                        )}

                        <div className="space-y-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-2">
                                    <Input {...register(`custom_attributes.${index}.key` as const)} placeholder="Key (e.g. company)" className="flex-1" />
                                    <Input {...register(`custom_attributes.${index}.value` as const)} placeholder="Value" className="flex-1" />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <X className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <SheetFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isEdit ? 'Save Changes' : 'Create Contact'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
