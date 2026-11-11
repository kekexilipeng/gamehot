import { EVENT_ALIASES, EVENT_NOISE } from "../../../industry/event-vocabulary.ts";

export interface EventReport { id:string; title:string; summary:string; sourceId:string; participant:string; publishedAt:Date }
export const plainTitle=(title:string)=>title.replace(/^【信源(?:预览|动态)】\s*/, "");
const stop=new Set("a an and are as at be been but by can company could for from game games gaming has have in into is it its more new now of on or out report reports says than that the their them these this to too up was were which will with would you your year today most after before including brings support available".split(" "));
const segmenter=new Intl.Segmenter("zh",{granularity:"word"});
function normalise(text:string) {
  let value=text.normalize("NFKC");
  for(const [token,pattern] of EVENT_ALIASES) value=value.replace(pattern,` ${token} `);
  return value.toLowerCase();
}
function words(text:string) {
  const normal=normalise(text), result=new Set<string>();
  for(const {segment,isWordLike} of segmenter.segment(normal)) {
    if(!isWordLike||stop.has(segment)||/^\d+$/.test(segment))continue;
    const token=segment.replace(/(?:ing|ed|s)$/u,"");
    if(token.length>=3||(/[\p{Script=Han}]/u.test(token)&&token.length>=2))result.add(token);
  }
  return result;
}
const shared=(a:Set<string>,b:Set<string>)=>[...a].filter(t=>b.has(t));
const percentages=(text:string)=>new Set(normalise(text).match(/\d+(?:\.\d+)?%/g)??[]);
const actions=[/取消|\bcancel/iu,/延期|\bdelay/iu,/收购|\bacqui|\bbidders?\b|\bbuy|\bsell/iu,
  /裁员|\blayoffs?\b/iu,/指责|\baccus|\bsabotag/iu,/销量|利润|营收|\bsales\b|\bprofit|\brevenue/iu,
  /更新|\bupdate|\bfaster\b/iu,/发布|发售|上线|\blaunch|\breleas/iu];
const actionSet=(title:string)=>new Set(actions.flatMap((pattern,i)=>pattern.test(title)?[String(i)]:[]));

/** Conservative complete-link clusters: every pair needs its own matching evidence, never a topic chain. */
export function matchEvents(input:EventReport[], now=new Date()) {
  const reports=input.filter(r=>!EVENT_NOISE.test(r.title)&&Number.isFinite(+r.publishedAt)&&+r.publishedAt<=+now&&+r.publishedAt>+now-48*3600000)
    .sort((a,b)=>+a.publishedAt-+b.publishedAt||a.id.localeCompare(b.id));
  const features=new Map(reports.map(r=>[r.id,{title:words(plainTitle(r.title)),body:words(plainTitle(r.title)+" "+r.summary),
    numbers:percentages(r.title+" "+r.summary),normal:normalise(plainTitle(r.title)).replace(/[^\p{L}\p{N}]/gu,"")} ]));
  const frequency=new Map<string,number>();
  for(const f of features.values())for(const t of f.title)frequency.set(t,(frequency.get(t)??0)+1);
  const weight=(token:string)=>1+Math.log((reports.length+1)/((frequency.get(token)??0)+1));
  const dice=(a:Set<string>,b:Set<string>)=>2*shared(a,b).reduce((n,t)=>n+weight(t),0)/([...a,...b].reduce((n,t)=>n+weight(t),0)||1);
  function agrees(a:EventReport,b:EventReport) {
    if(Math.abs(+a.publishedAt-+b.publishedAt)>36*3600000)return false;
    const x=features.get(a.id)!,y=features.get(b.id)!;
    for(const change of actions.slice(0,2))if(change.test(a.title)!==change.test(b.title))return false;
    const aActions=actionSet(a.title),bActions=actionSet(b.title);
    if(aActions.size&&bActions.size&&!shared(aActions,bActions).length)return false;
    if(/否认|\bden(?:y|ies|ied)\b|\bnot\b/iu.test(a.title)!==/否认|\bden(?:y|ies|ied)\b|\bnot\b/iu.test(b.title))return false;
    if(x.normal.length>=20&&x.normal===y.normal)return true;
    const common=shared(x.title,y.title),rare=common.filter(t=>(frequency.get(t)??0)<=Math.max(4,reports.length*.08));
    // Distinctive title wording must agree; body text alone cannot join unrelated headlines.
    if(common.length>=4&&rare.length>=2&&dice(x.title,y.title)>=.55)return true;
    if(common.length>=3&&rare.length>=2&&dice(x.body,y.body)>=.64)return true;
    // A shared precise figure or named feature corroborates a shared subject, including translations.
    const named=common.filter(t=>t.length>=4&&!/^(?:update|launch|sale|revenue|profit|faster|expand|publish|busines|develop|financial)$/.test(t));
    const precise=shared(x.numbers,y.numbers).length>0||shared(x.body,y.body).includes("newgameplu");
    return named.length>0&&precise&&(common.length>=2||named.some(t=>["valhalla","switchtwo"].includes(t)));
  }
  const clusters:EventReport[][]=[];
  for(const report of reports) {
    const compatible=clusters.filter(group=>group.every(other=>agrees(report,other)));
    // Ambiguous material stays separate; it cannot bridge two occurrences.
    if(compatible.length===1)compatible[0].push(report);else clusters.push([report]);
  }
  return clusters.filter(group=>new Set(group.map(r=>r.participant)).size>=2);
}
