import type { StoreGameProfile, StorefrontCheck } from "./store-details.ts";
import type { RegisteredWebsite } from "./websites.ts";
export const MOBILE_MARKETS = [
  { id:"cn", name:"中国大陆", scope:"domestic" },
  { id:"us", name:"美国", scope:"overseas" },
  { id:"jp", name:"日本", scope:"overseas" },
  { id:"kr", name:"韩国", scope:"overseas" },
  { id:"tw", name:"中国台湾", scope:"overseas" },
  { id:"de", name:"德国", scope:"overseas" },
] as const;
export const APPLE_CATEGORIES = [
  { id:"all", name:"全部游戏", appleId:6014 },
  { id:"strategy", name:"策略", appleId:7017 },
  { id:"rpg", name:"RPG 角色扮演", appleId:7014 },
  { id:"action", name:"动作", appleId:7001 },
  { id:"card", name:"卡牌", appleId:7005 },
  { id:"casual", name:"休闲", appleId:7003 },
  { id:"simulation", name:"模拟经营", appleId:7015 },
  { id:"puzzle", name:"益智解谜", appleId:7012 },
  { id:"adventure", name:"冒险", appleId:7002 },
  { id:"sports", name:"体育", appleId:7016 },
  { id:"racing", name:"竞速", appleId:7013 },
  { id:"music", name:"音乐", appleId:7011 },
] as const;
export const APPLE_METRICS = [
  { id:"grossing", name:"畅销榜", feed:"topgrossingapplications" },
  { id:"free", name:"免费榜", feed:"topfreeapplications" },
  { id:"paid", name:"付费榜", feed:"toppaidapplications" },
] as const;
export interface MobileGame {
  id:string;
  name:string;
  rank:number;
  sourceRank?:number;
  publisher:string;
  image:string;
  url:string;
  tags:string[];
  priceLabel?:string;
  rating?:number;
  intro?:string;
  releaseDate?:string;
}
export interface MobileChartInfo {
  id:string;
  scope:"domestic"|"overseas";
  platform:"ios"|"android";
  market:string;
  marketName:string;
  category:string;
  categoryName:string;
  metric:string;
  metricName:string;
  source:"App Store"|"TapTap";
  sourceUrl:string;
  capturedAt:string;
  sourceUpdatedAt:string|null;
  description:string;
  count:number;
  refreshFailed:boolean;
}
export interface MobileChart extends MobileChartInfo { games:MobileGame[] }
export interface MobileSnapshot { version:1; refreshedAt:string; charts:MobileChart[] }
export interface MobileRankingPage { catalog:MobileChartInfo[]; chart:MobileChart|null }
export interface MobileGameDetail {
  game:MobileGame;
  source:"App Store"|"TapTap";
  market:string;
  marketName:string;
  platform:"ios"|"android";
  capturedAt:string;
  profile:StoreGameProfile|null;
  storefront:StorefrontCheck|null;
  officialWebsite:string|null;
  registeredWebsite:RegisteredWebsite|null;
  rankings:Array<MobileChartInfo & {rank:number;sourceRank?:number}>;
}
export function mobileGamePath(chart:Pick<MobileChartInfo,"source"|"market">,game:Pick<MobileGame,"id">){
  return `/rankings/game/${chart.source==="App Store"?"apple":"tap"}/${chart.market}/${game.id}`;
}

/** Choose only available combinations. A source without a category never gets another source's rows. */
export function chooseMobileChart(charts:MobileChartInfo[], params:URLSearchParams):MobileChartInfo|undefined {
  const scope=params.get("scope")==="overseas"?"overseas":"domestic";
  let candidates=charts.filter(c=>c.scope===scope);
  const defaults={platform:"ios",market:scope==="domestic"?"cn":"us",category:"all",metric:"grossing"};
  for(const key of ["platform","market","category","metric"] as const){
    const wanted=params.get(key)??defaults[key];
    const matches=candidates.filter(c=>c[key]===wanted);
    if(matches.length)candidates=matches;
  }
  return candidates[0];
}
export function searchMobileGames(chart:MobileChart, search:string):MobileGame[] {
  const q=search.trim().toLocaleLowerCase();
  return chart.games.filter(g=>!q||`${g.name} ${g.publisher}`.toLocaleLowerCase().includes(q));
}
