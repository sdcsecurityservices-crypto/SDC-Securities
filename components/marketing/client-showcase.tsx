'use client';

import {useState} from 'react';
import {ArrowDown, ArrowUp, Pause, Play} from 'lucide-react';

const clients = [
  {name:'Namma Metro',file:'namma-metro.svg'},
  {name:'Milky Mist',file:'milky-mist.png'},
  {name:'R. L. Jalappa Hospital',file:'rl-jalappa.svg'},
  {name:'Geltec',file:'geltec.png'},
  {name:'VBHC',file:'vbhc.svg'},
  {name:'Vedaanta Senior Living',file:'vedaanta.svg'},
  {name:'KPTCL',file:'kptcl.png'},
  {name:'Sri Devaraj Urs Medical College',file:'sdumc.webp'},
  {name:'Asal Foods',file:'asal.png'},
  {name:'Indya Estates',file:'indya-estates.png'},
  {name:'Saify Ind',file:'saify.png'},
  {name:'Universal Textile Mills',file:'utm.webp'},
  {name:'RK Gardenia',file:'rk-gardenia.png'},
  {name:'Subha Builders & Developers',file:'subha.png'},
  {name:'Power Hills Construction',file:'power-hills.png'},
  {name:'Ramalingam Construction',file:'ramalingam.png'},
  {name:'Shrishaila Electricals',file:'shrishaila.png'},
  {name:'Satellite Club',file:null},
];

function ClientMark({client}:{client:typeof clients[number]}) {
  return <div className="client-mark">
    <div className="client-mark-image">{client.file?<img src={'/clients/'+client.file} alt="" width={160} height={76} loading="lazy" decoding="async"/>:<span className="client-name-only">Satellite Club</span>}</div>
    <span>{client.name}</span>
  </div>;
}

export default function ClientShowcase() {
  const [paused,setPaused]=useState(false),[expanded,setExpanded]=useState(false);
  return <section className={`client-showcase${paused?' is-paused':''}${expanded?' is-expanded':''}`} aria-labelledby="client-showcase-title" id="clientele">
    <div className="client-showcase-heading"><div><span className="client-showcase-eyebrow">OUR CLIENTELE</span><h2 id="client-showcase-title">Trusted where it matters.</h2><p>Across infrastructure, healthcare, industry and the places people call home.</p></div><div className="client-showcase-actions"><button className="client-motion-toggle" aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused?<Play size={16}/>:<Pause size={16}/>}<span>{paused?'Resume':'Pause'} scrolling</span></button><button aria-expanded={expanded} aria-controls="client-logo-wall" onClick={()=>setExpanded(v=>!v)}>{expanded?'Back to scrolling':'View all clients'}{expanded?<ArrowUp size={16}/>:<ArrowDown size={16}/>}</button></div></div>
    <div className="client-logo-wall" id="client-logo-wall">{[clients.slice(0,9),clients.slice(9)].map((row,i)=><div className={`client-marquee client-marquee-${i}`} key={i}><div className="client-marquee-track"><ul className="client-logo-group" aria-label={i===0?'Client organisations':'More client organisations'}>{row.map(client=><li key={client.name}><ClientMark client={client}/></li>)}</ul><ul className="client-logo-group client-logo-duplicate" aria-hidden="true">{row.map(client=><li key={client.name}><ClientMark client={client}/></li>)}</ul></div></div>)}</div>
    <div className="client-showcase-footnote"><span>Experience across sectors. Relationships built on service.</span><p>Organisations listed in SDC’s company profile and pitch deck. Logos belong to their respective owners.</p></div>
  </section>;
}
