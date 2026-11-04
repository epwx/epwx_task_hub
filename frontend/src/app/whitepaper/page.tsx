import type { Metadata } from 'next';
import { WhitepaperDocument } from '@/components/WhitepaperDocument';

export const metadata: Metadata = {
  title: 'EPWX Whitepaper',
  description: 'Official EPWX utility whitepaper covering token utility, reward flows, platform architecture, security controls, and current implementation status.',
  alternates: {
    canonical: '/whitepaper',
  },
  openGraph: {
    title: 'EPWX Whitepaper',
    description: 'Official EPWX utility whitepaper covering token utility, reward flows, platform architecture, and security controls.',
    url: '/whitepaper',
    siteName: 'EPWX Task Hub',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EPWX Whitepaper',
    description: 'Official EPWX utility whitepaper for partners, exchanges, and listing platforms.',
  },
};

export default function WhitepaperPage() {
  return <WhitepaperDocument />;
}
