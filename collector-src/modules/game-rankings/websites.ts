import type { StoreGameProfile } from "./store-details.ts";

/** Official game pages checked on 2026-11-05; evidence and browser results are in validation/game-website-coverage.json.
 * App IDs identify editions; do not infer websites from translated names. */
export const VERIFIED_GAME_WEBSITES:Record<string,string>={
  "6739554056":"https://www.kingshot.com/",
  "6443575749":"https://whiteoutsurvival.centurygames.com/",
  "6448786147":"https://www.lastwar.com/en/main.html",
  "6737595599":"https://www.foundation.game/en",
  "529479190":"https://supercell.com/en/games/clashofclans/",
  "1274132545":"https://totalbattle.com/en/",
  "6670441558":"https://darkwar-survival.com/#/en/news",
  "1098157959":"https://m.evony.com/",
  "1376515087":"https://www.ageoforiginsgame.com/",
  "6738109752":"https://tilessurvive.com/en",
  "1642607669":"https://gotdragonfire.com/en-US/",
  "1354260888":"https://rok.lilith.com/",
  "6446389130":"https://www.37games.com/pncofficial/",
  "1510997559":"https://www.playsupremacy.com/en/games/world-war-3",
  "1071744151":"https://www.camelgames-wao.com/",
  "1487451427":"https://infinitykingdom.gtarcade.com/",
  "1342290011":"https://ls.im30.com/",
  "6476261995":"https://www.ageofempires.com/games/aoem/age-of-empires-mobile/",
  "1035712810":"https://www.gotconquest.com/",
  "1479198816":"https://www.rivergame.net/en/default.html",
  "6478492012":"https://wjdr.cn/",
  "1474572440":"https://sgzzlb.lingxigames.com/",
  "909211092":"https://stzb.163.com/",
  "1595603316":"https://coc.qq.com/",
  "6466232155":"https://www.biligame.com/detail/?id=110267",
  "1234954076":"https://hongjing.qq.com/cp/a20220518ydy/",
  "1519945981":"https://rok-cn.lilith.com/",
  "1232104244":"https://slg.qq.com/",
};

export interface RegisteredWebsite { url:string; kind:"developer"|"support"|"community" }
/** Apple sellerUrl is a developer-declared URL, not proof of a dedicated game homepage. */
export function registeredWebsite(profile:StoreGameProfile|null):RegisteredWebsite|null {
  if(!profile?.developerUrl)return null;
  let u:URL;
  try{u=new URL(profile.developerUrl);}catch{return null;}
  if(!["https:","http:"].includes(u.protocol)||u.username||u.password)return null;
  const host=u.hostname.toLowerCase();
  if(!host.includes(".")||host.endsWith(".localhost")||/^[\d.]+$/.test(host))return null;
  // These are stores, downloads or legal documents, not developer website entrances.
  if(["apps.apple.com","itunes.apple.com","play.google.com"].includes(host))return null;
  if(/\.(?:apk|exe|dmg|zip|pdf)$/i.test(u.pathname)||/(?:^|[/_-])(?:privacy|eula|terms)(?:[/_.-]|$)/i.test(u.pathname))return null;
  const community=["facebook.com","twitter.com","x.com","discord.com","discord.gg","youtube.com","youtu.be","weibo.com","bilibili.com","reddit.com","vk.com"];
  const kind=community.some(h=>host===h||host.endsWith("."+h))?"community":
    /(?:^|[./_-])(?:g?support|help|faq|contact|zendesk)(?:[./_-]|$)/i.test(host+u.pathname)?"support":"developer";
  return {url:u.href,kind};
}
