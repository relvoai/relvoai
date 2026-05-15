import React, { useState, useEffect, useRef } from 'react';
import { WidgetConfig } from '../../types';
import { MessageSquare, X, Send, Minus, MoreHorizontal, Smartphone, Monitor } from 'lucide-react';
import { Avatar } from '../UI';

interface WidgetPreviewCanvasProps {
    config: WidgetConfig;
    className?: string;
}

interface PreviewMessage {
    id: number;
    type: 'bot' | 'visitor';
    text: string;
}

export function WidgetPreviewCanvas({ config, className }: WidgetPreviewCanvasProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<PreviewMessage[]>([
        { id: 1, type: 'bot', text: config.welcome_message }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, isTyping]);

    useEffect(() => {
        setMessages(prev => {
            const updated = [...prev];
            if (updated.length > 0 && updated[0].type === 'bot') {
                updated[0] = { ...updated[0], text: config.welcome_message };
            }
            return updated;
        });
    }, [config.welcome_message]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        setMessages(prev => [...prev, { id: Date.now(), type: 'visitor', text: inputValue }]);
        setInputValue('');

        if (config.bot_enabled) {
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
                setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: 'This is an automated demo reply from the bot.' }]);
            }, 1500);
        }
    };

    const isLeft = config.position === 'bottom-left';
    const radius = config.radius ?? 16;

    return (
        <div className={`relative flex h-full flex-col overflow-hidden ${className}`}>
            {/* Subtle grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] bg-slate-50 dark:bg-zinc-900 dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)]" />

            {/* Device toggle */}
            <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                <button
                    onClick={() => setIsMobile(false)}
                    className={`rounded-md p-1.5 transition-colors ${!isMobile ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900' : 'text-slate-400 hover:text-slate-600 dark:text-zinc-500'}`}
                >
                    <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={() => setIsMobile(true)}
                    className={`rounded-md p-1.5 transition-colors ${isMobile ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900' : 'text-slate-400 hover:text-slate-600 dark:text-zinc-500'}`}
                >
                    <Smartphone className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Simulated website skeleton */}
            <div className="pointer-events-none absolute inset-0 flex flex-col gap-3 p-10 pt-16 opacity-30">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-24 rounded-md bg-slate-300 dark:bg-zinc-600" />
                    <div className="ml-auto flex gap-2">
                        <div className="h-4 w-12 rounded bg-slate-200 dark:bg-zinc-700" />
                        <div className="h-4 w-12 rounded bg-slate-200 dark:bg-zinc-700" />
                        <div className="h-4 w-12 rounded bg-slate-200 dark:bg-zinc-700" />
                    </div>
                </div>
                <div className="h-48 w-full rounded-lg bg-slate-200 dark:bg-zinc-700" />
                <div className="flex gap-3">
                    <div className="h-28 flex-1 rounded-lg bg-slate-200 dark:bg-zinc-700" />
                    <div className="h-28 flex-1 rounded-lg bg-slate-200 dark:bg-zinc-700" />
                    <div className="h-28 flex-1 rounded-lg bg-slate-200 dark:bg-zinc-700" />
                </div>
                <div className="h-20 w-full rounded-lg bg-slate-200 dark:bg-zinc-700" />
            </div>

            {/* Mobile frame */}
            <div className={`relative mx-auto h-full w-full transition-all duration-300 ${isMobile ? 'max-w-[375px] border-x border-slate-300 bg-white shadow-2xl dark:border-zinc-600 dark:bg-zinc-900' : 'max-w-full'}`}>

                {/* Widget area */}
                <div className={`absolute bottom-5 z-20 flex flex-col ${isLeft ? 'left-5 items-start' : 'right-5 items-end'}`} style={{ maxWidth: 'calc(100% - 40px)' }}>

                    {/* Chat window */}
                    {isOpen && (
                        <div
                            className={`mb-3 flex flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900
                            ${isMobile ? 'fixed inset-0 z-50 rounded-none' : 'h-[520px] w-[360px]'}`}
                            style={{ borderRadius: isMobile ? 0 : `${radius}px` }}
                        >
                            {/* Header */}
                            <div className="shrink-0 px-4 py-3.5 text-white" style={{ backgroundColor: config.theme_color }}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-base font-semibold">{config.welcome_title || 'Support'}</h3>
                                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/70">
                                            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                                            We typically reply in a few minutes
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button className="rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setIsOpen(false)} className="rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                                            {isMobile ? <X className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 p-4 dark:bg-zinc-950/50">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex gap-2.5 ${msg.type === 'visitor' ? 'flex-row-reverse' : ''}`}>
                                        {msg.type === 'bot' && (
                                            <Avatar fallback="B" className="h-7 w-7 shrink-0 border-none bg-slate-200 text-[10px] dark:bg-zinc-700" />
                                        )}
                                        <div
                                            className={`max-w-[80%] break-words rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed shadow-sm
                                            ${msg.type === 'visitor'
                                                ? 'rounded-tr-sm text-white'
                                                : 'rounded-tl-sm border border-slate-100 bg-white text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                                            }`}
                                            style={msg.type === 'visitor' ? { backgroundColor: config.theme_color } : {}}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}

                                {isTyping && (
                                    <div className="flex gap-2.5">
                                        <Avatar fallback="B" className="h-7 w-7 shrink-0 border-none bg-slate-200 text-[10px] dark:bg-zinc-700" />
                                        <div className="flex h-9 w-14 items-center justify-center gap-1 rounded-2xl rounded-tl-sm border border-slate-100 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.1s]" />
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Composer */}
                            <div className="shrink-0 border-t border-slate-100 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                                <div className="relative">
                                    <input
                                        className="w-full rounded-full bg-slate-100 py-2.5 pl-4 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-opacity-40 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                                        style={{ '--tw-ring-color': config.theme_color } as React.CSSProperties}
                                        placeholder="Type a message..."
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    />
                                    <button
                                        className="absolute right-1.5 top-1.5 rounded-full p-1.5 text-white transition-opacity hover:opacity-90"
                                        style={{ backgroundColor: config.theme_color }}
                                        onClick={handleSend}
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                {config.show_branding !== false && (
                                    <p className="mt-1.5 text-center text-[9px] font-medium text-slate-400 dark:text-zinc-600">
                                        Powered by <span className="font-bold">Relvo</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Launcher */}
                    {!isMobile && (
                        <div className={`flex items-center gap-2.5 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                            {config.launcher_style === 'text_bubble' && !isOpen && (
                                <div className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-lg dark:bg-zinc-800 dark:text-zinc-200">
                                    {config.launcher_text || 'Chat with us'}
                                </div>
                            )}
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="relative flex h-12 w-12 items-center justify-center rounded-full text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
                                style={{ backgroundColor: config.theme_color }}
                            >
                                {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                                {!isOpen && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
