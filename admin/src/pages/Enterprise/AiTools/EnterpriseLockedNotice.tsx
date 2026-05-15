import React from 'react';
import { Lock } from 'lucide-react';
import { Card } from '../../../components/UI';

export default function EnterpriseLockedNotice() {
    return (
        <Card className="p-12 text-center rounded-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold">Custom AI Tools require an Enterprise license.</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Upgrade to unlock per-workspace tool integrations for your AI agents.
            </p>
            <a
                href="#"
                className="inline-block mt-4 text-sm text-primary hover:underline"
            >
                Learn more
            </a>
        </Card>
    );
}
