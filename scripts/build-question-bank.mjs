import fs from 'node:fs';
const seeds=JSON.parse(fs.readFileSync(new URL('../questions.json',import.meta.url)));
const ids=['prehistory','three','northsouth','goryeo','joseon-early','joseon-late','opening','occupation','republic'];
const names=['선사와 고조선','삼국과 가야','남북국','고려','조선 전기의 정치와 문화','조선의 전쟁과 후기 사회 변화','개항과 대한제국','일제 강점기와 독립운동','광복과 대한민국의 발전'];
function scope(q){const n=Number(q.unit.match(/주제 (\d+)/)[1]);return n===2?(q.era==='남북국'?'northsouth':'three'):ids[n===1?0:n];}
const facts=Object.fromEntries(ids.map(id=>[id,[]]));
for(const q of seeds)facts[scope(q)].push({term:q.subject,description:q.explain,source:q.source,unit:q.unit,era:q.era,country:q.country,category:q.category});
let group;for(const line of fs.readFileSync(new URL('../data/history-facts.txt',import.meta.url),'utf8').trim().split('\n')){if(line.startsWith('[')){group=line.slice(1,-1);continue}const [term,description]=line.split('|');const model=facts[group][0];facts[group].push({...model,term,description,era:({prehistory:'선사·고조선',three:'삼국',northsouth:'남북국','joseon-early':'조선 전기','joseon-late':'조선 후기',opening:'개항기',occupation:'일제 강점기',republic:'현대',goryeo:'고려'})[group],country:({prehistory:'선사·고조선',three:'삼국·가야',northsouth:'신라·발해',goryeo:'고려','joseon-early':'조선','joseon-late':'조선',opening:'조선·대한제국',occupation:'일제 강점기',republic:'대한민국'})[group],category:'생활·문화'});}
const bank=[];
const ox={};let og;for(const line of fs.readFileSync(new URL('../data/history-ox.txt',import.meta.url),'utf8').trim().split('\n')){if(line.startsWith('[')){og=line.slice(1,-1);ox[og]=[];continue}const [answer,statement,explain]=line.split('|');ox[og].push({answer,statement,explain})}
const standards={prehistory:['6사04-01'],three:['6사04-02'],northsouth:['6사04-02'],goryeo:['6사04-03'],'joseon-early':['6사05-01'],'joseon-late':['6사05-01','6사05-02'],opening:['6사05-02'],occupation:['6사06-01'],republic:['6사06-02','6사07-01','6사08-01']};
for(const [si,id] of ids.entries()){
 const list=facts[id];if(list.length!==50)throw Error(id+': expected 50 topics, got '+list.length);
 if(new Set(list.map(x=>x.term)).size!==50)throw Error('Duplicate topic '+id);
 for(const [i,f] of list.entries()){
  const related=(a,b)=>a.term===b.term||a.description.includes(b.term)||b.description.includes(a.term)||a.term.includes(b.term)||b.term.includes(a.term);
  const other=[];for(let offset=13;other.length<3&&offset<63;offset++){const candidate=list[(i+offset)%50];if(!related(f,candidate)&&!other.includes(candidate))other.push(candidate)}
  const wrongDescription=(fact,start)=>{for(let k=0;k<50;k++){const candidate=list[(start+k)%50];if(!related(fact,candidate))return candidate.description}throw Error('No unambiguous distractor '+fact.term)};
  const mix=(correct,wrong,variant)=>{const answer=(i+si+variant)%4,options=[...wrong];options.splice(answer,0,correct);return {options,answer}};
  const pair=(term,description)=>`${term} — ${description}`;
  const definitions=[
   {q:`[${names[si]}] 다음 설명에 해당하는 학습 주제는 무엇인가요?\n${f.description.replaceAll(f.term,'(     )')}`,correct:f.term,wrong:other.map(x=>x.term),explain:`${f.term}: ${f.description}`},
   {q:`두 설명을 읽고 (가), (나)에 알맞은 주제를 순서대로 고르세요.\n(가) ${f.description.replaceAll(f.term,'(     )')}\n(나) ${other[0].description.replaceAll(other[0].term,'(     )')}`,correct:`${f.term} / ${other[0].term}`,wrong:[`${other[0].term} / ${f.term}`,`${other[1].term} / ${other[2].term}`,`${other[2].term} / ${other[1].term}`],explain:`(가) ${f.term}: ${f.description} (나) ${other[0].term}: ${other[0].description}`},
   {q:`‘${[f,...other].map(x=>x.term).join('·')}’의 학습 카드를 만들었어요. 이름과 설명을 바르게 연결한 것은 무엇인가요?`,correct:pair(f.term,f.description),wrong:other.map((x,j)=>pair(x.term,wrongDescription(x,i+[7,21,33][j]))),explain:`바른 연결은 ‘${f.term} — ${f.description}’입니다.`},
   {q:`‘${[...other,f].map(x=>x.term).join('·')}’의 학습 카드를 검토해요. 이름과 설명이 잘못 연결된 것은 무엇인가요?`,correct:pair(f.term,wrongDescription(f,i+9)),wrong:other.map(x=>pair(x.term,x.description)),explain:`‘${f.term}’의 바른 설명은 다음과 같습니다. ${f.description}`}
  ];
  for(const [v,d] of definitions.entries()){if(v===3&&i>=30)continue;bank.push({id:`bank-${id}-${String(i+1).padStart(3,'0')}-${v+1}`,unit:f.unit,scope:id,kind:'mcq',grade:5,standards:standards[id],era:f.era,country:f.country,category:f.category,subject:f.term,q:d.q,...mix(d.correct,d.wrong,v),explain:d.explain,source:f.source,format:['설명에서 주제 찾기','두 자료 비교하기','바른 연결 찾기','잘못된 연결 찾기'][v]});}
 }
 if(ox[id].length!==20)throw Error('OX count '+id);for(const [i,o] of ox[id].entries()){const f=list[0];bank.push({id:`bank-${id}-ox-${i+1}`,scope:id,kind:'ox',grade:5,standards:standards[id],unit:f.unit,era:({prehistory:'선사·고조선',three:'삼국',northsouth:'남북국',goryeo:'고려','joseon-early':'조선 전기','joseon-late':'조선 후기',opening:'개항기',occupation:'일제 강점기',republic:'현대'})[id],country:({prehistory:'선사·고조선',three:'삼국·가야',northsouth:'신라·발해',goryeo:'고려','joseon-early':'조선','joseon-late':'조선',opening:'조선·대한제국',occupation:'일제 강점기',republic:'대한민국'})[id],category:'생활·문화',subject:names[si]+' OX '+(i+1),q:'다음 설명이 맞으면 O, 틀리면 X를 고르세요.\n'+o.statement,options:['O','X'],answer:o.answer==='O'?0:1,explain:o.explain,source:f.source,format:'OX 사실 판단'});}
}
if(bank.length!==1800)throw Error('Expected 1800 questions');
if(new Set(bank.map(q=>q.id)).size!==bank.length||new Set(bank.map(q=>q.q)).size!==bank.length)throw Error('Duplicate questions');
for(const q of bank){if(q.options.length!==(q.kind==='ox'?2:4)||new Set(q.options).size!==q.options.length)throw Error('Bad options '+q.id)}
fs.writeFileSync(new URL('../question-bank.json',import.meta.url),JSON.stringify(bank,null,2)+'\n');
console.log('Built',bank.length,'questions:',Object.fromEntries(ids.map(id=>[id,bank.filter(q=>q.scope===id).length])));
