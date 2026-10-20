import assert from 'node:assert/strict';
import fs from 'node:fs';
const url=process.env.GAME_TEST_URL||'http://127.0.0.1:4173';
const seeds=JSON.parse(fs.readFileSync(new URL('../questions.json',import.meta.url)));

if(!process.env.GAME_TEST_URL){
 const {DatabaseSync}=await import('node:sqlite');const vm=await import('node:vm');const ts=await import('typescript');
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync(new URL('../drizzle/0000_hot_snowbird.sql',import.meta.url),'utf8'));
 const DB={prepare(sql){return {bind(...args){return {async first(){return sqlite.prepare(sql).get(...args)||null},async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}}}}}}}};
 const exports={};const code=ts.default.transpileModule(fs.readFileSync(new URL('../app/api/game/route.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.default.ScriptTarget.ES2022,module:ts.default.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const ctx={exports,require:id=>id==='cloudflare:workers'?{env:{DB}}:id.endsWith('questions.json')?seeds:(()=>{throw Error(id)})(),crypto:globalThis.crypto,TextEncoder,Request,Response,URL,console};
 vm.runInNewContext(code,ctx);globalThis.fetch=(input,options)=>exports.GET(new Request(input,options));
}

assert.equal(seeds.length,200);assert.equal(new Set(seeds.map(q=>q.q)).size,200);assert.equal(new Set(seeds.map(q=>q.id)).size,200);
for(const q of seeds){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert(q.answer>=0&&q.answer<=3);assert(q.source.startsWith('https://'))}
async function post(body,session,status=200){const r=await fetch(url+'/api/game',{method:'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:'Bearer '+session.token}:{})},body:JSON.stringify({...body,room:session?.code||body.room})});const d=await r.json();assert.equal(r.status,status,d.error);return d}
async function state(s,view=''){const r=await fetch(url+'/api/game?room='+s.code+(view?'&view='+view:''),{headers:{Authorization:'Bearer '+s.token}});const d=await r.json();assert.equal(r.status,200,d.error);return d}
const t=await post({action:'create',title:'자동 검증 전용 방'});let g=await state(t);assert.equal(g.territories.length,200);assert(g.territories.every(t=>t.owner===null));
const a=await post({action:'join',room:t.code,nickname:'검증고구려',team:0}),b=await post({action:'join',room:t.code,nickname:'검증백제',team:1});
await post({action:'join',room:t.code,nickname:'검증고구려',team:2},null,400);
await post({action:'reset'},a,403);await post({action:'settings',paused:true},a,403);
const bank=await state(a,'bank');assert.equal(bank.questions.length,200);assert(bank.questions.every(q=>!('answer'in q)&&!('explain'in q)));
const c1=await post({action:'challenge',id:seeds[0].id},a),c2=await post({action:'challenge',id:seeds[0].id},b);assert(!('answer'in c1.question));
const win=await post({action:'answer',ticket:c1.ticket,choice:seeds[0].answer},a);assert(win.correct);await post({action:'answer',ticket:c1.ticket,choice:seeds[0].answer},a,409);await post({action:'answer',ticket:c2.ticket,choice:seeds[0].answer},b,409);
g=await state(a);assert.equal(g.territories[0].owner,0);assert(g.me.solvedIds.includes(seeds[0].id));await post({action:'challenge',id:seeds[0].id},a,400);
const q={...seeds[1],subject:'검증용 문화유산',q:'[검증용] 고구려를 세운 인물은 누구인가요?',options:['주몽','온조','왕건','이성계'],answer:0,explain:'고구려를 세운 인물은 주몽입니다.'};
await post({action:'submit',question:q},a);g=await state(t);assert.equal(g.pending.length,1);assert.equal(g.territories.length,200);const pending=g.pending[0];await post({action:'review',id:pending.id,approve:true},a,403);
await post({action:'review',id:pending.id,approve:true},t);g=await state(t);assert.equal(g.territories.length,201);assert.equal(g.bankCount,201);assert.equal(g.territories.find(x=>x.id===pending.id).owner,0);
await post({action:'review',id:pending.id,approve:true},t,409);
const steal=await post({action:'challenge',id:pending.id},b);await post({action:'answer',ticket:steal.ticket,choice:0},b);g=await state(t);assert.equal(g.territories.find(x=>x.id===pending.id).owner,1);
const wrong=await post({action:'challenge',id:seeds[2].id},b);const miss=await post({action:'answer',ticket:wrong.ticket,choice:null},b);assert.equal(miss.correct,false);await post({action:'challenge',id:seeds[2].id},b,400);
await post({action:'settings',paused:true},t);await post({action:'challenge',id:seeds[3].id},a,400);await post({action:'settings',paused:false,mapStyle:2},t);
const stale=await post({action:'challenge',id:seeds[4].id},a);await post({action:'reset'},t);await post({action:'answer',ticket:stale.ticket,choice:seeds[4].answer},a,409);g=await state(t);assert.equal(g.bankCount,201);assert(g.territories.every(t=>t.owner===null));assert.equal(g.mapStyle,2);
await post({action:'leave'},a);const rejoin=await post({action:'join',room:t.code,nickname:'검증고구려',team:2});assert.equal((await state(rejoin)).me.team,2);
// Both simultaneous correct answers must not silently overwrite one another.
const ca=await post({action:'challenge',id:seeds[5].id},rejoin),cb=await post({action:'challenge',id:seeds[5].id},b);
const race=await Promise.all([{s:rejoin,c:ca},{s:b,c:cb}].map(async({s,c})=>{const r=await fetch(url+'/api/game',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+s.token},body:JSON.stringify({action:'answer',room:s.code,ticket:c.ticket,choice:seeds[5].answer})});return r.status}));assert.deepEqual(race.sort(),[200,409]);
console.log('PASS: 200 seeds; persistence; identity; authorization; answer redaction; claim; replay protection; approval; territory expansion; takeover; pass cooldown; pause; reset preserving bank; leave/rejoin; concurrent answers.');
