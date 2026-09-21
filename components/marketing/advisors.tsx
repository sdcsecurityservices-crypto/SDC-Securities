import {ArrowUpRight, Compass, ShieldCheck} from 'lucide-react';

const advisors = [
  {
    name: 'Nagesh Kumar', initials: 'NK', service: 'KSPS · Retired Superintendent of Police', location: 'Bengaluru, Karnataka',
    role: 'Operational Standards & Training', icon: ShieldCheck,
    description: 'An advisory focus on the fundamentals of dependable security: disciplined teams, clear site procedures and supervisors prepared to take responsibility.',
    focus: ['Guard and supervisor development', 'Site procedures and deployment readiness', 'Incident reporting and escalation standards'],
  },
  {
    name: 'P. V. Sunil Kumar', initials: 'PV', service: 'IPS · Andhra Pradesh cadre', location: 'Andhra Pradesh',
    role: 'Security Strategy & Governance', icon: Compass,
    description: 'An advisory focus on the bigger picture: risk-led security planning, accountable decision-making and a structured approach to crisis preparedness.',
    focus: ['Security strategy and risk review', 'Governance and leadership mentoring', 'Crisis preparedness and response frameworks'],
  },
];

export default function Advisors() {
  return <section className="advisor-section" id="advisors" aria-labelledby="advisor-heading">
    <div className="advisor-intro"><div><span className="advisor-eyebrow">MENTORS & ADVISORS</span><h2 id="advisor-heading">Experience that guides.<br/><em>Standards that endure.</em></h2></div><p>Guidance for SDC’s leadership, with a focus on stronger operational discipline, thoughtful security strategy and teams prepared for responsibility.</p></div>
    <div className="advisor-grid">{advisors.map(({name,initials,service,location,role,icon:Icon,description,focus})=><article className="advisor-card" key={name}>
      <div className="advisor-person"><span className="advisor-monogram" aria-hidden="true">{initials}</span><div><h3>{name}</h3><p>{service}</p><span>{location}</span></div></div>
      <div className="advisor-remit"><span><Icon size={19}/>MENTOR & ADVISOR</span><h4>{role}</h4><p>{description}</p></div>
      <ul aria-label={`${name} advisory focus`}>{focus.map(item=><li key={item}><ArrowUpRight size={15} aria-hidden="true"/>{item}</li>)}</ul>
    </article>)}</div>
    <div className="advisor-context"><ShieldCheck size={19}/><p>Advisory guidance supports the leadership team. Day-to-day deployment, client service and operational accountability remain with SDC management.</p></div>
  </section>;
}
