import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/UI';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { MessageSquare, Users, Clock, Activity, Loader2 } from 'lucide-react';
import { useReports } from '../features/reports/api';
import { useConversations } from '../features/conversations/api';

function formatResponseTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export default function Dashboard() {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const reportParams = useMemo(() => ({
        start_date: sevenDaysAgo.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
    }), []);

    const { data: report, isLoading: reportLoading } = useReports(reportParams);
    const { data: openConversations } = useConversations({ status: 'open' });

    const chartData = useMemo(() => {
        if (!report?.daily) return [];
        return report.daily.map((day) => ({
            name: new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
            conversations: Number(day.conversations),
            messages: Number(day.messages),
        }));
    }, [report?.daily]);

    const totalConversations = report?.summary?.total_conversations ?? 0;
    const avgResponseTime = report?.summary?.avg_response_time_seconds ?? 0;
    const openCount = openConversations?.length ?? 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
                    <p className="mt-1 text-muted-foreground">Overview of your helpdesk performance.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="transition-colors hover:border-primary/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversations (7d)</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {reportLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{totalConversations.toLocaleString()}</div>
                                <p className="mt-1 text-xs text-muted-foreground">Last 7 days</p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card className="transition-colors hover:border-primary/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Conversations</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{openCount}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Awaiting response</p>
                    </CardContent>
                </Card>
                <Card className="transition-colors hover:border-primary/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {reportLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    {avgResponseTime > 0 ? formatResponseTime(avgResponseTime) : '--'}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">Last 7 days</p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card className="transition-colors hover:border-primary/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Messages</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {reportLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    {chartData.length > 0
                                        ? chartData[chartData.length - 1].messages.toLocaleString()
                                        : '0'}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">Today</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Weekly Volume</CardTitle>
                        <CardDescription>Conversations and messages over the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {reportLoading ? (
                            <div className="flex h-[350px] items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={chartData}>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar
                                        dataKey="conversations"
                                        fill="hsl(var(--primary))"
                                        radius={[4, 4, 0, 0]}
                                        barSize={32}
                                        name="Conversations"
                                    />
                                    <Bar
                                        dataKey="messages"
                                        fill="hsl(var(--primary) / 0.3)"
                                        radius={[4, 4, 0, 0]}
                                        barSize={32}
                                        name="Messages"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                        <CardDescription>Current period summary</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {chartData.map((day, i) => (
                                <div className="flex items-center" key={i}>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{day.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {day.conversations} conversations, {day.messages} messages
                                        </p>
                                    </div>
                                    <div className="ml-auto text-sm font-semibold">
                                        {day.conversations}
                                    </div>
                                </div>
                            ))}
                            {chartData.length === 0 && !reportLoading && (
                                <p className="text-sm text-muted-foreground">No data for this period</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
