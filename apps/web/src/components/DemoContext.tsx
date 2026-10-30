import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {assets,basket,TOKEN_PRICE,seed,type DemoState,type Operation} from '../data/demo';
const KEY='tbci-demo-v1';
type TradeKind='buy'|'sell'|'compile'|'unmake';
type ContextValue={state:DemoState;setProfile:(value:Partial<Pick<DemoState,'name'|'email'|'currency'|'notifications'>>)=>void;transact:(kind:TradeKind,q:number,payment?:string)=>string|null;fund:(symbol:string,amount:number,withdraw?:boolean)=>string|null;reset:()=>void;notify:(message:string)=>void;toast:string;dismiss:()=>void};
const Context=createContext<ContextValue|null>(null);
const round=(v:number)=>Math.max(0,Math.round(v*1e8)/1e8);
function initial():DemoState{try{const raw=localStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(parsed&&typeof parsed.name==='string'&&parsed.balances&&Array.isArray(parsed.operations)&&assets.every(a=>typeof parsed.balances[a.symbol]==='number'&&Number.isFinite(parsed.balances[a.symbol])&&parsed.balances[a.symbol]>=0))return {...seed,...parsed}}}catch{}return structuredClone(seed)}
export function DemoProvider({children}:{children:ReactNode}){
 const [state,setState]=useState<DemoState>(initial);const [toast,setToast]=useState('');
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}},[state]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),5500);return()=>clearTimeout(t)},[toast]);
 const save=(balances:Record<string,number>,type:Operation['type'],symbol:string,amount:number,value:number)=>setState(s=>({...s,balances,operations:[{id:crypto.randomUUID(),type,symbol,amount,value,date:new Date().toISOString(),status:'completed' as const},...s.operations].slice(0,500)}));
 const transact=(kind:TradeKind,q:number,payment='USDC')=>{
  if(!Number.isFinite(q)||q<=0||q>1e6)return 'Введите корректное количество от 0 до 1 000 000 TBCi.';
  const b={...state.balances};const total=q*TOKEN_PRICE;const coin=assets.find(a=>a.symbol===payment);
  if(kind==='buy'){
   if(!coin||coin.symbol==='TBCi')return 'Выберите валюту оплаты.';const debit=total*1.005/coin.price;
   if(b[payment]+1e-10<debit)return `Недостаточно ${payment} для покупки с учётом комиссии.`;b[payment]=round(b[payment]-debit);b.TBCi=round(b.TBCi+q);
  }else if(kind==='sell'){
   if(!coin||coin.symbol==='TBCi')return 'Выберите валюту получения.';if(b.TBCi+1e-10<q)return 'Недостаточно TBCi для продажи.';b.TBCi=round(b.TBCi-q);b[payment]=round(b[payment]+total*.995/coin.price);
  }else if(kind==='compile'){
   const short=basket.find(a=>b[a.symbol]+1e-10<total*a.weight/100/a.price*1.005);if(short)return `Недостаточно ${short.symbol}. Пополните недостающие компоненты корзины.`;
   basket.forEach(a=>b[a.symbol]=round(b[a.symbol]-total*a.weight/100/a.price*1.005));b.TBCi=round(b.TBCi+q);
  }else{
   if(b.TBCi+1e-10<q)return 'Недостаточно TBCi для разборки.';b.TBCi=round(b.TBCi-q);basket.forEach(a=>b[a.symbol]=round(b[a.symbol]+total*a.weight/100/a.price*.995));
  }
  save(b,kind,'TBCi',q,total);return null;
 };
 const fund=(symbol:string,amount:number,withdraw=false)=>{
  const coin=assets.find(a=>a.symbol===symbol);if(!coin||!Number.isFinite(amount)||amount<=0||amount*coin.price>1e9)return 'Введите корректную сумму.';
  if(withdraw&&state.balances[symbol]<amount)return 'Недостаточно средств на демо-балансе.';
  save({...state.balances,[symbol]:round(state.balances[symbol]+amount*(withdraw?-1:1))},withdraw?'withdraw':'deposit',symbol,amount,amount*coin.price);return null;
 };
 return <Context.Provider value={{state,transact,fund,setProfile:value=>{setState(s=>({...s,...value}));setToast('Настройки сохранены')},reset:()=>{setState(structuredClone(seed));setToast('Демо-данные восстановлены')},notify:setToast,toast,dismiss:()=>setToast('')}}>{children}</Context.Provider>
}
export function useDemo(){const value=useContext(Context);if(!value)throw new Error('DemoProvider is required');return value}
