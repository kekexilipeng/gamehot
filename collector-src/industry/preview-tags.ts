// Conservative rules for raw preview data only. The production worker uses model structure extraction.
import { ENTITIES } from "./taxonomy.ts";

export function previewCategory(title: string, summary: string, sourceId: string): string {
  if (/版号|监管|法规|征求意见|隐私政策|商店规则|审批|regulat|legislat|\blawsuit\b|store polic|approvals|age.verification|age.rating|antitrust/i.test(title)) return "policy";
  if (/采访|访谈|复盘|深度分析|\binterview\b|\banalysis\b|post.?mortem|lessons learned|making of|behind the scenes/i.test(title)) return "insights";
  if (/教程|开发指南|\btutorial\b|\bhow\b/i.test(title) && /研发|开发|设计|制作|develop|design|render|engine|Godot|Unity|Unreal/i.test(`${title} ${summary}`)) return "insights";
  if (/融资|收购|并购|裁员|财报|工作室关闭|hiring freeze|\bunion\b|bidder|acqui[rs]|layoff|shut.*studio|studio.*clos|funding|earnings|financial results/i.test(title)) return "industry";
  if (/发行|出海|运营|停服|销量|营收|下载榜|商业化|publishing|publisher|top downloads|sales|revenue|monetization|retention|user acquisition|marketing|locali[sz]ation|shutting down|sunset/i.test(title)) return "publishing";
  if (sourceId === "rss-godot" || sourceId === "rss-unity") return "technology";
  if (/渲染|游戏引擎|开发工具|\bSDK\b|\bUnity\b|\bGodot\b|Unreal Engine|ray tracing|rendering|netcode|game engine/i.test(title)) return "technology";
  return sourceId === "rss-gamesindustry" ? "industry" : "games";
}

export function previewTags(title: string, summary: string, category: string): string[] {
  const text = `${title} ${summary}`;
  const tags = new Set<string>(["原始信源预览"]);
  for (const [id, entity] of Object.entries(ENTITIES)) {
    const named = entity.aliases.some(alias => {
      if (alias === "Epic") return false;
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(/^[\x00-\x7f]+$/.test(alias) ? `(?<![a-z0-9_])${escaped}(?![a-z0-9_])` : escaped, "i").test(title);
    });
    if (named) { tags.add(`entity:${id}`); if (entity.displayTag) tags.add(entity.displayTag); }
  }
  const rules: Array<[string, RegExp]> = [
    ["PC游戏", /\bPC\b|\bSteam\b|Windows|桌面|电脑游戏/i],
    ["主机游戏", /\b(?:PS4|PS5|Xbox|PlayStation|Nintendo|Switch)\b|主机游戏/i],
    ["移动游戏", /移动端|移动游戏|手游|(?:Android|iOS|mobile) gam/i],
    ["独立游戏", /独立(?:游戏|开发)|\bindie\b|independent developers/i],
    ["游戏出海", /游戏出海|海外发行|global publishing|international publishing|locali[sz]ation|海外市场/i],
    ["买量营销", /买量|营销|user acquisition|marketing|advertis/i],
    ["游戏引擎", /Godot|\bUnity\b|Unreal Engine|虚幻引擎|游戏引擎/i],
    ["图形渲染", /渲染|rendering|ray tracing|光线追踪/i],
    ["联机服务", /联机|multiplayer|cross.play|跨平台联机|netcode|networking/i],
    ["商业化", /商业化|付费|订阅|monetization|subscription/i],
    ["电竞", /电竞|esports/i],
    ["用户增长", /用户增长|留存|retention|user acquisition|player growth|active users/i],
    ["IP改编", /IP改编|adaptation|改编游戏/i],
  ];
  for (const [tag, rule] of rules) if (rule.test(text)) tags.add(tag);
  if (/(?:\bAI\b|人工智能)/i.test(text) && /游戏|\bgame\b|\bNPC\b/i.test(text)) tags.add("游戏AI");
  let genre = category === "policy" ? "政策/监管" : category === "publishing" ? "发行运营" : category === "insights" ? "观点分析" : category === "industry" ? "行业动态" : category === "technology" && /Godot|Unity|Unreal|engine|开发工具/i.test(title) ? "研发工具" : "其他";
  if (/采访|访谈|复盘|分析|\banalysis\b|\binterview\b/i.test(title)) genre = "观点分析";
  else if (/教程|指南|\bhow\b|\btutorial\b|制作过程/i.test(title) && /研发|开发|设计|制作|develop|design|render|engine|Godot|Unity|Unreal/i.test(text)) genre = "教程/实践";
  else if (/销量|营收|下载榜|top downloads|revenue|sales figures/i.test(title)) genre = "市场数据";
  else if (/政策|版号|审批|approvals|regulation|store polic/i.test(title)) genre = "政策/监管";
  else if (/发行|publishing/i.test(title)) genre = "发行运营";
  else if (/论文|研究|调查|\bresearch\b|\bstudy\b|\bsurvey\b/i.test(title)) genre = "论文/研究";
  else if (/开源|open.source|source code available/i.test(title)) genre = "开源/仓库";
  else if (/工作室|收购|裁员|\bstudio\b|bidder|acquis|hiring freeze|\bunion\b/i.test(title)) genre = "行业动态";
  else if (category === "games") {
    if (/测试|beta|playtest|抢先体验/i.test(title)) genre = "游戏测试";
    else if (/公布|宣布|announc/i.test(title)) genre = "新作公布";
    else if (/现已.*发售|今日发布|now available|launch(?:es)? (?:today|now)/i.test(title)) genre = "新作发布";
    else if (/更新|\bupdate\b|\bDLC\b|资料片/i.test(title)) genre = "版本更新";
  }
  return [genre, ...tags];
}
