
"use client";

import { Suspense } from 'react';

export default function AnalysisLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <Suspense>{children}</Suspense>;
}
