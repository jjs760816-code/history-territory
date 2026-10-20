'use client';
import {useMemo,useState} from 'react';
import geographic from './korea.json';
export const nationNames=['고구려','백제','신라','가야'];
export const nationColors=['#429b79','#e17b72','#d5a438','#8e86c9'];
const project=([lon,lat]:number[])=>[180+(lon-124)*70,30+(43.3-lat)*63];
const regions=(geographic as number[][][]).map(p=>p.map(project));
regions.push(Array.from({length:24},(_,i)=>{const a=i*Math.PI/12;return project([126.53+Math.cos(a)*.48,33.37+Math.sin(a)*.16])}));
const landPath=regions.map(p=>'M'+p.map(x=>x.join(',')).join('L')+'Z').join('');
function inside(p:number[],poly:number[][]){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
const halton=(n:number,b:number)=>{let f=1,r=0;while(n>0){f/=b;r+=f*(n%b);n=Math.floor(n/b)}return r};
function clip(poly:number[][],nx:number,ny:number,c:number){const out:number[][]=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=a[0]*nx+a[1]*ny-c,db=b[0]*nx+b[1]*ny-c,ai=da<=.001,bi=db<=.001;if(ai)out.push(a);if(ai!==bi){const t=da/(da-db);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])])}}return out}
export function makeCells(count:number){const pts:number[][]=[];for(let i=1;pts.length<count&&i<100000;i++){const p=[160+halton(i,2)*560,20+halton(i,3)*670];if(regions.some(poly=>inside(p,poly)))pts.push(p)}return pts.map((p,i)=>{let poly=[[100,0],[800,0],[800,740],[100,740]];for(let j=0;j<pts.length&&poly.length;j++){if(i===j)continue;const q=pts[j];poly=clip(poly,q[0]-p[0],q[1]-p[1],(q[0]*q[0]+q[1]*q[1]-p[0]*p[0]-p[1]*p[1])/2)}return {point:p,polygon:poly}})}
export default function KoreaMap({territories=[],selected,onSelect,skin=0,preview=false}:any){
 const [zoom,setZoom]=useState(1);const list=preview?Array.from({length:44},(_,i)=>({id:String(i),owner:null,subject:'역사 영토'})):territories;
 const cells=useMemo(()=>makeCells(list.length),[list.length]);
 return <div className={'map-frame skin-'+skin}>
  <div className="map-top"><span>한반도 영토 지도</span><small>{preview?'한 칸에 한 문제':`${list.length}개의 문제 · ${list.filter((t:any)=>t.owner===null).length}개의 중립 영토`}</small></div>
  <div className="map-scroll"><svg aria-label="문제를 선택하는 한반도 영토 지도" viewBox="100 0 700 740" style={{width:`${zoom*100}%`}}>
   <defs><clipPath id={preview?'preview-land':'game-land'}><path d={landPath}/></clipPath><pattern id="sea-grid" width="35" height="35" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#a7bdc2" opacity=".35"/></pattern></defs>
   <rect x="100" width="700" height="740" fill="url(#sea-grid)"/><text x="165" y="420" className="sea-label">황해</text><text x="635" y="420" className="sea-label">동해</text>
   <path d={landPath} fill="#dee7e1" stroke="#899f96" strokeWidth="2"/>
   <g clipPath={`url(#${preview?'preview-land':'game-land'})`}>
   {cells.map((c,i)=>{const t=list[i],chosen=selected===t.id;return <g key={t.id} role={preview?undefined:'button'} tabIndex={preview?undefined:0} aria-label={preview?undefined:`${i+1}번 영토 ${t.subject}, ${t.owner===null?'중립':nationNames[t.owner]}`} onClick={()=>!preview&&onSelect?.(t.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect?.(t.id)}}} className={chosen?'territory selected':'territory'}>
    <title>{`${i+1}. ${t.subject} · ${t.owner===null?'중립':nationNames[t.owner]}`}</title><polygon points={c.polygon.map(x=>x.join(',')).join(' ')} fill={t.owner===null?'#eef1e9':nationColors[t.owner]} stroke={chosen?'#183a46':'#b5c5bb'} strokeWidth={chosen?3:1.1}/>{zoom>1.4&&<text x={c.point[0]} y={c.point[1]+3} textAnchor="middle" fontSize="8" fill="#223e46" pointerEvents="none">{i+1}</text>}
   </g>})}</g>
   <text x="245" y="700" className="island-label">제주도</text><g transform="translate(704 535)"><path d="M0 35V0M-4 7L0 0L4 7" fill="none" stroke="#23444c"/><text x="-4" y="-8" fontSize="12">N</text></g>
   <text x="450" y="730" textAnchor="middle" className="map-caption">영토 칸은 학습용이며 실제 국경·행정구역과 다릅니다.</text>
  </svg></div>
  {!preview&&<div className="map-controls"><span>땅을 누르고 문제에 도전해요</span><button aria-label="지도 축소" onClick={()=>setZoom(Math.max(1,zoom-.4))}>−</button><b>{Math.round(zoom*100)}%</b><button aria-label="지도 확대" onClick={()=>setZoom(Math.min(3,zoom+.4))}>＋</button></div>}
 </div>
}
