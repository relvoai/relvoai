import React, { useState } from 'react';
import { VisitorResource } from '../types';
import { useOnlineVisitors } from '../features/visitors/api';
import { Card, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Avatar, Badge, Button } from '../components/UI';
import { MapPin, Monitor, ExternalLink, RefreshCw, List as ListIcon, Map as MapIcon, Loader2 } from 'lucide-react';

function WorldMap({ visitors }: { visitors: VisitorResource[] }) {
    return (
        <div className="relative w-full aspect-[16/9] bg-blue-50/50 dark:bg-zinc-900/50 rounded-xl overflow-hidden border border-border flex items-center justify-center">
            <svg viewBox="0 0 1000 500" className="w-full h-full text-slate-200 dark:text-zinc-800 fill-current">
                <path d="M150,120 Q200,80 250,120 T350,150 T450,120 T550,150 T650,120 T750,150 T850,120 V300 H150 Z" fill="currentColor" opacity="0.3" />
            </svg>

            {visitors.map(v => {
                if (!v.coordinates) return null;
                const left = ((v.coordinates.lng + 180) / 360) * 100;
                const top = ((90 - v.coordinates.lat) / 180) * 100;

                return (
                    <div
                        key={v.id}
                        className="absolute w-3 h-3 bg-primary rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer hover:scale-150 transition-transform z-10"
                        style={{ left: `${left}%`, top: `${top}%` }}
                    >
                        <span className="absolute flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20">
                            {v.contact?.name || 'Visitor'} • {v.ip_address}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function Visitors() {
    const { data: visitors, isLoading, error, refetch, isFetching } = useOnlineVisitors();
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

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
                <p className="text-destructive">Failed to load visitors</p>
                <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
            </div>
        );
    }

    const visitorList = visitors || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Online Visitors</h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time view of users currently browsing your sites.
                        {visitorList.length > 0 && <span className="ml-2 text-primary font-medium">({visitorList.length} online)</span>}
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-muted rounded-lg p-1">
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 gap-2"
                            onClick={() => setViewMode('list')}
                        >
                            <ListIcon className="w-4 h-4" /> List
                        </Button>
                        <Button
                            variant={viewMode === 'map' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 gap-2"
                            onClick={() => setViewMode('map')}
                        >
                            <MapIcon className="w-4 h-4" /> Map
                        </Button>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {viewMode === 'map' ? (
                <Card className="p-1">
                    <WorldMap visitors={visitorList} />
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {visitorList.map(v => (
                            <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                                <Avatar fallback="V" className="bg-primary/10 text-primary border-none" />
                                <div className="overflow-hidden">
                                    <div className="font-medium text-foreground truncate">{v.contact?.name || 'Guest'}</div>
                                    <div className="text-xs text-muted-foreground truncate">{v.ip_address}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Visitor</TableHead>
                                <TableHead>Current Page</TableHead>
                                <TableHead>Location/IP</TableHead>
                                <TableHead>Device</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visitorList.map(v => (
                                <TableRow key={v.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar fallback="V" className="bg-primary/10 text-primary border-none" />
                                            <div>
                                                <div className="font-medium text-foreground">{v.contact?.name || 'Guest'}</div>
                                                <div className="text-xs text-muted-foreground">ID: {v.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <a href={v.last_seen_url} className="text-primary hover:underline text-sm truncate max-w-[200px] flex items-center gap-1" target="_blank" rel="noreferrer">
                                            {v.last_seen_url}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm text-foreground">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                                {v.coordinates ? `${v.coordinates.lat.toFixed(2)}, ${v.coordinates.lng.toFixed(2)}` : 'Unknown'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{v.ip_address}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm text-foreground">
                                            <span className="flex items-center gap-1"><Monitor className="w-3 h-3 text-muted-foreground" /> {v.browser}</span>
                                            <span className="text-xs text-muted-foreground">{v.os}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="success" className="rounded-full">Browsing</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm">Start Chat</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {visitorList.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        No visitors online right now
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
}
