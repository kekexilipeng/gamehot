import { mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { config } from "@aihot/backend/config";
import { beijingDate } from "@aihot/contracts/time";
import { isGameMetadata, type RankedGame, type RankingSnapshot } from "../contracts.ts";

export const CHART_URL = "https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/";
async function json(url: string): Promise<any> {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { "User-Agent": "GameHOTBot/1.0", Accept: "application/json" } });
  if (!response.ok) throw new Error(`Steam HTTP ${response.status}`);
  return response.json();
}

/** Scheduled/explicit refresh only: readers never call upstream services. */
export async function collectRankings(destination = path.join(config.dataDir, "game-rankings.json")): Promise<RankingSnapshot> {
  const source = (await json(CHART_URL)).response;
  if (!Number.isFinite(source?.rollup_date) || !Array.isArray(source.ranks) || source.ranks.length < 10) throw new Error("Steam 榜单结构无效");
  const rows = source.ranks.slice(0,100);
  const games: RankedGame[] = [];
  const missing: number[] = [];
  let excludedNonGames = 0;
  let next = 0;
  async function worker() {
    while (next < rows.length) {
      const row = rows[next++];
      const appId = Number(row.appid);
      if (!Number.isInteger(appId) || appId <= 0 || !Number.isInteger(row.rank) || !Number.isFinite(row.peak_in_game)) throw new Error("Steam 榜单条目无效");
      try {
        const result = (await json(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=schinese&cc=CN`))[appId];
        const d = result?.success && result.data;
        if (!d?.name || !Array.isArray(d.genres)) { missing.push(appId); continue; }
        if (!isGameMetadata(d)) { excludedNonGames++; continue; }
        games.push({ appId, name: d.name, officialRank: row.rank,
          lastWeekRank: Number.isInteger(row.last_week_rank) && row.last_week_rank > 0 ? row.last_week_rank : null,
          peakPlayers: row.peak_in_game, genres: d.genres.map((g: any) => ({ id: String(g.id), name: String(g.description) })),
          free: d.is_free === true, image: /^https:\/\//.test(d.header_image ?? "") ? d.header_image : "",
          url: `https://store.steampowered.com/app/${appId}/` });
      } catch { missing.push(appId); }
    }
  }
  await Promise.all([worker(),worker(),worker()]);
  if (games.length < 10) throw new Error("Steam 元数据获取不足，保留原有快照");
  games.sort((a,b) => a.officialRank-b.officialRank);
  const snapshot: RankingSnapshot = { version:1, capturedAt:new Date().toISOString(), sourceDate:beijingDate(source.rollup_date*1000),
    sourceUrl:CHART_URL, games, excludedNonGames, missingMetadata:missing.sort((a,b)=>a-b) };
  await mkdir(path.dirname(destination), { recursive:true });
  const temporary = destination+".tmp";
  await writeFile(temporary, JSON.stringify(snapshot,null,2));
  await rename(temporary,destination);
  return snapshot;
}
