'use client';
import {defaultTeams,scenarioFor} from '../lib/game-scenarios';
import {Download,LogOut,Flag} from 'lucide-react';
import {nationNames,nationColors} from './map';
export default function GameResults({result,finished=false,onClose,busy=false}:any){
 const teams=result.teams||defaultTeams(),nationNames=teams.map((t:any)=>t.name),nationColors=teams.map((t:any)=>t.color);
 const scores=[...result.scores].sort((a:any,b:any)=>b.score-a.score||a.team-b.team);
 const download=()=>{const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='역사영토전_결과_'+result.code+'.json';a.click();URL.revokeObjectURL(url)};
 return <div className="final-results" role="dialog" aria-modal="true" aria-label={finished?'게임 종료 결과':'저장된 게임 결과'}><section className="final-sheet">
  <header className="final-heading"><div><div className="eyebrow">{finished?'게임 종료 · 서버에 기록 저장 완료':'메인 화면에 남겨 둔 우리 반 게임 기록'}</div><h1>{result.title}</h1><p>{new Date(result.endedAt).toLocaleString('ko-KR')} 종료 · {scenarioFor(result.scenario).name} · 참여 {result.playerCount}명 · 방 {result.code}</p></div><Flag size={32}/></header>
  <div className="final-winner">🏆 {scores.filter((s:any)=>s.score===scores[0]?.score).map((s:any)=>nationNames[s.team]).join(' · ')} {scores.filter((s:any)=>s.score===scores[0]?.score).length>1?'공동 ':''}1위</div>
  <p className="final-formula">국력 = 점령한 땅 수 + 한강 가중치 (한강 영토마다 +1점)</p>
  <div className="final-table-wrap"><table className="final-table"><thead><tr><th>순위</th><th>나라</th><th>점령 영토</th><th>한강 가중치</th><th>총점</th></tr></thead><tbody>{scores.map((s:any)=><tr key={s.team} style={{'--nation':nationColors[s.team]} as any}><td>{1+scores.filter((x:any)=>x.score>s.score).length}위</td><th>{nationNames[s.team]}</th><td>{s.count}곳</td><td>+{s.hanBonus}점</td><td><strong>{s.score}점</strong></td></tr>)}</tbody></table></div>
  <p className="final-small">전체 영토 {result.totalTerritories}칸 · 중립 {result.neutral}칸 · 문제은행 {result.bankCount}문항</p>
  <details className="final-details" open><summary>개인별 기여도 {result.contributions.length}명</summary>{result.privateDetails?<div className="final-table-wrap"><table className="final-personal"><thead><tr><th>순위</th><th>이름</th><th>나라</th><th>영토</th><th>가중치</th><th>기여점수</th><th>풀이</th><th>승인 출제</th></tr></thead><tbody>{result.contributions.map((p:any)=><tr key={p.id}><td>{1+result.contributions.filter((x:any)=>x.score>p.score).length}위</td><th>{p.nickname}</th><td>{nationNames[p.team]}</td><td>{p.territories}</td><td>+{p.bonus}</td><td><b>{p.score}</b></td><td>{p.solved}</td><td>{p.approved}</td></tr>)}</tbody></table>{!result.contributions.length&&<p className="final-small">참여 학생 기록이 없습니다.</p>}</div>:<p className="final-small">나라별 최종 점수를 볼 수 있습니다. 개인별 상세 결과는 이 게임에 참여했던 기기에서 확인할 수 있습니다.</p>}</details>
  {result.privateDetails&&<details className="final-details"><summary>모든 영토의 최종 소유 현황 ({result.territories.length}칸)</summary><div className="final-land-list">{result.territories.map((t:any)=><div key={t.id}><b>{t.subject}</b><span>{t.owner===null?'중립':nationNames[t.owner]}</span><span>{t.points}점</span><small>{t.contributor||''}</small></div>)}</div></details>}
  <footer className="final-actions"><span>결과가 자동 보관되었습니다. 종료된 방에는 다시 입장할 수 없습니다.</span><button className="button subtle" onClick={download}><Download size={18}/>결과 파일 저장</button><button className="button primary" disabled={busy} onClick={onClose}><LogOut size={18}/>{finished?'방 나가기 · 메인으로':'메인 기록으로 돌아가기'}</button></footer>
 </section></div>;
}
