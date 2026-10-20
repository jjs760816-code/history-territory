import {env} from 'cloudflare:workers';
import seeds from '../../../questions.json';
type Question={id:string;unit:string;era:string;country:string;category:string;subject:string;q:string;options:string[];answer:number;explain:string;source:string;status:string;authorName:string;authorTeam:number;authorId:string;reason?:string};
type State={title:string;mapStyle:number;epoch:number;paused:boolean;questions:Question[];territories:{id:string;owner:number|null;version:number}[];players:Record<string,{nickname:string;team:number;solvedIds?:string[]}>;challenges:Record<string,{player:string;territory:string;version:number;epoch:number;expires:number}>;events:{text:string;at:number}[];cooldowns:Record<string,number>};
type Row={code:string;teacher_hash:string;state:string;revision:number};
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
  const state:State=JSON.parse(row!.state),result=fn(state,row!);
  const update=await db().prepare('UPDATE game_rooms SET state=?,revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(state),code,row!.revision).run();
  if(update.meta.changes===1)return result;
 }
 fail('친구들의 활동을 반영 중입니다. 한 번 더 눌러 주세요.',409);
}
async function handle(req:Request){
 const url=new URL(req.url),hash=await digest(req.headers.get('Authorization')?.replace(/^Bearer /,'')||'');
 if(req.method==='GET'){
  const code=(url.searchParams.get('room')||'').toUpperCase(),row=await db().prepare('SELECT * FROM game_rooms WHERE code=?').bind(code).first<Row>();if(!row)fail('방을 찾지 못했습니다.',404);
  const s:State=JSON.parse(row!.state),a=auth(row!,s,hash);
  if(url.searchParams.get('view')==='bank')return json({questions:s.questions.filter(q=>a.teacher||q.status==='approved'||q.authorId===a.id).map(q=>publicQ(q,a.teacher||q.authorId===a.id))});
  const map=new Map(s.questions.map(q=>[q.id,q]));
  return json({code,title:s.title,mapStyle:s.mapStyle,epoch:s.epoch,paused:s.paused,revision:row!.revision,me:{teacher:a.teacher,nickname:a.nickname,team:a.team,solvedIds:a.teacher?[]:s.players[a.id].solvedIds||[]},players:Object.values(s.players),territories:s.territories.map(t=>{const q=map.get(t.id)!;return {...t,unit:q.unit,era:q.era,country:q.country,category:q.category,subject:q.subject}}),pending:s.questions.filter(q=>q.status==='pending'&&(a.teacher||q.authorId===a.id)).map(q=>publicQ(q,true)),events:s.events,bankCount:s.questions.filter(q=>q.status==='approved').length});
 }
 const raw=await req.text();if(raw.length>30000)fail('입력 내용이 너무 큽니다.',413);let b:any;try{b=JSON.parse(raw)}catch{fail('요청 형식을 확인해 주세요.')}
 const action=b.action;
 if(action==='create'){
  const title=String(b.title||'우리 반 역사 영토전').trim().slice(0,60),token=random()+random(),teacherHash=await digest(token);
  for(let i=0;i<5;i++){
   const letters='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',code=Array.from(crypto.getRandomValues(new Uint8Array(6)),v=>letters[v%letters.length]).join('');
   const questions=(seeds as any[]).map(q=>({...q,status:'approved',authorName:'기본 문제은행',authorTeam:-1,authorId:'seed'}));
   const s:State={title,mapStyle:0,epoch:0,paused:false,questions,territories:questions.map(q=>({id:q.id,owner:null,version:0})),players:{},challenges:{},cooldowns:{},events:[{text:'모든 땅이 중립으로 열렸어요. 우리 역사의 첫 장을 함께 시작해요!',at:Date.now()}]};
   const r=await db().prepare('INSERT OR IGNORE INTO game_rooms(code,teacher_hash,state,revision,created_at) VALUES(?,?,?,0,?)').bind(code,teacherHash,JSON.stringify(s),Date.now()).run();if(r.meta.changes===1)return json({code,token,role:'teacher'});
  }fail('방 생성이 잠시 지연됩니다. 다시 시도해 주세요.',503);
 }
 const code=String(b.room||'').toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))fail('6자리 방 코드를 입력해 주세요.');
 if(action==='join'){
  const nickname=String(b.nickname||'').trim(),team=Number(b.team);if(!nickname||nickname.length>20||!Number.isInteger(team)||team<0||team>3)fail('별명과 나라를 확인해 주세요.');
  const token=random()+random(),id=await digest(token);
  await mutate(code,s=>{if(Object.keys(s.players).length>=100)fail('이 방의 참가 인원이 가득 찼습니다.');if(Object.values(s.players).some(p=>p.nickname.toLocaleLowerCase()===nickname.toLocaleLowerCase()))fail('이미 사용 중인 별명입니다. 다른 별명을 써 주세요.');s.players[id]={nickname,team};log(s,names[team]+'의 '+nickname+' 님이 입장했어요.');return null});return json({code,token,role:'student'});
 }
 return json(await mutate(code,(s,row)=>{
  const a=auth(row,s,hash);
  if(action==='leave'){if(!a.teacher){delete s.players[a.id];for(const [k,c] of Object.entries(s.challenges))if(c.player===a.id)delete s.challenges[k];log(s,a.nickname+' 님이 퇴장했어요.')}return {ok:true}}
  if(action==='settings'){teacher(a);if(b.mapStyle!==undefined){if(!Number.isInteger(b.mapStyle)||b.mapStyle<0||b.mapStyle>2)fail('지도 색상을 선택해 주세요.');s.mapStyle=b.mapStyle}if(b.paused!==undefined)s.paused=!!b.paused;return {ok:true}}
  if(action==='reset'){teacher(a);s.epoch++;s.territories=s.territories.map(t=>({...t,owner:null,version:t.version+1}));s.challenges={};s.cooldowns={};log(s,'선생님이 영토를 초기화했어요. 문제은행은 그대로 보관됩니다.');return {ok:true}}
  if(action==='submit'){
   if(s.paused)fail('잠시 쉬는 중이에요. 선생님이 다시 열어 주시면 참여해요.');if(s.questions.length>=800)fail('문제은행이 가득 찼습니다. 새 방을 만들어 주세요.');
   const q=validateQuestion(b.question),team=a.teacher?Number(b.authorTeam):a.team;if(!Number.isInteger(team)||team<0||team>3)fail('출제할 나라를 선택해 주세요.');
   if(s.questions.some(x=>x.q===q.q&&x.status!=='rejected'))fail('같은 문제가 이미 등록되어 있어요. 다른 문제를 만들어 주세요.');if(s.questions.filter(x=>x.authorId===a.id&&x.status==='pending').length>=10)fail('승인 대기 문제를 먼저 확인해 주세요.');
   const id='q-'+random();s.questions.push({...q,id,status:'pending',authorName:a.nickname,authorTeam:team,authorId:a.id});log(s,a.nickname+' 님이 새 문제의 승인을 요청했어요.');return {ok:true,message:'등록 완료! 선생님이 승인하면 새 영토가 우리 나라에 추가돼요.'};
  }
  if(action==='review'){
   teacher(a);const q=s.questions.find(q=>q.id===b.id&&q.status==='pending');if(!q)fail('이미 검토한 문제입니다.',409);
   if(b.approve){if(b.question)Object.assign(q!,validateQuestion(b.question));q!.status='approved';s.territories.push({id:q!.id,owner:q!.authorTeam,version:0});log(s,names[q!.authorTeam]+'의 '+q!.authorName+' 님이 만든 문제가 승인되어 새 영토를 확보했어요.');return {ok:true,message:'승인 완료! 문제은행과 새 영토에 반영했어요.'}}
   q!.status='rejected';q!.reason=String(b.reason||'문제와 정답을 다시 살펴보세요.').slice(0,200);return {ok:true,message:'수정 안내를 보냈어요.'};
  }
  if(action==='challenge'){
   if(a.teacher)fail('문제 풀이는 학생으로 입장해 주세요.');if(s.paused)fail('지금은 잠시 쉬는 중이에요.');const t=s.territories.find(t=>t.id===b.id);if(!t)fail('영토를 찾을 수 없습니다.');if(t!.owner===a.team)fail('이미 우리 나라의 영토예요. 다른 영토에 도전해요.');
   const until=s.cooldowns[a.id+':'+t!.id]||0;if(until>Date.now())fail('해설을 읽고 '+Math.ceil((until-Date.now())/1000)+'초 후 다시 도전해요.');
   const q=s.questions.find(q=>q.id===t!.id&&q.status==='approved');if(!q)fail('문제를 확인 중입니다. 잠시 후 다시 눌러 주세요.');
   for(const [k,c] of Object.entries(s.challenges))if(c.player===a.id||c.expires<Date.now())delete s.challenges[k];
   const ticket=random();s.challenges[ticket]={player:a.id,territory:t!.id,version:t!.version,epoch:s.epoch,expires:Date.now()+300000};return {ticket,question:publicQ(q!),owner:t!.owner};
  }
  if(action==='answer'){
   if(a.teacher)fail('학생만 답안을 제출할 수 있어요.');if(s.paused)fail('지금은 잠시 쉬는 중이에요.');const c=s.challenges[b.ticket];if(!c||c.player!==a.id||c.expires<Date.now()||c.epoch!==s.epoch)fail('도전 시간이 지났거나 게임이 초기화됐어요. 영토를 다시 선택해 주세요.',409);
   const t=s.territories.find(t=>t.id===c.territory)!;if(t.version!==c.version)fail('다른 친구가 먼저 영토를 차지했어요. 새로 도전해 주세요.',409);
   const q=s.questions.find(q=>q.id===t.id)!;if(b.choice!==null&&(!Number.isInteger(b.choice)||b.choice<0||b.choice>3))fail('보기를 선택해 주세요.');
   delete s.challenges[b.ticket];const correct=b.choice===q.answer;if(correct){const solved=s.players[a.id].solvedIds||[];if(!solved.includes(q.id))solved.push(q.id);s.players[a.id].solvedIds=solved;t.owner=a.team;t.version++;log(s,names[a.team]+'의 '+a.nickname+' 님이 '+q.subject+' 영토를 차지했어요!')}else s.cooldowns[a.id+':'+t.id]=Date.now()+15000;
   return {correct,answer:q.answer,explain:q.explain,source:q.source,message:correct?'정답! 우리 나라의 영토가 되었어요.':b.choice===null?'괜찮아요. 해설을 읽고 다시 도전해요.':'아쉬워요! 해설을 읽고 다시 도전해요.'};
  }
  fail('지원하지 않는 요청입니다.');
 }));
}
export async function GET(req:Request){try{return await handle(req)}catch(e){return json({error:e instanceof GameError?e.message:'서버 연결을 확인하고 다시 시도해 주세요.'},e instanceof GameError?e.status:500)}}
export const POST=GET;
