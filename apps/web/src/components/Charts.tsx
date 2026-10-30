import {useId,useState} from 'react';
import {number,series} from '../data/demo';
export function Chart({value=96.28,kind='index',compact=false}:{value?:number;kind?:'index'|'portfolio';compact?:boolean}){
 const [period,setPeriod]=useState('1м');const [hover,setHover]=useState<number|null>(null);const id=useId().replaceAll(':','');
 const data=series(value,period);const low=Math.min(...data)*.97,high=Math.max(...data)*1.035;const W=700,H=220;
 const pts=data.map((v,i)=>[i*W/(data.length-1),H-(v-low)/(high-low)*H]);const path=pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');const at=hover??data.length-1;
 return <div className={`chart ${compact?'chart--compact':''}`}>
  {!compact&&<div className="chart-top"><div><span className="eyebrow">{kind==='index'?'TBCi 20 · пункты':'Стоимость портфеля · USD'}</span><div className="chart-reading">{number(data[at])}<span>{hover===null?'Текущее значение':'Выбранная точка'}</span></div></div><div className="periods" aria-label="Период графика">{['24ч','7д','1м','1г'].map(p=><button key={p} aria-pressed={period===p} onClick={()=>{setPeriod(p);setHover(null)}}>{p}</button>)}</div></div>}
  <div className="chart-plot" tabIndex={0} role="group" aria-label="График. Используйте стрелки для просмотра значений" onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setHover(n=>Math.max(0,Math.min(data.length-1,(n??data.length-1)+(e.key==='ArrowLeft'?-1:1))))}}} onMouseLeave={()=>setHover(null)}>
   <div className="chart-scale">{[high,(high+low)/2,low].map((n,i)=><span key={i}>{new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0,notation:kind==='portfolio'?'compact':'standard'}).format(n)}</span>)}</div>
   <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Демонстрационный график, значение ${number(data[at])}`} onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();setHover(Math.round(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*(data.length-1)))}}>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#00CDEB" stopOpacity=".24"/><stop offset="1" stopColor="#00CDEB" stopOpacity=".015"/></linearGradient></defs>
    {[0,.25,.5,.75,1].map(n=><line key={`h${n}`} x1="0" x2={W} y1={n*H} y2={n*H} stroke="var(--chart-grid)" strokeWidth="1"/>)}
    {[0,.2,.4,.6,.8,1].map(n=><line key={`v${n}`} x1={n*W} x2={n*W} y1="0" y2={H} stroke="var(--chart-grid)" strokeWidth="1"/>)}
    <path d={`${path} L${W},${H} L0,${H} Z`} fill={`url(#${id})`}/><path d={path} fill="none" stroke="#00CDEB" strokeWidth={compact?2:2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round"/>
    {hover!==null&&<line x1={pts[at][0]} x2={pts[at][0]} y1="0" y2={H} stroke="#A8BBD2" strokeDasharray="4 4"/>}<circle cx={pts[at][0]} cy={pts[at][1]} r="3.7" fill="#00CDEB" stroke="#F2F7FB" strokeWidth="1.6" vectorEffect="non-scaling-stroke"/>
   </svg>
  </div>
  <div className="chart-dates"><span>{period==='24ч'?'00:00':'1 окт'}</span><span>{period==='24ч'?'06:00':'8 окт'}</span><span>{period==='24ч'?'12:00':'15 окт'}</span><span>{period==='24ч'?'18:00':'22 окт'}</span><span>{period==='24ч'?'23:59':'30 окт'}</span></div>
 </div>
}
export function Sparkline({positive=false}:{positive?:boolean}){return <svg className="sparkline" viewBox="0 0 130 38" aria-hidden="true"><path d="M1 26 10 21 18 24 26 12 33 17 42 9 50 15 59 12 67 22 74 19 83 27 92 21 102 28 112 24 121 29 130 26" fill="none" stroke={positive?'#63D9AA':'#00CDEB'} strokeWidth="1.8"/></svg>}
export function Donut({parts,center='100%',label='20 активов'}:{parts:{value:number;color:string}[];center?:string;label?:string}){
 const total=parts.reduce((s,p)=>s+p.value,0)||1;let cursor=0;const gradient=parts.map(p=>{const start=cursor;cursor+=p.value/total*100;return `${p.color} ${start}% ${cursor}%`}).join(',');
 return <div className="donut" style={{background:`conic-gradient(${gradient})`}} role="img" aria-label={`${label}: ${center}`}><div className="donut-hole"><strong>{center}</strong><span>{label}</span></div></div>
}
