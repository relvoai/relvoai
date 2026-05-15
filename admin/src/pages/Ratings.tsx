import React from 'react';
import { useRatings } from '../features/ratings/api';
import { Card, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from '../components/UI';
import { Star, Loader2 } from 'lucide-react';

export default function Ratings() {
    const { data, isLoading } = useRatings();

    const summary = data?.summary;
    const ratings = data?.ratings || [];

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Ratings & Feedback</h1>
                    <p className="mt-1 text-muted-foreground">Customer satisfaction scores from closed conversations.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="flex flex-col items-center justify-center p-6">
                    <div className="text-3xl font-bold text-foreground">
                        {summary?.average_rating?.toFixed(1) ?? '-'}
                    </div>
                    <div className="mt-1 mb-2 flex text-amber-400">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Star
                                key={i}
                                className={`h-4 w-4 ${i <= Math.round(summary?.average_rating ?? 0) ? 'fill-current' : 'opacity-30'}`}
                            />
                        ))}
                    </div>
                    <div className="text-sm text-muted-foreground">Average Score</div>
                </Card>
                <Card className="flex flex-col items-center justify-center p-6">
                    <div className="text-3xl font-bold text-foreground">
                        {summary?.csat_score != null ? `${Math.round(summary.csat_score)}%` : '-'}
                    </div>
                    <div className="mt-1 mb-2 text-sm font-medium text-emerald-500">
                        {(summary?.csat_score ?? 0) >= 80 ? 'Top Tier' : (summary?.csat_score ?? 0) >= 60 ? 'Good' : 'Needs Improvement'}
                    </div>
                    <div className="text-sm text-muted-foreground">CSAT Score</div>
                </Card>
                <Card className="flex flex-col items-center justify-center p-6">
                    <div className="text-3xl font-bold text-foreground">
                        {summary?.total_responses ?? 0}
                    </div>
                    <div className="mt-1 mb-2 text-sm text-muted-foreground">All Time</div>
                    <div className="text-sm text-muted-foreground">Total Responses</div>
                </Card>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Score</TableHead>
                            <TableHead>Comment</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Agent</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ratings.map(r => (
                            <TableRow key={r.id}>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold">{r.rating}</span>
                                        <Star className="h-3 w-3 fill-current text-amber-400" />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {r.comment ? (
                                        <span className="italic text-foreground">"{r.comment}"</span>
                                    ) : (
                                        <span className="italic text-muted-foreground">No comment</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{r.customer_name}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="font-normal">{r.agent_name}</Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(r.created_at).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))}
                        {ratings.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                    No ratings yet. Ratings appear after customers rate their conversations.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
