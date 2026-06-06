'use client';

import './layout.css';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/portal',           icon: '▤', label: 'Dashboard'        },
  { href: '/analyze',          icon: '↥', label: 'Analyze Contract'  },
  { href: '/history',          icon: '⊞', label: 'Contract History', badge: true },
  { href: '/knowledge',        icon: '◫', label: 'Knowledge Base'    },
];

const ACCOUNT_NAV = [
  { href: '/portal/settings',  icon: '⚙', label: 'Account Settings' },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed]       = useState(false);
  const [userEmail, setUserEmail]       = useState<string | null>(null);
  const [contractCount, setContractCount] = useState(0);
  const [ready, setReady]               = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/auth'); return; }
      setUserEmail(session.user.email ?? null);

      const { count } = await supabase
        .from('saved_contracts')
        .select('*', { count: 'exact', head: true });
      if (count) setContractCount(count);
      setReady(true);
    });
  }, [router]);

  if (!ready) return <div className="pl-loading">Loading…</div>;

  const displayName = userEmail ? userEmail.split('@')[0] : '';

  return (
    <div className={`pl-frame${collapsed ? ' collapsed' : ''}`}>

      {/* Sidebar */}
      <aside className="pl-sidebar">
        <div className="pl-brand">
          <Link href="/" className="pl-badge">§</Link>
          <Link href="/" className="pl-name">ClausePal</Link>
        </div>

        {NAV.map(({ href, icon, label, badge }) => (
          <Link
            key={href}
            href={href}
            className={`pl-nav-item${pathname === href ? ' active' : ''}`}
          >
            <span className="pl-ni-ic">{icon}</span>
            <span className="pl-ni-label">{label}</span>
            {badge && contractCount > 0 && (
              <span className="pl-ni-badge">{contractCount}</span>
            )}
          </Link>
        ))}

        <div className="pl-section">Account</div>

        {ACCOUNT_NAV.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`pl-nav-item${pathname === href ? ' active' : ''}`}
          >
            <span className="pl-ni-ic">{icon}</span>
            <span className="pl-ni-label">{label}</span>
          </Link>
        ))}

        <div className="pl-foot">
          <div className="pl-avatar">{userEmail ? userEmail[0].toUpperCase() : '?'}</div>
          <div className="pl-foot-text">
            <div className="pl-foot-name">{displayName}</div>
            <div className="pl-foot-email">{userEmail}</div>
          </div>
        </div>

        <button className="pl-toggle" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? '›' : '‹'}
        </button>
      </aside>

      {/* Content */}
      <div className="pl-content-area">
        {children}
      </div>

    </div>
  );
}
