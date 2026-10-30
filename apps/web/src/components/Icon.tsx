import type {CSSProperties} from 'react';
export function Icon({name,size=20}:{name:string;size?:number}){return <span className="icon" style={{width:size,height:size,maskImage:`url(/icons/${name}.svg)`,WebkitMaskImage:`url(/icons/${name}.svg)`} as CSSProperties} aria-hidden="true"/>}
