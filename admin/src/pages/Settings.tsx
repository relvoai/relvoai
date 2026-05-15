import React from 'react';
import { useSettings, useUpdateSetting } from '../features/settings/api';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
    Input, Button, Switch,
    Tabs, TabsList, TabsTrigger, TabsContent,
} from '../components/UI';
import { Loader2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface GeneralFormData {
    company_name: string;
    support_email: string;
}

export default function Settings() {
    const { data: settings, isLoading, error } = useSettings();
    const updateSetting = useUpdateSetting();

    const getSettingValue = (key: string): string => {
        const setting = settings?.find(s => s.key === key);
        return (setting?.value as string) || '';
    };

    const getBoolSetting = (key: string): boolean => {
        const setting = settings?.find(s => s.key === key);
        return setting?.value === true || setting?.value === 'true' || setting?.value === '1';
    };

    const toggleSetting = (key: string) => {
        const current = getBoolSetting(key);
        updateSetting.mutate({ key, data: { value: !current } });
    };

    const { register, handleSubmit, formState: { isDirty } } = useForm<GeneralFormData>({
        values: {
            company_name: getSettingValue('company_name'),
            support_email: getSettingValue('support_email'),
        },
    });

    const onSave = (data: GeneralFormData) => {
        Object.entries(data).forEach(([key, value]) => {
            if (value !== getSettingValue(key)) {
                updateSetting.mutate({ key, data: { value } });
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <p className="text-destructive">Failed to load settings</p>
                <p className="mt-1 text-sm text-muted-foreground">{(error as Error).message}</p>
            </div>
        );
    }

    const notificationSettings = [
        { key: 'notify_new_conversation', label: 'New Conversation', description: 'Get notified when a new conversation is created' },
        { key: 'notify_new_message', label: 'New Message', description: 'Get notified when a new message is received' },
        { key: 'notify_conversation_assigned', label: 'Conversation Assigned', description: 'Get notified when a conversation is assigned to you' },
        { key: 'notify_conversation_mention', label: 'Mentions', description: 'Get notified when you are mentioned in a conversation' },
        { key: 'notify_email_enabled', label: 'Email Notifications', description: 'Receive notifications via email' },
        { key: 'notify_sound_enabled', label: 'Sound Alerts', description: 'Play a sound when notifications arrive' },
    ];

    const securitySettings: Array<{ key: string; label: string; description: string; type?: 'number' }> = [
        { key: 'security_two_factor_enabled', label: 'Two-Factor Authentication', description: 'Require 2FA for all admin users' },
        { key: 'security_ip_whitelist_enabled', label: 'IP Whitelist', description: 'Restrict admin access to specific IP addresses' },
        { key: 'security_session_timeout', label: 'Session Timeout (minutes)', description: 'Auto-logout after inactivity', type: 'number' },
        { key: 'security_password_min_length', label: 'Minimum Password Length', description: 'Minimum characters required for passwords', type: 'number' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h1>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Details</CardTitle>
                            <CardDescription>Manage your company information displayed to visitors.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium text-foreground">Company Name</label>
                                    <Input {...register('company_name')} placeholder="Your Company" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium text-foreground">Support Email</label>
                                    <Input {...register('support_email')} type="email" placeholder="support@example.com" />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={!isDirty || updateSetting.isPending}>
                                        {updateSetting.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>Configure how you receive alerts and updates.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y divide-border">
                                {notificationSettings.map(item => (
                                    <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                                        <div>
                                            <div className="text-sm font-medium text-foreground">{item.label}</div>
                                            <div className="text-sm text-muted-foreground">{item.description}</div>
                                        </div>
                                        <Switch
                                            checked={getBoolSetting(item.key)}
                                            onCheckedChange={() => toggleSetting(item.key)}
                                            disabled={updateSetting.isPending}
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Manage authentication and access control settings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y divide-border">
                                {securitySettings.map(item => (
                                    <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                                        <div>
                                            <div className="text-sm font-medium text-foreground">{item.label}</div>
                                            <div className="text-sm text-muted-foreground">{item.description}</div>
                                        </div>
                                        {item.type === 'number' ? (
                                            <Input
                                                type="number"
                                                className="w-24"
                                                value={getSettingValue(item.key)}
                                                onChange={e => updateSetting.mutate({ key: item.key, data: { value: e.target.value } })}
                                                disabled={updateSetting.isPending}
                                            />
                                        ) : (
                                            <Switch
                                                checked={getBoolSetting(item.key)}
                                                onCheckedChange={() => toggleSetting(item.key)}
                                                disabled={updateSetting.isPending}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
