export type Section = 'overview'|'wallets'|'indices'|'buy'|'compile'|'sell'|'unmake'|'history'|'holders'|'settings'|'help';
export type Asset = {symbol:string;name:string;price:number;weight:number;color:string;change:number;balance:number};
export const basket: Asset[] = [
 {symbol:'BTC',name:'Bitcoin',price:67350,weight:45,color:'#F5A63A',change:-2.14,balance:.4},
 {symbol:'ETH',name:'Ethereum',price:2450,weight:25,color:'#8D9DF2',change:-3.21,balance:4.2},
 {symbol:'XRP',name:'XRP',price:.52,weight:7,color:'#B8C8DA',change:-4.06,balance:1200},
 {symbol:'SOL',name:'Solana',price:142,weight:6,color:'#9B8DFA',change:-1.92,balance:18},
 {symbol:'ADA',name:'Cardano',price:.34,weight:4,color:'#56A1F2',change:-3.38,balance:2200},
 {symbol:'DOGE',name:'Dogecoin',price:.13,weight:2,color:'#D2B361',change:-2.8,balance:4000},
 {symbol:'AVAX',name:'Avalanche',price:25.2,weight:1.5,color:'#ED777F',change:-1.4,balance:12},
 {symbol:'LINK',name:'Chainlink',price:11.2,weight:1.5,color:'#688FFF',change:-2.6,balance:30},
 {symbol:'DOT',name:'Polkadot',price:4.1,weight:1.2,color:'#DD86BF',change:-3.4,balance:80},
 {symbol:'LTC',name:'Litecoin',price:68,weight:1,color:'#8CAAC8',change:-2.7,balance:15},
 {symbol:'BCH',name:'Bitcoin Cash',price:350,weight:1,color:'#80C7A5',change:-2.1,balance:.6},
 {symbol:'XLM',name:'Stellar',price:.09,weight:.8,color:'#B7C9DB',change:-1.8,balance:2500},
 {symbol:'XMR',name:'Monero',price:155,weight:.8,color:'#E7A171',change:-1.5,balance:1},
 {symbol:'ATOM',name:'Cosmos',price:4.4,weight:.7,color:'#A39BD1',change:-3.1,balance:40},
 {symbol:'NEAR',name:'NEAR',price:4.2,weight:.7,color:'#8DCDC8',change:-2.2,balance:50},
 {symbol:'AAVE',name:'Aave',price:145,weight:.6,color:'#A3AFEA',change:-1.2,balance:1},
 {symbol:'ETC',name:'Ethereum Classic',price:18.5,weight:.5,color:'#7FC1A5',change:-2.4,balance:8},
 {symbol:'XTZ',name:'Tezos',price:.65,weight:.3,color:'#84A6E8',change:-3.1,balance:200},
 {symbol:'ZEC',name:'Zcash',price:37,weight:.2,color:'#D0BA76',change:-1.9,balance:2},
 {symbol:'QTUM',name:'Qtum',price:2.4,weight:.2,color:'#85BCE1',change:-2.6,balance:30},
];
export const assets:Asset[]=[{symbol:'TBCi',name:'TBCi 20',price:120,weight:0,color:'#00CDEB',change:-3.72,balance:84.5},{symbol:'USDC',name:'USD Coin',price:1,weight:0,color:'#67A8EC',change:0,balance:6500},...basket];
export const TOKEN_PRICE=120;
export const nav=[
 {id:'overview',label:'Обзор',icon:'index'},
 {id:'wallets',label:'Мои кошельки',icon:'wallet'},
 {id:'indices',label:'Выбор индекса',icon:'basket'},
 {id:'buy',label:'Купить',icon:'buy'},
 {id:'compile',label:'Собрать',icon:'compile'},
 {id:'sell',label:'Продать',icon:'sell'},
 {id:'unmake',label:'Разобрать',icon:'unmake'},
 {id:'history',label:'История',icon:'history'},
 {id:'holders',label:'Держатели',icon:'holders'},
] as const;
export const sectionTitles:Record<Section,string>={overview:'Обзор портфеля',wallets:'Мои кошельки',indices:'Выбор индекса',buy:'Покупка TBCi',compile:'Сборка TBCi',sell:'Продажа TBCi',unmake:'Разборка TBCi',history:'История',holders:'Держатели TBCi',settings:'Настройки',help:'Помощь'};
export const sectionHref=(id:string)=>id==='overview'?'/app/':`/app/${id}/`;
export const money=(n:number,currency='USD')=>new Intl.NumberFormat('ru-RU',{style:'currency',currency,maximumFractionDigits:2}).format(n);
export const number=(n:number,digits=2)=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(n);
export const quantity=(n:number)=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:8}).format(n);
export type Operation={id:string;type:'buy'|'sell'|'compile'|'unmake'|'deposit'|'withdraw';symbol:string;amount:number;value:number;date:string;status:'completed'|'pending'};
export const typeLabels:Record<Operation['type'],string>={buy:'Покупка',sell:'Продажа',compile:'Сборка',unmake:'Разборка',deposit:'Пополнение',withdraw:'Вывод'};
export type DemoState={balances:Record<string,number>;operations:Operation[];name:string;email:string;currency:'USD'|'EUR';notifications:boolean};
export const seed:DemoState={balances:Object.fromEntries(assets.map(a=>[a.symbol,a.balance])),name:'Александр',email:'demo@example.com',currency:'USD',notifications:true,operations:[
 {id:'demo-1006',type:'buy',symbol:'TBCi',amount:10,value:1200,date:'2026-10-30T09:42:00Z',status:'completed'},
 {id:'demo-1005',type:'deposit',symbol:'USDC',amount:2000,value:2000,date:'2026-10-29T14:24:00Z',status:'completed'},
 {id:'demo-1004',type:'compile',symbol:'TBCi',amount:20,value:2400,date:'2026-10-28T11:16:00Z',status:'completed'},
 {id:'demo-1003',type:'sell',symbol:'TBCi',amount:5,value:600,date:'2026-10-26T16:03:00Z',status:'completed'},
 {id:'demo-1002',type:'deposit',symbol:'ETH',amount:1.5,value:3675,date:'2026-10-24T08:50:00Z',status:'completed'},
 {id:'demo-1001',type:'unmake',symbol:'TBCi',amount:2,value:240,date:'2026-10-22T10:21:00Z',status:'completed'},
]};
export const series=(last:number,period='1м')=>{
 const shape=[100,101.2,103.8,102.9,106.1,106.5,105.4,108.2,106.5,109.1,108.8,110.2,108.9,110.4,111.1,114.2,112.1,108.4,109.1,106.4,104.1,104.8,103.2,100.4,98.7,100.1,99.2,97.4,98.8,96.4,99.2,98.5,100.7,97.8,98.9,97.2,96.9,96.28];
 const strength=period==='24ч'?.34:period==='7д'?.65:period==='1г'?1.4:1;
 return shape.map(v=>last*(1+(v/96.28-1)*strength));
};
export const dateLabel=(iso:string)=>new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
