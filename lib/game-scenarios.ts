export type GameTeam={key:string;name:string;color:string;startIndex:number;startLabel:string;location:number[];startId?:string};
export const teamPalette=['#248754','#d84943','#e1a61b','#7250be','#187cbb','#bd5c17','#ba4591','#47636f'];
export const scenarioList=[{id:'three',name:'삼국시대',board:'north',fixed:true},{id:'northsouth',name:'남북국시대',board:'north',fixed:true},{id:'goryeo',name:'고려시대',board:'peninsula',fixed:false},{id:'joseon',name:'조선시대',board:'peninsula',fixed:false},{id:'occupation',name:'일제 강점기',board:'peninsula',fixed:false},{id:'republic',name:'대한민국',board:'peninsula',fixed:false}];
const presets:Record<string,{name:string;label:string;location:number[]}[]>={
 three:[{name:'고구려',label:'국내성(지안)',location:[126.18,41.14]},{name:'백제',label:'한성(서울)',location:[127.12,37.53]},{name:'신라',label:'금성(경주)',location:[129.21,35.84]},{name:'가야',label:'금관가야(김해)',location:[128.88,35.23]}],
 northsouth:[{name:'통일 신라',label:'금성(경주)',location:[129.21,35.84]},{name:'발해',label:'상경 용천부 근처',location:[129.13,44.10]}],
 goryeo:[{name:'거란',label:'북서쪽 시작점',location:[125.5,40]},{name:'몽골',label:'북동쪽 시작점',location:[128,41]},{name:'무관',label:'중부 시작점',location:[127.5,38]},{name:'문관',label:'개경 근처 시작점',location:[126.55,37.97]},{name:'백성',label:'남부 시작점',location:[127.5,36]}],
 joseon:[{name:'왜',label:'동남쪽 시작점',location:[129,35.2]},{name:'청나라',label:'북쪽 시작점',location:[126.5,41]},{name:'조선 양반',label:'한양 근처 시작점',location:[127,37.55]},{name:'조선 백성',label:'서남쪽 시작점',location:[126.9,35.2]}],
 occupation:[{name:'1모둠',label:'북부 시작점',location:[126.5,40]},{name:'2모둠',label:'중부 시작점',location:[127,37.5]},{name:'3모둠',label:'서남부 시작점',location:[126.9,35.2]},{name:'4모둠',label:'동남부 시작점',location:[129,35.3]}],
 republic:[{name:'1모둠',label:'북부 시작점',location:[126.5,40]},{name:'2모둠',label:'중부 시작점',location:[127,37.5]},{name:'3모둠',label:'서남부 시작점',location:[126.9,35.2]},{name:'4모둠',label:'동남부 시작점',location:[129,35.3]}]
};
export const scenarioFor=(id='three')=>scenarioList.find(s=>s.id===id)||scenarioList[0];
export function defaultTeams(id='three'):GameTeam[]{return (presets[id]||presets.three).map((t,i)=>({key:id+'-'+i,name:t.name,color:teamPalette[i],startIndex:-1,startLabel:t.label,location:[...t.location]}))}
