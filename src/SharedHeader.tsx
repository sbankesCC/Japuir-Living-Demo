import { Link, useLocation } from 'react-router-dom';
import { useDemo } from './DemoContext';

const pages = [{ path: '/executive-overview', label: 'Executive Overview' }, { path: '/vendor-portal', label: 'Vendor Update Portal' }, { path: '/control-tower', label: 'Supply Chain Control Tower' }, { path: '/ibp-workbench', label: 'IBP Workbench' }];
export function SharedHeader({ title }: { title: string }) {
  const { pathname } = useLocation(); const { signedInVendor, signOut } = useDemo();
  return <header className="app-header shared-header"><div className="shared-title"><h1>{title}</h1><span>Built for Jaipur Living</span></div><div className="shared-actions"><nav aria-label="Application pages">{pages.map(page => <Link key={page.path} to={page.path} className={pathname === page.path ? 'active' : ''}>{page.label}</Link>)}</nav><b className="mock">Mock Data</b>{pathname === '/vendor-portal' && signedInVendor && <button className="signout" onClick={signOut}>Sign Out</button>}</div></header>;
}
export function ResetDemo() { const { resetDemo } = useDemo(); return <div className="shared-reset"><button onClick={resetDemo}>Reset Demo</button></div>; }
