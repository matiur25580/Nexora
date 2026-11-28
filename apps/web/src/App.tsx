import OrganizationWorkspace from './modules/OrganizationWorkspace';
import {
  Activity, ArrowUpRight, Bell, Building2, ChartNoAxesCombined, CircleHelp,
  Command, CreditCard, LayoutDashboard, LifeBuoy, LogOut, Search, Settings2, ShieldCheck,
  Users, Zap
} from 'lucide-react';

const metrics = [
  { label: 'Active customers', icon: Users, note: 'Customer data connection planned' },
  { label: 'Customer health', icon: Activity, note: 'Health scoring planned' },
  { label: 'Renewal pipeline', icon: CreditCard, note: 'Renewal workspace planned' },
  { label: 'Retention revenue', icon: ChartNoAxesCombined, note: 'Revenue intelligence planned' }
];
const nav = [
  ['Overview', LayoutDashboard], ['Customers', Building2], ['Success workspace', Users],
  ['Product adoption', Activity], ['Renewals & revenue', CreditCard], ['Automation', Zap]
] as const;

export default function App({ user, accessToken, onAccessTokenChange, onLogout }: { user: { id: string; displayName: string; email: string }; accessToken: string; onAccessTokenChange: (token: string) => void; onLogout: () => Promise<void> }) {
  return <div className="shell">
    <aside className="sidebar">
      <a className="brand" href="/"><span className="brand-mark"><Command size={19}/></span>Nexora<span className="brand-dot">.</span></a>
      <div className="workspace"><span className="workspace-icon">N</span><span><b>Workspace</b><small>Organization workspace</small></span><Settings2 size={16}/></div>
      <p className="nav-label">WORKSPACE</p>
      <nav>{nav.map(([label, Icon], index) => <a key={label} className={index === 0 ? 'nav-item selected' : 'nav-item'} href="#"><Icon size={17}/>{label}</a>)}</nav>
      <p className="nav-label">ADMINISTRATION</p>
      <a className="nav-item" href="#organization-workspace"><ShieldCheck size={17}/>Organization & access</a>
      <a className="nav-item" href="#"><Settings2 size={17}/>Settings</a>
      <div className="sidebar-bottom"><div className="help"><CircleHelp size={18}/><span><b>Need a hand?</b><small>Explore the platform guide</small></span></div><div className="profile"><span className="avatar">{user.displayName.split(/\\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span><b>{user.displayName}</b><small>{user.email}</small></span></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> <b>Overview</b></div><div className="top-actions"><button aria-label="Search"><Search size={18}/></button><button aria-label="Notifications" className="bell"><Bell size={18}/></button><span className="current-user">{user.displayName}</span><button className="signout" onClick={() => void onLogout()} aria-label="Sign out"><LogOut size={16}/><span>Sign out</span></button></div></header>
      <section className="content">
        <div className="welcome"><div><p className="eyebrow">CUSTOMER INTELLIGENCE</p><h1>Good morning, welcome to Nexora.</h1><p className="muted">Your customer relationships, connected to the outcomes that matter.</p></div><span className="preview-tag"><Activity size={15}/> Foundation preview</span></div>
        <div className="banner"><span className="banner-icon"><ShieldCheck size={21}/></span><div><b>Your workspace foundation is taking shape</b><p>Manage organization workspaces, member access and role-based permissions.</p></div><span className="status"><i/> Initial setup</span></div>
        <OrganizationWorkspace userId={user.id} accessToken={accessToken} onAccessTokenChange={onAccessTokenChange} />
        <div className="section-head"><div><h2>Business snapshot</h2><p>Key customer and revenue indicators will appear here.</p></div><span className="coming">Coming soon</span></div>
        <div className="metrics">{metrics.map(({label, icon: Icon, note}) => <article className="metric" key={label}><div className="metric-head"><span>{label}</span><i><Icon size={17}/></i></div><strong>—</strong><small><ArrowUpRight size={13}/>{note}</small></article>)}</div>
        <div className="panels">
          <section className="panel"><div className="panel-head"><div><h2>Customer lifecycle</h2><p>A connected view from onboarding to expansion.</p></div><span className="planned">Planned</span></div><div className="lifecycle">{['Acquire','Onboard','Adopt','Retain','Expand'].map((x,i)=><div className="stage" key={x}><span>{String(i+1).padStart(2,'0')}</span><b>{x}</b>{i!==4&&<i/>}</div>)}</div><div className="empty"><span className="empty-icon"><Users size={20}/></span><b>Your customer journey starts here</b><small>Customer lifecycle tools are coming in upcoming milestones.</small></div></section>
          <section className="panel"><div className="panel-head"><div><h2>Platform activity</h2><p>Recent workspace events.</p></div><span className="live"><i/> LIVE LAYER READY</span></div><div className="empty activity-empty"><span className="empty-icon purple"><Zap size={20}/></span><b>No activity to show yet</b><small>Events will appear as your workspace is configured.</small></div><div className="panel-foot"><LifeBuoy size={15}/> Your operational timeline will live here.</div></section>
        </div>
        <footer>© 2026 Nexora <span>Built for lasting customer relationships ✦</span></footer>
      </section>
    </main>
  </div>;
}
