// GameHOT 游戏行业分类。类别 key 与主题 slug 发布后保持稳定。
export const CATEGORIES = [
  {
    "key": "games",
    "tagColor": "indigo",
    "label": "新作动态",
    "section": "新作与版本",
    "guide": "游戏公布、测试、正式发售、重大版本、DLC、移植与延期。明确区分预告、测试、抢先体验和正式上线；普通平衡补丁不是重大更新。"
  },
  {
    "key": "publishing",
    "tagColor": "turquoise",
    "label": "发行运营",
    "section": "发行与运营",
    "guide": "发行代理、出海、本地化、商业化、用户与收入数据、重大运营调整和停服。销量、流水、收入、利润与下载量分别记录，不能互相替代。"
  },
  {
    "key": "industry",
    "tagColor": "orange",
    "label": "行业商业",
    "section": "行业与平台",
    "guide": "游戏公司财报、融资并购、裁员、工作室成立关闭、IP授权和重要合作。标注宣布、签约、获批和交割阶段。"
  },
  {
    "key": "technology",
    "tagColor": "violet",
    "label": "研发技术",
    "section": "研发与工具",
    "guide": "游戏引擎、渲染、性能、联机、制作流程、开发工具与游戏AI应用。以可复用的研发证据为重；一般AI新闻与普通硬件促销不收。"
  },
  {
    "key": "policy",
    "tagColor": "purple",
    "label": "平台政策",
    "section": "行业与平台",
    "guide": "商店分成、发行规则、平台服务、版号、未成年人保护、隐私与游戏相关监管。区分草案、正式发布和生效，保留司法辖区和适用平台。"
  },
  {
    "key": "insights",
    "tagColor": "green",
    "label": "深度观察",
    "section": "深度与复盘",
    "guide": "有数据或方法支撑的游戏市场研究、制作复盘、开发教程与行业访谈。玩家通关攻略、排行榜搬运和空泛预测不是深度行业观察。",
    "commentary": true
  }
] as const satisfies ReadonlyArray<{ key: string; tagColor: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

// 只统计正式新作发布；预告、测试和版本更新不使用此标签。
export const RELEASE: { category: string; tag: string; unit: string } | null = { category: 'games', tag: '新作发布', unit: '款新作' };
export const PLAIN_TERMS: readonly string[] = ['pc','ip','dlc','fps','rpg','mmo','moba','sdk','api','gpu','ai','ceo','ipo'];
export const ITEM_TYPES = ["game_release","product_launch","tool_or_method","research_paper","industry_event","opinion_analysis","tutorial_explainer"] as const;
export const CATEGORY_TAGS = ["新作公布","游戏测试","新作发布","移植发布","版本更新","发行运营","市场数据","行业动态","研发工具","论文/研究","教程/实践","观点分析","政策/监管","开源/仓库","其他"] as const;
export const TOPIC_TAGS = ["PC游戏","主机游戏","移动游戏","独立游戏","游戏出海","买量营销","商业化","游戏引擎","图形渲染","游戏AI","联机服务","用户增长","电竞","IP改编"] as const;
export const ENTITY_TAGS = ["腾讯","网易","米哈游","PlayStation","Xbox","任天堂","Steam","Epic Games","Unity","Godot","EA","育碧","Take-Two"] as const;
export const TAG_SYNONYMS: Readonly<Record<string,string>> = { '新游':'新作发布', 'DLC':'版本更新', '资料片':'版本更新', '融资':'行业动态', '收购':'行业动态', '裁员':'行业动态', '财报':'市场数据', '流水':'市场数据', '版号':'政策/监管', '监管':'政策/监管', '开源':'开源/仓库', '教程':'教程/实践', '复盘':'观点分析', '手游':'移动游戏', '出海':'游戏出海', 'Unreal Engine':'游戏引擎', 'UE5':'游戏引擎' };
export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[]; orgNames?: string[]; otherNames?: string[] }> = {
  "tencent": {
    "name": "腾讯游戏",
    "displayTag": "腾讯",
    "aliases": [
      "腾讯游戏",
      "腾讯",
      "Tencent Games",
      "Tencent"
    ],
    "orgNames": [
      "腾讯游戏",
      "Tencent Games",
      "腾讯"
    ]
  },
  "netease": {
    "name": "网易游戏",
    "displayTag": "网易",
    "aliases": [
      "网易游戏",
      "网易",
      "NetEase Games",
      "NetEase"
    ],
    "orgNames": [
      "网易游戏",
      "NetEase Games"
    ]
  },
  "hoyoverse": {
    "name": "米哈游 / HoYoverse",
    "displayTag": "米哈游",
    "aliases": [
      "米哈游",
      "miHoYo",
      "HoYoverse"
    ],
    "orgNames": [
      "米哈游",
      "miHoYo",
      "HoYoverse"
    ]
  },
  "sony": {
    "name": "Sony / PlayStation",
    "displayTag": "PlayStation",
    "aliases": [
      "Sony",
      "索尼",
      "PlayStation",
      "SIE"
    ],
    "orgNames": [
      "Sony Interactive Entertainment",
      "PlayStation",
      "索尼互动娱乐"
    ]
  },
  "microsoft": {
    "name": "Microsoft / Xbox",
    "displayTag": "Xbox",
    "aliases": [
      "Microsoft",
      "微软",
      "Xbox",
      "Xbox Game Studios"
    ],
    "orgNames": [
      "Microsoft",
      "Xbox",
      "微软"
    ]
  },
  "nintendo": {
    "name": "Nintendo 任天堂",
    "displayTag": "任天堂",
    "aliases": [
      "Nintendo",
      "任天堂"
    ],
    "orgNames": [
      "Nintendo",
      "任天堂"
    ]
  },
  "valve": {
    "name": "Valve / Steam",
    "displayTag": "Steam",
    "aliases": [
      "Valve",
      "Steam"
    ],
    "orgNames": [
      "Valve"
    ]
  },
  "epic": {
    "name": "Epic Games",
    "displayTag": "Epic Games",
    "aliases": [
      "Epic Games",
      "Epic",
      "Unreal Engine",
      "虚幻引擎"
    ],
    "orgNames": [
      "Epic Games"
    ]
  },
  "unity": {
    "name": "Unity",
    "displayTag": "Unity",
    "aliases": [
      "Unity",
      "Unity Technologies"
    ],
    "orgNames": [
      "Unity",
      "Unity Technologies"
    ]
  },
  "godot": {
    "name": "Godot",
    "displayTag": "Godot",
    "aliases": [
      "Godot",
      "Godot Engine",
      "Godot Foundation"
    ],
    "orgNames": [
      "Godot Foundation",
      "Godot Engine"
    ]
  },
  "ea": {
    "name": "Electronic Arts / EA",
    "displayTag": "EA",
    "aliases": [
      "Electronic Arts",
      "EA",
      "艺电"
    ],
    "orgNames": [
      "Electronic Arts",
      "EA"
    ]
  },
  "ubisoft": {
    "name": "Ubisoft 育碧",
    "displayTag": "育碧",
    "aliases": [
      "Ubisoft",
      "育碧"
    ],
    "orgNames": [
      "Ubisoft",
      "育碧"
    ]
  },
  "takeTwo": {
    "name": "Take-Two / Rockstar",
    "displayTag": "Take-Two",
    "aliases": [
      "Take-Two",
      "Take Two",
      "Rockstar Games",
      "2K Games"
    ],
    "orgNames": [
      "Take-Two Interactive",
      "Rockstar Games",
      "2K Games"
    ]
  }
};
// 用明确的机构名核对身份；游戏产品名称不自动推导发行商或母公司。
export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = Object.entries(ENTITIES).map(([id, entity]) => ({
  id, name: entity.name,
  patterns: entity.aliases.map(alias => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(/^[\x00-\x7f]+$/.test(alias) ? `(?<![a-z0-9_])${escaped}(?![a-z0-9_])` : escaped, 'i');
  }),
}));
export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  {
    "entityId": "tencent",
    "domains": [
      "tencent.com"
    ]
  },
  {
    "entityId": "netease",
    "domains": [
      "neteasegames.com"
    ]
  },
  {
    "entityId": "hoyoverse",
    "domains": [
      "hoyoverse.com",
      "mihoyo.com"
    ]
  },
  {
    "entityId": "sony",
    "domains": [
      "playstation.com"
    ]
  },
  {
    "entityId": "microsoft",
    "domains": [
      "news.xbox.com"
    ]
  },
  {
    "entityId": "nintendo",
    "domains": [
      "nintendo.com"
    ]
  },
  {
    "entityId": "valve",
    "domains": [
      "steampowered.com",
      "steamcommunity.com"
    ]
  },
  {
    "entityId": "epic",
    "domains": [
      "epicgames.com",
      "unrealengine.com"
    ]
  },
  {
    "entityId": "unity",
    "domains": [
      "unity.com"
    ]
  },
  {
    "entityId": "godot",
    "domains": [
      "godotengine.org"
    ]
  },
  {
    "entityId": "ea",
    "domains": [
      "ea.com"
    ]
  },
  {
    "entityId": "ubisoft",
    "domains": [
      "ubisoft.com"
    ]
  },
  {
    "entityId": "takeTwo",
    "domains": [
      "take2games.com",
      "rockstargames.com"
    ]
  }
];
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [];
