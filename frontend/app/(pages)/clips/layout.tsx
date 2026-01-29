import { Suspense } from 'react';
import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

export default function ClipsLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
