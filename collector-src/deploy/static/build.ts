import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fetchRss } from "../../packages/backend/src/sources/rss.ts";
import { previewCategory, previewTags } from "../../industry/preview-tags.ts";
import { CATEGORIES } from "../../industry/taxonomy.ts";
import { matchEvents, plainTitle } from "../../modules/game-updates/backend/event-matching.ts";
import { collectRankings } from "../../modules/game-rankings/backend/collect.ts";
import { collectMobileRankings } from "../../modules/game-rankings/backend/collect-mobile.ts";
import { collectStoreDetails } from "../../modules/game-rankings/backend/collect-store-details.ts";
import { VERIFIED_GAME_WEBSITES, registeredWebsite } from "../../modules/game-rankings/websites.ts";
import { beijingDate } from "../../packages/contracts/src/time.ts";

const root=process.cwd(), data=path.join(root,"data"), output=path.join(root,"site");
const read=async(file:string)=>JSON.parse(await fs.readFile(file,"utf8"));
const write=async(file:string,value:unknown)=>{await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(value));};
const validUrl=(value:unknown)=>{try{const u=new URL(String(value));return ["https:","http:"].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}};
export function newsItem(c:any,source:any,now:Date) {
  const at=new Date(c.publishedAt),url=validUrl(c.url);
  if(!url||!c.title||!c.publishedAt||!Number.isFinite(+at)||+at>+now||/抽奖|兑换码|签到|限免|周末特惠|\bfree play days\b|\bdeals?\b/iu.test(c.title))return null;
  const title=plainTitle(c.title), summary=String(c.excerpt||c.bodyText||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,360);
  const category=previewCategory(title,summary,source.id);
  return {id:"preview-"+createHash("sha256").update(url).digest("hex").slice(0,24),title,summary,url,sourceId:source.id,sourceName:source.name,
    participant:source.signal_group_id?"group:"+source.signal_group_id:source.owner_entity_id?"owner:"+source.owner_entity_id:"source:"+source.id,
    at:at.toISOString(),category,tags:previewTags(title,summary,category).filter(t=>t!=="原始信源预览")};
}
export function rankHot(news:any[],now:Date) {
  return matchEvents(news.map(n=>({...n,publishedAt:new Date(n.at)})),now).map(group=>{
    const rows=group.map(r=>news.find(n=>n.id===r.id));
    const participants=new Map<string,number>();for(const row of rows)participants.set(row.participant,Math.max(participants.get(row.participant)??0,Date.parse(row.at)));
    const title=([...rows].sort((a,b)=>Number(/[\p{Script=Han}]/u.test(b.title))-Number(/[\p{Script=Han}]/u.test(a.title))||Date.parse(b.at)-Date.parse(a.at)))[0].title;
    const ids=rows.map(r=>r.id).sort();
    return {id:createHash("sha256").update(ids.join("|")).digest("hex").slice(0,20),title,summary:rows.find(r=>r.title===title).summary,ids,
      heat:Math.round([...participants.values()].reduce((sum,at)=>sum+10*Math.pow(.5,(+now-at)/86400000),0)*10)/10,
      participants:participants.size,sources:[...new Set(rows.map(r=>r.sourceName))],latestAt:new Date(Math.max(...rows.map(r=>Date.parse(r.at)))).toISOString()};
  }).sort((a,b)=>b.heat-a.heat||Date.parse(b.latestAt)-Date.parse(a.latestAt)).slice(0,10).map((e,i)=>({...e,rank:i+1}));
}
export async function build() {
  const now=new Date(),seed=await read(path.join(data,"seed.json"));
  let state=seed;
  try{state={...state,...await read(path.join(data,"state.json"))};}catch{}
  if(process.env.GAMEHOT_PREVIOUS_URL){
    const url=new URL("data/state.json",process.env.GAMEHOT_PREVIOUS_URL.replace(/\/?$/,"/"));
    if(url.protocol!=="https:")throw Error("Previous publication must use HTTPS");
    try{const r=await fetch(url,{signal:AbortSignal.timeout(25000)});if(r.ok){const prior=await r.json();if(prior.version===1&&Array.isArray(prior.news))state={...state,...prior};}}catch{console.log("Previous published state unavailable; retained packaged data");}
  }
  const news=new Map<string,any>((state.news??[]).map((n:any)=>[n.id,n]));
  try{for(const n of await read(path.join(data,"news.json")))if(!news.has(n.id))news.set(n.id,n);}catch{}
  const sources=(await read(path.join(data,"sources.json"))).sources;
  const failures:string[]=[],results:any[]=[];const validators={...state.validators};
  const online=process.env.COLLECT_ENABLED==="true";
  if(online){
    for(const source of sources.filter((s:any)=>s.kind==="rss")){
      try{const feed=await fetchRss({...source,cursor:{rss:validators[source.id]}});let added=0;
        for(const candidate of feed.candidates.slice(0,100)){const item=newsItem(candidate,source,now);if(!item)continue;if(!news.has(item.id)){news.set(item.id,item);added++;}}
        validators[source.id]=feed.validator;results.push({id:source.id,name:source.name,ok:true,added});
      }catch{failures.push(source.id);results.push({id:source.id,name:source.name,ok:false,added:0});}
    }
  }
  const items=[...news.values()].filter(n=>Number.isFinite(Date.parse(n.at))&&Date.parse(n.at)<=+now&&Date.parse(n.at)>+now-90*86400000).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,2000);
  let {steam,mobile,profiles}=state;
  if(online){
    try{steam=await collectRankings(path.join(data,"steam.json"));}catch{failures.push("steam");}
    try{await write(path.join(data,"mobile.json"),mobile);const result=await collectMobileRankings(path.join(data,"mobile.json"));mobile=result.snapshot;failures.push(...result.failures.map(f=>f.id));}catch{failures.push("mobile");}
    // Profiles change slowly; one daily lookup plus newly encountered app IDs is sufficient.
    const missing=mobile.charts.some((c:any)=>c.source==="App Store"&&c.games.some((g:any)=>!profiles.games[g.id]));
    if(missing||+now-Date.parse(profiles.capturedAt)>86400000){try{await write(path.join(data,"profiles.json"),profiles);const result=await collectStoreDetails(path.join(data,"profiles.json"),mobile);profiles=result.snapshot;if(result.failures.length)failures.push("profiles-partial");}catch{failures.push("profiles");}}
  }
  if(!items.length||!steam?.games?.length||!mobile?.charts?.length)throw Error("Refusing to publish an empty site");
  const hot=rankHot(items,now),topics=(await read(path.join(data,"topics.json"))).topics;
  const status={generatedAt:now.toISOString(),onlineCollection:online,automationEnabled:process.env.GITHUB_ACTIONS==="true",schedule:"每两小时尝试更新",sources:results,failed:failures,news:items.length,today:items.filter(n=>beijingDate(n.at)===beijingDate(now)).length,hot:hot.length};
  await fs.mkdir(output,{recursive:true});await fs.cp(path.join(root,"web"),output,{recursive:true});
  await write(path.join(output,"data/news.json"),{status,items,hot,categories:CATEGORIES.map(c=>({key:c.key,label:c.label})),topics});
  await write(path.join(output,"data/steam.json"),steam);
  await write(path.join(output,"data/mobile.json"),mobile.charts.map(({games,...c}:any)=>c));
  for(const chart of mobile.charts)await write(path.join(output,"data/charts",chart.id+".json"),chart);
  const groups=new Map<string,any>();
  for(const chart of mobile.charts)for(const game of chart.games){const source=chart.source==="App Store"?"apple":"tap",key=`${source}-${chart.market}-${game.id}`;
    if(!groups.has(key)){const profile=source==="apple"?profiles.games[game.id]??null:null;groups.set(key,{game,market:chart.market,marketName:chart.marketName,platform:chart.platform,source:chart.source,profile,
      website:source==="apple"?(VERIFIED_GAME_WEBSITES[game.id]?{url:VERIFIED_GAME_WEBSITES[game.id],kind:"official"}:registeredWebsite(profile)):{url:game.url,kind:"store"},rankings:[]});}
    groups.get(key).rankings.push({chartId:chart.id,category:chart.categoryName,metric:chart.metricName,rank:game.rank,sourceRank:game.sourceRank,capturedAt:chart.capturedAt});
  }
  for(const [key,value] of groups)await write(path.join(output,"data/games",key+".json"),value);
  const next={version:1,news:items,steam,mobile,profiles,validators};await write(path.join(output,"data/state.json"),next);await write(path.join(data,"state.json"),next);
  // Small real news history is persisted by CI, without checking bulky per-run artifacts into Git.
  await write(path.join(data,"news.json"),items);await write(path.join(output,"data/status.json"),status);
  await fs.writeFile(path.join(output,".nojekyll"),"");
  console.log(JSON.stringify({...status,steam:steam.games.length,mobileCharts:mobile.charts.length,gameDetails:groups.size}));
  return status;
}
if(process.argv.includes("--build"))await build();
