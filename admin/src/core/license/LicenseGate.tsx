import React from 'react';
import { useLicense } from './useLicense';

interface LicenseGateProps {
    children: React.ReactNode;
    /** Rendered when the license is invalid / still loading. Defaults to null. */
    fallback?: React.ReactNode;
}

/**
 * Renders `children` only when the Enterprise license is valid.
 * Renders `fallback` (default: null) otherwise.
 */
export function LicenseGate({ children, fallback = null }: LicenseGateProps) {
    const { status } = useLicense();

    if (!status?.valid) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

export default LicenseGate;
