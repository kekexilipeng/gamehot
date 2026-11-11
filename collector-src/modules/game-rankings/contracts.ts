export interface RankedGame {
  appId: number;
  name: string;
  officialRank: number;
  lastWeekRank: number | null;
  peakPlayers: number;
  genres: Array<{ id: string; name: string }>;
  free: boolean;
  image: string;
  url: string;
}
export interface RankingSnapshot {
  version: 1;
  capturedAt: string;
  sourceDate: string;
  sourceUrl: string;
  games: RankedGame[];
  excludedNonGames: number;
  missingMetadata: number[];
}
export function isGameMetadata(data: { type?: string; genres?: Array<{ description?: string }> }): boolean {
  return data.type === "game" && !data.genres?.some(g => /动画制作|设计和插画|照片编辑|实用工具|软件培训|音频制作|视频制作|Utilities|Software Training|Photo Editing|Animation & Modeling/i.test(g.description ?? ""));
}
export function selectGames(snapshot: RankingSnapshot, genre: string, search: string, payment: string, order: string) {
  const q = search.trim().toLowerCase();
  return snapshot.games.filter(g =>
    (genre === "all" || g.genres.some(t => t.id === genre)) &&
    (!q || g.name.toLowerCase().includes(q)) &&
    (payment === "all" || (payment === "free" ? g.free : !g.free))
  ).sort((a,b) => order === "peak" ? b.peakPlayers-a.peakPlayers || a.officialRank-b.officialRank : a.officialRank-b.officialRank);
}
