import type { MobileChart } from "./mobile-contracts.ts";

// Editorial gameplay list checked against these apps' official App Store descriptions on 2026-11-05.
// Scope: persistent base/city development plus armies, territory or alliance warfare, including hybrid games.
// Each app ID links to the publisher-provided store description; this is not Apple's own SLG taxonomy.
export const SLG_GAMES = [
  ["6739554056","Kingshot","城建、联盟、领地战争"],
  ["6443575749","Whiteout Survival","城镇、资源与联盟发展"],
  ["6448786147","Last War:Survival","基地、军队与玩家联盟"],
  ["529479190","Clash of Clans","村庄建设、部落战争"],
  ["1274132545","Total Battle: War Strategy","城堡建设、军事与领土征服"],
  ["6670441558","Dark War:Survival","避难所发展、资源与联盟"],
  ["1098157959","Evony","城市、军队与联盟战争"],
  ["1376515087","Age of Origins","城市恢复、军队与联盟"],
  ["6738109752","Tiles Survive!","领地、建筑与联盟"],
  ["1642607669","Game of Thrones: Dragonfire","王国建设、联盟与战略战争"],
  ["6737595599","Foundation: Galactic Frontier","舰队经营与星际联盟战争"],
  ["1354260888","Rise of Kingdoms","城市、自由行军与联盟领土"],
  ["6446389130","Puzzles & Chaos: Frozen Castle","城堡发展与联盟战争，含三消玩法"],
  ["1510997559","Supremacy: World War 3","国家经营、经济与领土战争"],
  ["1071744151","War and Order","城建、军队与联盟"],
  ["1487451427","Infinity Kingdom","城市发展与玩家领土战争"],
  ["1342290011","Last Shelter: Survival","基地建设、军队与联盟战争"],
  ["6476261995","Age of Empires Mobile","资源、帝国建设与联盟"],
  ["1035712810","Game of Thrones: Conquest","王国建设、联盟与领土战争"],
  ["1479198816","Top War: Battle Game","基地发展、军队与跨服战争"],
  ["6478492012","无尽冬日","城镇发展与联盟战争"],
  ["1474572440","三国志·战略版","历史战争沙盘与同盟攻城"],
  ["909211092","率土之滨","自由战争沙盘与同盟"],
  ["1595603316","部落冲突（中国大陆）","村庄建设、部落战争"],
  ["6748045272","向末日开炮","大世界 SLG、联盟与领地扩张"],
  ["6466232155","三国：谋定天下","多职业战争策略沙盘"],
  ["1234954076","红警OL","基地科技与世界联盟战争"],
  ["1519945981","万国觉醒","沙盘探索、城市与联盟军团"],
  ["1232104244","乱世王者","城建发展与联盟战争"],
] as const;
const slgIds=new Set<string>(SLG_GAMES.map(g=>g[0]));
export function deriveSlgChart(parent:MobileChart):MobileChart|null {
  if(parent.source!=="App Store"||parent.category!=="strategy")return null;
  const games=parent.games.filter(g=>slgIds.has(g.id)).map((g,i)=>({...g,rank:i+1,sourceRank:g.rank,tags:["SLG"]}));
  if(!games.length)return null;
  return {...parent,id:`apple-${parent.market}-slg-${parent.metric}`,category:"slg",categoryName:"SLG",games,count:games.length,
    description:`SLG 观察榜：从 Apple ${parent.marketName}区策略${parent.metricName}前 50 名中，筛选已核对城建、基地发展、联盟或领地战争玩法的游戏（含混合玩法），按原榜顺序重新编号；每行保留官方策略榜名次。名单于 2026-11-05 核对，样本可能不完整，非 Apple 独立 SLG 榜，不代表具体收入或下载量。`};
}
