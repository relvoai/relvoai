import React, { useMemo, useState } from 'react';
import { Card, CardTitle, CardContent, CardHeader, Button, Input } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Loader2 } from 'lucide-react';
import { useReports } from '../features/reports/api';

function formatResponseTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export default function Reports() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);

    const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const { data: report, isLoading } = useReports({
        start_date: startDate,
        end_date: endDate,
    });

    const chartData = useMemo(() => {
        if (!report?.daily) return [];
        return report.daily.map((day) => ({
            name: new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            conversations: Number(day.conversations),
            messages: Number(day.messages),
        }));
    }, [report?.daily]);

    const totalConversations = report?.summary?.total_conversations ?? 0;
    const avgResponseTime = report?.summary?.avg_response_time_seconds ?? 0;
    const totalMessages = useMemo(
        () => chartData.reduce((sum, d) => sum + d.messages, 0),
        [chartData]
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
                    <p className="mt-1 text-muted-foreground">Performance metrics for your helpdesk.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-36"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-36"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-sm font-medium text-muted-foreground">Total Conversations</div>
                        {isLoading ? (
                            <Loader2 className="mt-2 h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <div className="mt-2 text-3xl font-bold text-foreground">{totalConversations.toLocaleString()}</div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-sm font-medium text-muted-foreground">Avg Response Time</div>
                        {isLoading ? (
                            <Loader2 className="mt-2 h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <div className="mt-2 text-3xl font-bold text-foreground">
                                {avgResponseTime > 0 ? formatResponseTime(avgResponseTime) : '--'}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-sm font-medium text-muted-foreground">Total Messages</div>
                        {isLoading ? (
                            <Loader2 className="mt-2 h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <div className="mt-2 text-3xl font-bold text-foreground">{totalMessages.toLocaleString()}</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Conversation Volume</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                    />
                                    <Bar dataKey="conversations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Conversations" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Message Volume</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                    />
                                    <Line type="monotone" dataKey="messages" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} name="Messages" />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
