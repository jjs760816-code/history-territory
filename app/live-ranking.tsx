'use client';
import {useState} from 'react';
import {Flag,Users,ChevronRight} from 'lucide-react';
import {nationNames,nationColors} from './map';

type Land={id:string;owner:number|null;subject:string;hanRiver?:boolean;wilderness?:boolean};
type Props={game:any;lastSync:number|null;connection:string;onSelect:(id:string)=>void};
export default function LiveRanking({game,lastSync,connection,onSelect}:Props){
 const [view,setView]=useState<'nations'|'people'>('nations');
 const lands:Land[]=game.territories;const people:any[]=game.contributions||[];const mine=people.find(p=>p.isMe);
 const standings=nationNames.map((name,team)=>{
  const owned=lands.filter(t=>t.owner===team),server=game.scores?.find((s:any)=>s.team===team);
  const count=owned.length,bonus=owned.filter(t=>t.hanRiver).length;
  return {name,team,owned,count,bonus:server?.hanBonus??bonus,score:server?.score??count+bonus,players:game.players.filter((p:any)=>p.team===team).length};
 }).sort((a,b)=>b.score-a.score||a.team-b.team);
 const neutral=lands.filter(t=>t.owner===null).length,wilderness=lands.filter(t=>t.wilderness).length;
 return <aside className="live-ranking panel" aria-label="실시간 영토 현황과 국력 순위">
  <div className="ranking-heading"><div><div className="eyebrow">함께 넓히는 우리 나라</div><h2>{view==='nations'?'국력 순위':'개인별 기여도'}</h2></div><Flag size={23}/></div>
  <div className="ranking-view-tabs" role="group" aria-label="현황판 보기"><button aria-pressed={view==='nations'} onClick={()=>setView('nations')}>나라 순위</button><button aria-pressed={view==='people'} onClick={()=>setView('people')}>개인 기여도 <small>{people.length}</small></button></div>
  <p className="ranking-formula">점령한 땅 수 <b>＋</b> 가중치 <b>＝ 총점</b></p>
  <p className="ranking-rule">한강 유역은 땅마다 +1점 추가 (총 2점)</p>
  {view==='nations'&&<ol className="ranking-list" aria-live="polite" aria-relevant="text">
   {standings.map(x=>{const rank=1+standings.filter(y=>y.score>x.score).length,tied=standings.filter(y=>y.score===x.score).length>1,mine=!game.me.teacher&&game.me.team===x.team;
    return <li key={x.team} className={'ranking-country'+(mine?' ranking-mine':'')} style={{'--nation':nationColors[x.team]} as any}>
     <div className="ranking-title"><span className="ranking-place">{tied?'공동 ':''}{rank}위</span><b><i/>{x.name}{mine&&<small>우리 나라</small>}</b><strong>{x.score}<small>점</small></strong></div>
     <div className="ranking-calculation"><span>점령 <b>{x.count}</b>곳</span><span>＋ 가중치 <b>{x.bonus}</b>점</span><span>＝ <b>{x.score}</b>점</span></div>
     <div className="ranking-meter" aria-hidden="true"><span style={{width:(lands.length?x.count/lands.length*100:0)+'%'}}/></div>
     <div className="ranking-meta"><span><Users size={12}/>{x.players}명 참여</span><span>한강 {x.bonus}곳</span></div>
     <details className="ranking-holdings"><summary>점령한 땅 {x.count}곳 보기</summary>{x.count?<ul>{x.owned.map(t=><li key={t.id}><button onClick={()=>onSelect(t.id)}><span>{t.subject}{t.wilderness?' · 출제 전':''}</span><b>{t.hanRiver?'2점':'1점'}</b><ChevronRight size={13}/></button></li>)}</ul>:<p>아직 점령한 땅이 없어요.</p>}</details>
    </li>;
   })}
  </ol>}
  {view==='people'&&<section className="personal-contributions" aria-label="개인별 기여도 목록"><p className="contribution-note">기여 점수 = 지금 보유한 땅 수 + 한강 가중치<br/>풀이·출제 기록은 땅을 빼앗겨도 남아요.</p>{!people.length?<p className="contribution-empty">학생이 입장하면 기여도가 표시돼요.</p>:<ol className="contribution-list" aria-live="polite">{people.map(p=><li key={p.id} className={p.isMe?'my-contribution':''} style={{'--nation':nationColors[p.team]} as any}><div className="contribution-title"><span>{1+people.filter(q=>q.score>p.score).length}위</span><b>{p.nickname}{p.isMe&&<small>나</small>}</b><strong>{p.score}점</strong></div><div className="contribution-country">{nationNames[p.team]}{!p.active?' · 퇴장':''}</div><div className="contribution-breakdown"><span>보유 <b>{p.territories}</b>곳</span><span>가중치 <b>+{p.bonus}</b></span><span>풀이 <b>{p.solved}</b>개</span><span>승인 출제 <b>{p.approved}</b>개</span></div></li>)}</ol>}<p className="contribution-note">개인 활동은 이번 게임 기준입니다. 같은 땅의 반복 정답은 풀이 수에 중복 합산하지 않아요. 시작 영토와 기능 추가 이전의 점령은 개인에게 배정하지 않습니다. 영토 초기화 시 기여 기록도 새로 시작합니다.</p></section>}
  {view==='nations'&&mine&&<button className="my-contribution-summary" onClick={()=>setView('people')}><span>내 기여 · {mine.nickname}</span><b>{mine.score}점</b><small>풀이 {mine.solved}개 · 승인 출제 {mine.approved}개</small><ChevronRight size={16}/></button>}
  {view==='nations'&&game.me.teacher&&<button className="my-contribution-summary" onClick={()=>setView('people')}><span>개인별 기여도 확인</span><b>{people.length}명</b><small>학생별 풀이·출제·국력 기여</small><ChevronRight size={16}/></button>}
  <div className="ranking-map-totals"><span>전체 <b>{lands.length}</b>칸</span><span>중립 <b>{neutral}</b>칸</span><span>미개척 <b>{wilderness}</b>칸</span></div>
  <div className={'ranking-sync'+(connection==='실시간 연결'?' connected':'')} role="status"><span/>{connection==='실시간 연결'?'3초마다 자동 갱신':connection||'연결 확인 중'}{lastSync&&<time dateTime={new Date(lastSync).toISOString()}>확인 {new Date(lastSync).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</time>}</div>
 </aside>;
}
