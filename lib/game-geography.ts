import geographic from '../app/korea.json';
export const project=([lon,lat]:number[])=>[100+(lon-120)*52,20+(46-lat)*52];
// Northern extension is a teaching play area, not a reconstructed Goguryeo border.
const northern=[[120.7,40.7],[121.1,41.0],[121.5,40.9],[122.15,40.55],[122.0,39.8],[121.7,39.2],[121.3,38.85],[122.0,39.0],[122.5,39.35],[123.1,39.65],[123.7,39.8],[124.4,40.05],[125.0,40.5],[125.5,40.7],[126.0,41.1],[126.8,41.7],[127.5,41.4],[128.0,41.5],[128.5,42.05],[129.2,42.4],[129.8,42.45],[130.7,42.7],[131.2,43.5],[130.9,44.5],[129.6,45.1],[127.8,45.5],[125.5,45.2],[123.2,44.3],[121.7,42.8]].map(project);
const regions=(geographic as number[][][]).map(p=>p.map(project));
regions.push(northern);
regions.push(Array.from({length:24},(_,i)=>{const a=i*Math.PI/12;return project([126.53+Math.cos(a)*.48,33.37+Math.sin(a)*.16])}));
const mainlandRegions=[...regions];
export const islands=[{id:'island-ulleung',name:'울릉도',location:[130.90,37.50],radius:10},{id:'island-dokdo',name:'독도',location:[131.87,37.24],radius:8}];
for(const island of islands){const p=project(island.location);regions.push(Array.from({length:24},(_,i)=>{const a=i*Math.PI/12;return [p[0]+Math.cos(a)*island.radius,p[1]+Math.sin(a)*island.radius]}))}
const peninsulaRegions=mainlandRegions.filter(p=>p!==northern);
export function landPathFor(board='north'){const chosen=board==='peninsula'?[...peninsulaRegions,...regions.slice(mainlandRegions.length)]:regions;return chosen.map(p=>'M'+p.map(x=>x.join(',')).join('L')+'Z').join('')}
export const landPath=landPathFor();
function inside(p:number[],poly:number[][]){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
const halton=(n:number,b:number)=>{let f=1,r=0;while(n>0){f/=b;r+=f*(n%b);n=Math.floor(n/b)}return r};
function clip(poly:number[][],nx:number,ny:number,c:number){const out:number[][]=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=a[0]*nx+a[1]*ny-c,db=b[0]*nx+b[1]*ny-c,ai=da<=.001,bi=db<=.001;if(ai)out.push(a);if(ai!==bi){const t=da/(da-db);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])])}}return out}
// Prefix-stable positions: adding an approved question keeps existing centers fixed.
export function makePoints(count:number,board='north'){const pts:number[][]=[];for(let i=1;pts.length<Math.max(0,count-2)&&i<100000;i++){const p=[120+halton(i,2)*580,20+halton(i,3)*670];if((board==='peninsula'?peninsulaRegions:mainlandRegions).some(poly=>inside(p,poly)))pts.push(p)}for(const island of islands.slice(0,count))pts.push(project(island.location));return pts}
export function makeCells(count:number,board='north'){const pts=makePoints(count,board);return pts.map((p,i)=>{let poly=[[100,0],[800,0],[800,740],[100,740]];for(let j=0;j<pts.length&&poly.length;j++){if(i===j)continue;const q=pts[j];poly=clip(poly,q[0]-p[0],q[1]-p[1],(q[0]*q[0]+q[1]*q[1]-p[0]*p[0]-p[1]*p[1])/2)}return {point:p,polygon:poly}})}
// Teaching approximation of the Han/North Han/South Han basin, not an official watershed GIS boundary.
export const hanBasin=[[126.55,37.78],[126.85,37.95],[127.15,38.35],[127.65,38.65],[128.2,38.6],[128.48,38.12],[128.55,37.8],[128.85,37.42],[128.96,37.2],[128.55,37.04],[128.36,36.82],[127.9,36.85],[127.55,37.04],[127.2,37.13],[126.8,37.35]].map(project);
export const isHanPoint=(point:number[])=>inside(point,hanBasin);
export function territoryRules(count:number,board='north'){return makePoints(count,board).map(p=>({hanRiver:isHanPoint(p),points:isHanPoint(p)?2:1}))}
export function scoreTerritories(lands:{owner:number|null}[],teamCount=4,board='north'){const rules=territoryRules(lands.length,board);return Array.from({length:teamCount},(_,i)=>i).map(team=>{let count=0,hanCount=0;lands.forEach((t,i)=>{if(t.owner===team){count++;if(rules[i].hanRiver)hanCount++}});return {team,count,hanCount,hanBonus:hanCount,score:count+hanCount}})}

export const capitals=[{team:0,name:'국내성',place:'지안',location:[126.18,41.14]},{team:1,name:'한성',place:'서울',location:[127.12,37.53]},{team:2,name:'금성',place:'경주',location:[129.21,35.84]},{team:3,name:'금관가야',place:'김해',location:[128.88,35.23]}];
export function capitalIndices(count:number){const points=makePoints(count),used=new Set<number>();return capitals.map(c=>{const p=project(c.location);let best=-1,d=Infinity;points.forEach((q,i)=>{const v=(q[0]-p[0])**2+(q[1]-p[1])**2;if(!used.has(i)&&v<d){best=i;d=v}});if(best>=0)used.add(best);return best})}
export function startAtCapitals<T extends {owner:number|null}>(lands:T[]){capitalIndices(lands.length).forEach((index,team)=>{if(index>=0)lands[index].owner=team});return lands}

export function nearestStartIndices(count:number,locations:number[][],board='north'){const points=makePoints(count,board),used=new Set<number>();return locations.map(location=>{const p=project(location);let best=-1,d=Infinity;points.forEach((q,i)=>{const v=(q[0]-p[0])**2+(q[1]-p[1])**2;if(!used.has(i)&&v<d){best=i;d=v}});used.add(best);return best})}
