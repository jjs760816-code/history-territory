import {env} from 'cloudflare:workers';
import {territoryRules,scoreTerritories,capitalIndices,startAtCapitals,islands} from '../../../lib/game-geography';
import seeds from '../../../questions.json';
type Question={id:string;unit:string;era:string;country:string;category:string;subject:string;q:string;options:string[];answer:number;explain:string;source:string;status:string;authorName:string;authorTeam:number;authorId:string;reason?:string;territoryId?:string};
type Contribution={publicId:string;nickname:string;team:number;solvedTerritories:string[];approvedQuestions:string[];active:boolean};
type State={contributions?:Record<string,Contribution>;mapVersion?:number;title:string;mapStyle:number;epoch:number;paused:boolean;questions:Question[];territories:{id:string;owner:number|null;version:number;questionId?:string;claimedBy?:string}[];players:Record<string,{nickname:string;team:number;solvedIds?:string[]}>;challenges:Record<string,{player:string;territory:string;version:number;epoch:number;expires:number}>;events:{text:string;at:number}[];cooldowns:Record<string,number>};
type Row={code:string;teacher_hash:string;state:string;revision:number;created_at:number};
type Archive={id:string;code:string;title:string;result:string;access:string;ended_at:number};
const names=['고구려','백제','신라','가야'];
class GameError extends Error{constructor(message:string,public status=400){super(message)}}
const fail=(message:string,status=400):never=>{throw new GameError(message,status)};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const random=()=>crypto.randomUUID().replaceAll('-','');
const digest=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const db=()=>{if(!env.DB)fail('게임 저장소가 준비되지 않았습니다. 잠시 후 다시 접속해 주세요.',503);return env.DB!};
function auth(row:Row,s:State,id:string){if(id===row.teacher_hash)return {teacher:true,id,nickname:'선생님',team:0};const p=s.players[id];if(!p)fail('다시 입장해 주세요.',401);return {teacher:false,id,...p}}
const teacher=(a:{teacher:boolean})=>{if(!a.teacher)fail('교사만 사용할 수 있습니다.',403)};
function log(s:State,text:string){s.events.unshift({text,at:Date.now()});s.events=s.events.slice(0,60)}
function validateQuestion(b:any){
 const get=(k:string,n:number)=>{if(typeof b[k]!=='string'||!b[k].trim()||b[k].length>n)fail(k+' 항목을 확인해 주세요.');return b[k].trim()};
 const q=get('q',250),explain=get('explain',500),unit=get('unit',100),era=get('era',50),country=get('country',50),subject=get('subject',60),category=get('category',30);
 if(!['인물','유물','유적','사건','생활·문화'].includes(category))fail('문제 유형을 선택해 주세요.');
 if(!Array.isArray(b.options)||b.options.length!==4||b.options.some((x:any)=>typeof x!=='string'||!x.trim()||x.length>150))fail('보기 네 개를 입력해 주세요.');
 const options=b.options.map((x:string)=>x.trim());if(new Set(options).size!==4)fail('보기는 서로 다르게 입력해 주세요.');
 if(!Number.isInteger(b.answer)||b.answer<0||b.answer>3)fail('정답 번호를 확인해 주세요.');
 const source=typeof b.source==='string'?b.source.trim():'';if(source&&(source.length>500||!source.startsWith('https://')))fail('참고 자료는 https:// 주소로 입력해 주세요.');
 return {q,explain,unit,era,country,subject,category,options,answer:b.answer,source};
}
function publicQ(q:Question,show=false){const {answer,explain,authorId,...rest}=q;return show?{...rest,answer,explain}:rest}
async function mutate(code:string,fn:(s:State,row:Row)=>any){
 for(let i=0;i<8;i++){
  const row=await db().prepare('SELECT * FROM game_rooms WHERE code=?').bind(code).first<Row>();if(!row)fail('방 코드를 다시 확인해 주세요.',404);
  const state:State=JSON.parse(row!.state);ensureContributions(state);const result=fn(state,row!);
  const update=await db().prepare('UPDATE game_rooms SET state=?,revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(state),code,row!.revision).run();
  if(update.meta.changes===1)return result;
 }
 fail('친구들의 활동을 반영 중입니다. 한 번 더 눌러 주세요.',409);
}
function ensureContributions(s:State){s.contributions??={};for(const [id,p] of Object.entries(s.players))s.contributions[id]??={publicId:random(),nickname:p.nickname,team:p.team,solvedTerritories:[],approvedQuestions:[],active:true};}
function contributionStandings(s:State,me:string){const rules=territoryRules(s.territories.length);return Object.entries(s.contributions||{}).map(([id,p])=>{let count=0,bonus=0;s.territories.forEach((t,i)=>{if(t.claimedBy===id&&t.owner===p.team){count++;if(rules[i].hanRiver)bonus++}});return {id:p.publicId,nickname:p.nickname,team:p.team,active:p.active,isMe:id===me,solved:p.solvedTerritories.length,approved:p.approvedQuestions.length,territories:count,bonus,score:count+bonus}}).filter(p=>p.active||p.solved||p.approved||p.score).sort((a,b)=>b.score-a.score||b.solved-a.solved||b.approved-a.approved);}
function upgrade(s:State){ensureContributions(s);if(s.mapVersion===3)return false;if(s.mapVersion!==2){for(let i=0;i<300;i++)s.territories.push({id:'wild-'+String(i+1).padStart(3,'0'),owner:null,version:0});}for(const island of islands)if(!s.territories.some(t=>t.id===island.id))s.territories.push({id:island.id,owner:null,version:0});s.mapVersion=3;if(s.territories.every(t=>t.owner===null))startAtCapitals(s.territories);return true}
const questionFor=(s:State,t:State['territories'][number])=>s.questions.find(q=>q.id===(t.questionId||t.id)&&q.status==='approved');
function publicResult(result:any){return {id:result.id,code:result.code,title:result.title,startedAt:result.startedAt,endedAt:result.endedAt,scores:result.scores,totalTerritories:result.totalTerritories,neutral:result.neutral,bankCount:result.bankCount,playerCount:result.playerCount,contributions:[],territories:[],privateDetails:false}}
function archivedResult(row:Archive,hash:string){const result=JSON.parse(row.result);return (JSON.parse(row.access) as string[]).includes(hash)?{...result,privateDetails:true}:publicResult(result)}
async function archiveByCode(code:string){return db().prepare('SELECT * FROM game_archives WHERE code=?').bind(code).first<Archive>()}
function finalResult(s:State,row:Row,id:string,endedAt:number){const rules=territoryRules(s.territories.length);return {id,code:row.code,title:s.title,startedAt:row.created_at,endedAt,scores:scoreTerritories(s.territories),totalTerritories:s.territories.length,neutral:s.territories.filter(t=>t.owner===null).length,bankCount:s.questions.filter(q=>q.status==='approved').length,playerCount:Object.keys(s.contributions||{}).length,contributions:contributionStandings(s,''),territories:s.territories.map((t,i)=>({id:t.id,subject:islands.find(island=>island.id===t.id)?.name||questionFor(s,t)?.subject||'미개척지 '+(i+1),owner:t.owner,...rules[i],contributor:t.claimedBy?s.contributions?.[t.claimedBy]?.nickname||null:null})),questions:s.questions.map(q=>publicQ(q,true)),privateDetails:true}}
async function endGame(code:string,hash:string){for(let i=0;i<8;i++){const row=await db().prepare('SELECT * FROM game_rooms WHERE code=?').bind(code).first<Row>();if(!row){const archived=await archiveByCode(code);if(archived){const access=JSON.parse(archived.access);if(hash!==access[0])fail('교사만 게임을 종료할 수 있습니다.',403);return {ended:true,result:archivedResult(archived,hash)}}fail('방을 찾지 못했습니다.',404)}const s:State=JSON.parse(row!.state);teacher(auth(row!,s,hash));upgrade(s);const id='record-'+random(),endedAt=Date.now(),result=finalResult(s,row!,id,endedAt);const access=JSON.stringify([row!.teacher_hash,...Object.keys(s.players),...Object.keys(s.contributions||{})]);const changes=await db().batch([db().prepare('INSERT INTO game_archives(id,code,title,result,access,ended_at) SELECT ?,code,?,?,?,? FROM game_rooms WHERE code=? AND revision=?').bind(id,s.title,JSON.stringify(result),access,endedAt,code,row!.revision),db().prepare('DELETE FROM game_rooms WHERE code=? AND revision=? AND EXISTS (SELECT 1 FROM game_archives WHERE id=?)').bind(code,row!.revision,id)]);if(changes[0].meta.changes===1)return {ended:true,result};}fail('진행 중인 활동을 반영하고 있습니다. 다시 종료해 주세요.',409)}
async function handle(req:Request){
 const url=new URL(req.url),hash=await digest(req.headers.get('Authorization')?.replace(/^Bearer /,'')||'');
 if(req.method==='GET'){
  if(url.searchParams.get('view')==='history'){const rows=await db().prepare('SELECT * FROM game_archives ORDER BY ended_at DESC LIMIT 100').all<Archive>();return json({records:rows.results.map(r=>publicResult(JSON.parse(r.result)))});}
  if(url.searchParams.get('view')==='record'){const record=await db().prepare('SELECT * FROM game_archives WHERE id=?').bind(url.searchParams.get('id')||'').first<Archive>();if(!record)fail('저장된 게임 기록을 찾지 못했습니다.',404);return json({result:archivedResult(record!,hash)})}

  const code=(url.searchParams.get('room')||'').toUpperCase(),row=await db().prepare('SELECT * FROM game_rooms WHERE code=?').bind(code).first<Row>();if(!row){const archived=await archiveByCode(code);if(archived){if(!(JSON.parse(archived.access) as string[]).includes(hash))fail('종료된 게임방입니다. 메인 화면에서 결과 기록을 확인해 주세요.',410);return json({ended:true,result:archivedResult(archived,hash)})}fail('방을 찾지 못했습니다.',404)}
  let s:State=JSON.parse(row!.state);const a=auth(row!,s,hash);if(s.mapVersion!==3||!s.contributions)s=await mutate(code,(state)=>{upgrade(state);return state});
  if(url.searchParams.get('view')==='bank')return json({questions:s.questions.filter(q=>a.teacher||q.status==='approved'||q.authorId===a.id).map(q=>publicQ(q,a.teacher||q.authorId===a.id))});
  const homes=capitalIndices(s.territories.length),rules=territoryRules(s.territories.length);
  return json({code,title:s.title,mapStyle:s.mapStyle,epoch:s.epoch,paused:s.paused,revision:row!.revision,me:{teacher:a.teacher,nickname:a.nickname,team:a.team,solvedIds:a.teacher?[]:s.players[a.id].solvedIds||[]},players:Object.values(s.players),contributions:contributionStandings(s,a.id),scores:scoreTerritories(s.territories),territories:s.territories.map((t,i)=>{const q=questionFor(s,t),{claimedBy,...publicTerritory}=t;return {...publicTerritory,...rules[i],capitalTeam:homes.includes(i)?homes.indexOf(i):null,questionId:q?.id||null,wilderness:!q,unit:q?.unit||'',era:q?.era||'',country:q?.country||'',category:q?.category||'미개척지',island:!!islands.find(island=>island.id===t.id),subject:islands.find(island=>island.id===t.id)?.name||q?.subject||'미개척지 '+(i+1)}}),pending:s.questions.filter(q=>q.status==='pending'&&(a.teacher||q.authorId===a.id)).map(q=>publicQ(q,true)),events:s.events,bankCount:s.questions.filter(q=>q.status==='approved').length});
 }
 const raw=await req.text();if(raw.length>30000)fail('입력 내용이 너무 큽니다.',413);let b:any;try{b=JSON.parse(raw)}catch{fail('요청 형식을 확인해 주세요.')}
 const action=b.action;
 if(action==='create'){
  const title=String(b.title||'우리 반 역사 영토전').trim().slice(0,60),token=random()+random(),teacherHash=await digest(token);
  for(let i=0;i<5;i++){
   const letters='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',code=Array.from(crypto.getRandomValues(new Uint8Array(6)),v=>letters[v%letters.length]).join('');
   const questions=(seeds as any[]).map(q=>({...q,status:'approved',authorName:'기본 문제은행',authorTeam:-1,authorId:'seed'}));
   const s:State={contributions:{},mapVersion:3,title,mapStyle:0,epoch:0,paused:false,questions,territories:startAtCapitals([...questions.map(q=>({id:q.id,owner:null as number|null,version:0})),...Array.from({length:300},(_,i)=>({id:"wild-"+String(i+1).padStart(3,"0"),owner:null as number|null,version:0})),...islands.map(island=>({id:island.id,owner:null as number|null,version:0}))]),players:{},challenges:{},cooldowns:{},events:[{text:'네 나라는 수도 근처에서 시작해요. 문제 영토 200칸과 미개척지 300칸, 울릉도·독도를 탐험하세요!',at:Date.now()}]};
   const r=await db().prepare('INSERT OR IGNORE INTO game_rooms(code,teacher_hash,state,revision,created_at) SELECT ?,?,?,0,? WHERE NOT EXISTS (SELECT 1 FROM game_archives WHERE code=?)').bind(code,teacherHash,JSON.stringify(s),Date.now(),code).run();if(r.meta.changes===1)return json({code,token,role:'teacher'});
  }fail('방 생성이 잠시 지연됩니다. 다시 시도해 주세요.',503);
 }
 const code=String(b.room||'').toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))fail('6자리 방 코드를 입력해 주세요.');
 if(action==='end')return json(await endGame(code,hash));
 const archived=await archiveByCode(code);if(archived){if(action==='leave'){if(!(JSON.parse(archived.access) as string[]).includes(hash))fail('참여 정보를 확인해 주세요.',401);return json({ok:true,archived:true})}fail('종료된 게임방입니다. 메인 화면에서 결과 기록을 확인해 주세요.',410)}
 if(action==='join'){
  const nickname=String(b.nickname||'').trim(),team=Number(b.team);if(!nickname||nickname.length>20||!Number.isInteger(team)||team<0||team>3)fail('별명과 나라를 확인해 주세요.');
  const token=random()+random(),id=await digest(token);
  await mutate(code,s=>{if(Object.keys(s.players).length>=100)fail('이 방의 참가 인원이 가득 찼습니다.');if(Object.values(s.players).some(p=>p.nickname.toLocaleLowerCase()===nickname.toLocaleLowerCase()))fail('이미 사용 중인 별명입니다. 다른 별명을 써 주세요.');s.players[id]={nickname,team};s.contributions![id]={publicId:random(),nickname,team,solvedTerritories:[],approvedQuestions:[],active:true};log(s,names[team]+'의 '+nickname+' 님이 입장했어요.');return null});return json({code,token,role:'student'});
 }
 return json(await mutate(code,(s,row)=>{
  const a=auth(row,s,hash);upgrade(s);
  if(action==='leave'){if(!a.teacher){delete s.players[a.id];if(s.contributions?.[a.id])s.contributions[a.id].active=false;for(const [k,c] of Object.entries(s.challenges))if(c.player===a.id)delete s.challenges[k];log(s,a.nickname+' 님이 퇴장했어요.')}return {ok:true}}
  if(action==='settings'){teacher(a);if(b.mapStyle!==undefined){if(!Number.isInteger(b.mapStyle)||b.mapStyle<0||b.mapStyle>2)fail('지도 색상을 선택해 주세요.');s.mapStyle=b.mapStyle}if(b.paused!==undefined)s.paused=!!b.paused;return {ok:true}}
  if(action==='reset'){teacher(a);s.epoch++;s.territories=startAtCapitals(s.territories.map(t=>({...t,owner:null,claimedBy:undefined,version:t.version+1})));s.challenges={};s.cooldowns={};for(const p of Object.values(s.contributions||{})){p.solvedTerritories=[];p.approvedQuestions=[]}log(s,'선생님이 영토를 초기화했어요. 네 나라는 수도 근처에서 다시 시작하며 문제은행은 보관됩니다.');return {ok:true}}
  if(action==='submit'){
   if(s.paused)fail('잠시 쉬는 중이에요. 선생님이 다시 열어 주시면 참여해요.');if(s.questions.length>=800)fail('문제은행이 가득 찼습니다. 새 방을 만들어 주세요.');
   const q=validateQuestion(b.question),team=a.teacher?Number(b.authorTeam):a.team;if(!Number.isInteger(team)||team<0||team>3)fail('출제할 나라를 선택해 주세요.');
   if(s.questions.some(x=>x.q===q.q&&x.status!=='rejected'))fail('같은 문제가 이미 등록되어 있어요. 다른 문제를 만들어 주세요.');if(s.questions.filter(x=>x.authorId===a.id&&x.status==='pending').length>=10)fail('승인 대기 문제를 먼저 확인해 주세요.');
   const territoryId=typeof b.territoryId==='string'?b.territoryId:undefined;if(territoryId){const target=s.territories.find(t=>t.id===territoryId);if(!target||questionFor(s,target))fail('다른 미개척지를 선택해 주세요.');if(target!.owner!==null&&target!.owner!==team)fail('다른 나라의 시작 영토에는 출제할 수 없어요.');}
   const id='q-'+random();s.questions.push({...q,id,territoryId,status:'pending',authorName:a.nickname,authorTeam:team,authorId:a.id});log(s,a.nickname+' 님이 새 문제의 승인을 요청했어요.');return {ok:true,message:'등록 완료! 선생님이 승인하면 새 영토가 우리 나라에 추가돼요.'};
  }
  if(action==='review'){
   teacher(a);const q=s.questions.find(q=>q.id===b.id&&q.status==='pending');if(!q)fail('이미 검토한 문제입니다.',409);
   if(b.approve){if(b.question)Object.assign(q!,validateQuestion(b.question));q!.status='approved';const target=q!.territoryId?s.territories.find(t=>t.id===q!.territoryId):s.territories.find(t=>!questionFor(s,t)&&t.owner===null);if(q!.territoryId&&(!target||questionFor(s,target)||target.owner!==null&&target.owner!==q!.authorTeam))fail('선택한 미개척지가 먼저 개발됐어요. 학생에게 다른 지역으로 다시 등록하도록 안내해 주세요.',409);if(target){target.questionId=q!.id;target.owner=q!.authorTeam;target.claimedBy=q!.authorId;target.version++}else s.territories.splice(Math.max(0,s.territories.length-2),0,{id:q!.id,owner:q!.authorTeam,version:0,claimedBy:q!.authorId});const author=s.contributions?.[q!.authorId];if(author&&!author.approvedQuestions.includes(q!.id))author.approvedQuestions.push(q!.id);log(s,names[q!.authorTeam]+'의 '+q!.authorName+' 님이 만든 문제가 승인되어 새 영토를 확보했어요.');return {ok:true,message:'승인 완료! 문제은행과 새 영토에 반영했어요.'}}
   q!.status='rejected';q!.reason=String(b.reason||'문제와 정답을 다시 살펴보세요.').slice(0,200);return {ok:true,message:'수정 안내를 보냈어요.'};
  }
  if(action==='challenge'){
   if(a.teacher)fail('문제 풀이는 학생으로 입장해 주세요.');if(s.paused)fail('지금은 잠시 쉬는 중이에요.');const t=s.territories.find(t=>t.id===b.id||t.questionId===b.id);if(!t)fail('영토를 찾을 수 없습니다.');if(t!.owner===a.team)fail('이미 우리 나라의 영토예요. 다른 영토에 도전해요.');
   const until=s.cooldowns[a.id+':'+t!.id]||0;if(until>Date.now())fail('해설을 읽고 '+Math.ceil((until-Date.now())/1000)+'초 후 다시 도전해요.');
   const q=questionFor(s,t!);if(!q)fail('미개척지에는 아직 문제가 없어요. 문제를 만들고 교사 승인을 받으면 점령합니다.');
   for(const [k,c] of Object.entries(s.challenges))if(c.player===a.id||c.expires<Date.now())delete s.challenges[k];
   const ticket=random();s.challenges[ticket]={player:a.id,territory:t!.id,version:t!.version,epoch:s.epoch,expires:Date.now()+300000};return {ticket,question:publicQ(q!),owner:t!.owner,...territoryRules(s.territories.length)[s.territories.indexOf(t!)]};
  }
  if(action==='answer'){
   if(a.teacher)fail('학생만 답안을 제출할 수 있어요.');if(s.paused)fail('지금은 잠시 쉬는 중이에요.');const c=s.challenges[b.ticket];if(!c||c.player!==a.id||c.expires<Date.now()||c.epoch!==s.epoch)fail('도전 시간이 지났거나 게임이 초기화됐어요. 영토를 다시 선택해 주세요.',409);
   const t=s.territories.find(t=>t.id===c.territory)!;if(t.version!==c.version)fail('다른 친구가 먼저 영토를 차지했어요. 새로 도전해 주세요.',409);
   const q=questionFor(s,t)!;if(b.choice!==null&&(!Number.isInteger(b.choice)||b.choice<0||b.choice>3))fail('보기를 선택해 주세요.');
   delete s.challenges[b.ticket];const correct=b.choice===q.answer;if(correct){const solved=s.players[a.id].solvedIds||[];if(!solved.includes(q.id))solved.push(q.id);s.players[a.id].solvedIds=solved;t.owner=a.team;t.claimedBy=a.id;const activity=s.contributions?.[a.id];if(activity&&!activity.solvedTerritories.includes(t.id))activity.solvedTerritories.push(t.id);t.version++;log(s,names[a.team]+'의 '+a.nickname+' 님이 '+q.subject+' 영토를 차지했어요!')}else s.cooldowns[a.id+':'+t.id]=Date.now()+15000;
   const rule=territoryRules(s.territories.length)[s.territories.indexOf(t)];
   return {correct,...rule,answer:q.answer,explain:q.explain,source:q.source,message:correct?(rule.hanRiver?'정답! 한강 유역을 점령했어요. 이 영토는 2점입니다!':'정답! 일반 영토를 점령했어요. 이 영토는 1점입니다.'):b.choice===null?'괜찮아요. 해설을 읽고 다시 도전해요.':'아쉬워요! 해설을 읽고 다시 도전해요.'};
  }
  fail('지원하지 않는 요청입니다.');
 }));
}
export async function GET(req:Request){try{return await handle(req)}catch(e){return json({error:e instanceof GameError?e.message:'서버 연결을 확인하고 다시 시도해 주세요.'},e instanceof GameError?e.status:500)}}
export const POST=GET;
