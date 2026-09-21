'use client';

import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowRight, ArrowUpRight, Check, Pause, Play, Radar, ShieldCheck} from 'lucide-react';

const slides = [
  {label:'Security that sees more', eyebrow:'VETERAN LED. TECHNOLOGY ENABLED.', title:'Human vigilance.', accent:'Machine intelligence.', text:'Exceptional people. Connected systems. Complete peace of mind. Security and facility solutions built around what matters to you.', cta:'Let’s secure your world', href:'#technology', link:'Discover our technology', card:'One connected operation', first:'People', firstNote:'In the right place', second:'Clarity', secondNote:'At every level'},
  {label:'People you can count on', eyebrow:'DISCIPLINE IN EVERY DEPLOYMENT.', title:'The right people.', accent:'Where it matters.', text:'From your front gate to your busiest shift, build confidence with professional guarding, dependable facility teams and accountable supervision.', cta:'Find your security solution', href:'#solutions', link:'Explore our services', card:'Built around your site', first:'Security', firstNote:'Vigilance on the ground', second:'Service', secondNote:'Care in every detail'},
  {label:'Connected operations', eyebrow:'MEET SDC COMMAND.', title:'Every person.', accent:'A clearer picture.', text:'Bring employee records, postings, attendance and payroll into one connected workspace. Give your teams the clarity to make every day run better.', cta:'Talk to us about Command', href:'/command', link:'Explore the Command demo', card:'Explore SDC Command', first:'Teams', firstNote:'Connected through one hub', second:'Records', secondNote:'Ready when you need them'},
];

export default function HeroCarousel({onContact}:{onContact:()=>void}) {
  const [active,setActive]=useState(0);
  const [paused,setPaused]=useState(false);
  const [hovered,setHovered]=useState(false);
  const [reduced,setReduced]=useState(true);
  const [visible,setVisible]=useState(true);
  const touch=useRef<{x:number;y:number}|null>(null);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync=()=>setReduced(media.matches);
    const visibility=()=>setVisible(!document.hidden);
    sync();visibility();media.addEventListener('change',sync);document.addEventListener('visibilitychange',visibility);
    return()=>{media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',visibility)};
  },[]);
  const rotating=!paused&&!hovered&&!reduced&&visible;
  useEffect(()=>{if(!rotating)return;const timer=window.setTimeout(()=>setActive(i=>(i+1)%slides.length),7500);return()=>window.clearTimeout(timer)},[active,rotating]);
  function select(index:number){setPaused(true);setActive((index+slides.length)%slides.length)}
  const slide=slides[active];
  return <section className={`hero hero-carousel hero-slide-${active}`} aria-roledescription="carousel" aria-label="SDC services and technology" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={e=>{if(!(e.target as HTMLElement).closest("[data-rotation-control]"))setPaused(true)}} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();select(active+(e.key==='ArrowRight'?1:-1))}}} onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}} onTouchEnd={e=>{const start=touch.current;touch.current=null;if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)select(active+(dx<0?1:-1))}}>
    <div className="hero-shade"/>
    <div className="hero-slide-copy" aria-live={rotating?'off':'polite'} aria-atomic="true">
      <div key={active} className="hero-content" role="group" aria-roledescription="slide" aria-label={`${active+1} of ${slides.length}: ${slide.label}`}>
        <div className="eyebrow"><span/>{slide.eyebrow}</div>
        <h1>{slide.title}<br/><em>{slide.accent}</em></h1>
        <p>{slide.text}</p>
        <div className="hero-actions"><button className="button brand-gold" onClick={onContact}>{slide.cta}<ArrowUpRight size={18}/></button><a className="text-link" href={slide.href}>{slide.link}<ArrowRight size={18}/></a></div>
        <div className="hero-proof"><ShieldCheck size={17}/>Ex-servicemen led<span/>PSARA licensed<span/>Bengaluru, Karnataka</div>
      </div>
    </div>
    <div className="hero-monitor"><div className="monitor-title"><Radar size={19}/>SDC COMMAND<span>DEMO PREVIEW</span></div><div className="monitor-row"><span>{slide.card}</span><Check size={16}/></div><div className="monitor-numbers"><div><strong>{slide.first}</strong><span>{slide.firstNote}</span></div><div><strong>{slide.second}</strong><span>{slide.secondNote}</span></div></div><a href="/command">Step inside the command centre<ArrowUpRight size={17}/></a></div>
    <div className="hero-carousel-controls">
      <div className="hero-slide-picker" role="group" aria-label="Choose a slide">{slides.map((s,i)=><button key={s.label} aria-label={`Show slide ${i+1}: ${s.label}`} aria-current={i===active?'true':undefined} onClick={()=>select(i)}><span className="hero-slide-track"><span/></span><span className="hero-slide-label"><b>0{i+1}</b>{s.label}</span></button>)}</div>
      <div className="hero-carousel-buttons"><span className="hero-slide-count" aria-hidden="true">0{active+1} / 03</span><button aria-label="Previous slide" onClick={()=>select(active-1)}><ArrowLeft size={19}/></button><button aria-label="Next slide" onClick={()=>select(active+1)}><ArrowRight size={19}/></button><button data-rotation-control aria-label={paused||reduced?'Play slideshow':'Pause slideshow'} onClick={()=>{if(reduced)setReduced(false);setPaused(!(paused||reduced))}}>{paused||reduced?<Play size={17}/>:<Pause size={17}/>}</button></div>
    </div>
  </section>;
}
