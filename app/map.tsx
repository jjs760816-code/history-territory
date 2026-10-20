'use client';
import {useMemo,useState} from 'react';
import {makeCells,landPath,isHanPoint,capitals,project,islands} from '../lib/game-geography';
export {makeCells} from '../lib/game-geography';
export const nationNames=['고구려','백제','신라','가야'];
export const nationColors=['#248754','#d84943','#e1a61b','#7250be'];
export default function KoreaMap({territories=[],selected,onSelect,skin=0,preview=false}:any){
 const [zoom,setZoom]=useState(1);const list=preview?[...Array.from({length:98},(_,i)=>({id:String(i),owner:null,subject:'역사 영토'})),...islands.map(island=>({id:island.id,owner:null,subject:island.name}))]:territories;
 const cells=useMemo(()=>makeCells(list.length),[list.length]);
 return <div className={'map-frame skin-'+skin}>
  <div className="map-top"><span>한반도 · 고구려 북방 영토 지도</span><small>{preview?'한 칸에 한 문제':`${list.length}칸 · 미개척지 ${list.filter((t:any)=>t.wilderness).length}칸`}</small></div>
  <div className="map-scroll"><svg aria-label="문제를 선택하는 한반도와 고구려 북방 영토 지도" viewBox="100 0 700 740" style={{width:`${zoom*100}%`}}>
   <defs><clipPath id={preview?'preview-land':'game-land'}><path d={landPath}/></clipPath><pattern id="sea-grid" width="35" height="35" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#a7bdc2" opacity=".35"/></pattern></defs>
   <rect x="100" width="700" height="740" fill="url(#sea-grid)"/><text x="165" y="420" className="sea-label">황해</text><text x="680" y="420" className="sea-label">동해</text>
   <path d={landPath} fill="#dee7e1" stroke="#899f96" strokeWidth="2"/>
   <g clipPath={`url(#${preview?'preview-land':'game-land'})`}>
   {cells.map((c,i)=>{const t=list[i],chosen=selected===t.id,han=isHanPoint(c.point);return <g key={t.id} role={preview?undefined:'button'} tabIndex={preview?undefined:0} aria-label={preview?undefined:`${i+1}번 영토 ${t.subject}, ${t.owner===null?'중립':nationNames[t.owner]}${han?' · 한강 유역 2점':' · 일반 영토 1점'}`} onClick={()=>!preview&&onSelect?.(t.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect?.(t.id)}}} className={chosen?'territory selected':'territory'}>
    <title>{`${i+1}. ${t.subject} · ${t.owner===null?'중립':nationNames[t.owner]}${han?' · 한강 유역 2점':' · 일반 영토 1점'}`}</title><polygon points={c.polygon.map(x=>x.join(',')).join(' ')} fill={t.owner===null?(han?'#b4e5fa':t.wilderness?'#d2d7d0':'#f5f7ee'):nationColors[t.owner]} stroke={chosen?'#183a46':han?'#087fab':'#b5c5bb'} strokeWidth={chosen?3:han?2:1.1} strokeDasharray={t.wilderness?"3 2":undefined}/>{t.wilderness&&!han&&<text x={c.point[0]} y={c.point[1]+2} textAnchor="middle" fontSize="7" fill="#59675b" pointerEvents="none">?</text>}{han&&<g pointerEvents="none"><circle cx={c.point[0]} cy={c.point[1]} r={preview?9:6} fill="#087fab"/><text x={c.point[0]} y={c.point[1]+(preview?3:2)} textAnchor="middle" fontSize={preview?9:6} fontWeight="bold" fill="white">×2</text></g>}{zoom>1.4&&!han&&<text x={c.point[0]} y={c.point[1]+3} textAnchor="middle" fontSize="8" fill="#223e46" pointerEvents="none">{i+1}</text>}
   </g>})}</g>
   {islands.map(island=>{const p=project(island.location),t=list.find((t:any)=>t.id===island.id);return <g key={island.id}><text x={p[0]} y={p[1]-17} fontSize="12" textAnchor="middle" fontWeight="bold" fill="#193b46" stroke="white" strokeWidth="3" paintOrder="stroke" pointerEvents="none">{island.name}</text><circle cx={p[0]} cy={p[1]} r={island.radius+3} fill="none" stroke="#577c86" strokeDasharray="2 2" pointerEvents="none"/></g>})}
   <text x="320" y="88" textAnchor="middle" fontSize="17" fill="#61786a" pointerEvents="none">고구려 북방 학습 영역</text>
   {capitals.map(c=>{const p=project(c.location);return <g key={c.team} pointerEvents="none"><circle cx={p[0]} cy={p[1]} r="7" fill={nationColors[c.team]} stroke="white" strokeWidth="2"/><text x={p[0]+(c.team===3?-10:10)} y={p[1]+(c.team===3?16:-9)} textAnchor={c.team===3?"end":"start"} fontSize="12" fontWeight="bold" fill="#193b46" stroke="white" strokeWidth="3" paintOrder="stroke">{nationNames[c.team]} · {c.name}</text></g>})}
   <text x="390" y="700" className="island-label">제주도</text><g transform="translate(704 535)"><path d="M0 35V0M-4 7L0 0L4 7" fill="none" stroke="#23444c"/><text x="-4" y="-8" fontSize="12">N</text></g>
   <text x="450" y="730" textAnchor="middle" className="map-caption">북방 영역·국경·한강 유역은 학습용 근사 표시입니다.</text>
  </svg></div>
  <div className="han-legend"><span className="han-swatch"/><b>한강 유역 ×2</b><span>일반 1점 · 한강 유역 2점 · ? 미개척지</span><small>유역은 영토 중심점 기준의 학습용 근사 범위이며, 울릉도·독도는 선택하기 쉽도록 확대 표시했습니다.</small></div>
  {!preview&&<div className="map-controls"><span>땅을 누르고 문제에 도전해요</span><button aria-label="지도 축소" onClick={()=>setZoom(Math.max(1,zoom-.4))}>−</button><b>{Math.round(zoom*100)}%</b><button aria-label="지도 확대" onClick={()=>setZoom(Math.min(3,zoom+.4))}>＋</button></div>}
 </div>
}
