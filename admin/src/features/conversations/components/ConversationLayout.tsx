import React, { ReactNode } from 'react';

interface ConversationLayoutProps {
    list: ReactNode;
    children: ReactNode;
    sidebar: ReactNode;
    header?: ReactNode;
}

export function ConversationLayout({ list, children, sidebar, header }: ConversationLayoutProps) {
    return (
        <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-lg border border-border bg-background shadow-sm">
            {/* Conversation List Panel */}
            <div className="hidden w-[320px] shrink-0 flex-col border-r border-border md:flex">
                {list}
            </div>

            {/* Center: Chat Area */}
            <div className="flex min-w-0 flex-1 flex-col">
                {header}
                <div className="relative flex-1 overflow-hidden">
                    {children}
                </div>
            </div>

            {/* Right: Contact Sidebar */}
            <div className="hidden w-[340px] shrink-0 flex-col border-l border-border bg-card xl:flex">
                {sidebar}
            </div>
        </div>
    );
}
