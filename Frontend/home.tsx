

import { money } from './businessData';
import { monthly } from './analytics';
import type { Transaction } from './DatabaseRows';
type HomeProps = { onOpenDashboard: () => void; transactions: Transaction[] };

export default function Home({ onOpenDashboard, transactions }: HomeProps) {
  return <><div className="heading"><div><p className="eyebrow">LET’S MAKE THINGS FLOW</p><h1>A good day starts with clarity.</h1><p className="muted">Welcome to your business command center. Make space for what matters.</p></div></div><section className="hero"><div><span className="hero-tag">Less busywork. More business.</span><h2>Your next chapter,<br/><em>all in one place.</em></h2><p>Keep an eye on performance, understand your numbers, and move forward with confidence.</p><button className="button light" onClick={onOpenDashboard}>Open dashboard ↗</button><small>Built for the way small businesses work.</small></div><div className="hero-art" aria-hidden="true"><div className="mini-card"><p className="eyebrow">BUSINESS AT A GLANCE</p><strong>{money(monthly(transactions)[0].billed)} <span>↗</span></strong><p>This month · Total billed</p></div><span className="floating">✓ Everything in perspective</span></div></section><h2 className="section-title">A little structure. A lot of possibility.</h2><section className="features">{[{icon:'↗',title:'See the bigger picture',text:'Revenue, customers, and orders together in one clear overview.'},{icon:'◷',title:'Find your focus',text:'See recent activity and the things that need your attention.'},{icon:'✧',title:'Grow with confidence',text:'Turn everyday numbers into a better understanding of your business.'}].map(feature => <article className="panel feature" key={feature.title}><span className="feature-icon">{feature.icon}</span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</section><section className="getting-started"><div><p className="eyebrow">YOUR FIRST STEP</p><h2>Get to know your numbers.</h2><p className="muted">Explore your saved invoices and current business totals.</p></div><button className="button dark" onClick={onOpenDashboard}>Take a look →</button></section></>;
  
}
