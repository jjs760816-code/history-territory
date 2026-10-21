export const questionScopes=[
 {id:'prehistory',name:'선사와 고조선',unit:1,count:200,eras:['구석기','신석기','청동기','고조선','선사·고조선']},
 {id:'three',name:'삼국과 가야',unit:2,count:200,eras:['삼국','가야']},
 {id:'northsouth',name:'남북국',unit:2,count:200,eras:['남북국']},
 {id:'goryeo',name:'고려',unit:3,count:200,eras:['고려']},
 {id:'joseon-early',name:'조선 전기의 정치와 문화',unit:4,count:200,eras:['조선 전기','조선']},
 {id:'joseon-late',name:'조선의 전쟁과 후기 사회 변화',unit:5,count:200,eras:['조선 후기','조선']},
 {id:'opening',name:'개항과 대한제국',unit:6,count:200,eras:['개항기','대한제국']},
 {id:'occupation',name:'일제 강점기와 독립운동',unit:7,count:200,eras:['일제 강점기','대한제국']},
 {id:'republic',name:'광복과 대한민국의 발전',unit:8,count:200,eras:['현대']}
];
export const defaultQuestionScopes=(scenario='three'):string[]=>({three:['three'],northsouth:['northsouth'],goryeo:['goryeo'],joseon:['joseon-early','joseon-late'],occupation:['occupation'],republic:['republic']}[scenario]||['three']);
export function scopeForQuestion(q:{unit:string;era:string}){const unit=Number(q.unit.match(/주제 (\d+)\./)?.[1]);return questionScopes.find(s=>s.unit===unit&&(unit!==2||s.eras.includes(q.era)))?.id;}
