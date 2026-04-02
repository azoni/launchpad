/**
 * BoardGameGeek XML API v2 fetcher.
 * Used in the seed script to get authoritative game metadata.
 */

interface BggGameData {
  bggId: number;
  title: string;
  slug: string;
  playerCountMin: number;
  playerCountMax: number;
  bestPlayerCount: number | null;
  playTimeMin: number;
  playTimeMax: number;
  complexity: number;
  ageMin: number;
  themes: string[];
  mechanics: string[];
  bggRank: number | null;
}

const BGG_API = "https://boardgamegeek.com/xmlapi2";

/** Rate-limit BGG requests (be respectful — no official rate limit published). */
async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getTextContent(
  parent: string,
  tagName: string,
  attrFilter?: Record<string, string>
): string | null {
  // Simple XML parsing via regex since we're in Node without DOMParser
  const regex = attrFilter
    ? new RegExp(
        `<${tagName}[^>]*${Object.entries(attrFilter)
          .map(([k, v]) => `${k}="${v}"`)
          .join("[^>]*")}[^>]*value="([^"]*)"`,
        "i"
      )
    : new RegExp(`<${tagName}[^>]*value="([^"]*)"`, "i");
  const match = regex.exec(parent);
  return match ? match[1] : null;
}

function getAttr(xml: string, tagName: string, attr: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*${attr}="([^"]*)"`, "i");
  const match = regex.exec(xml);
  return match ? match[1] : null;
}

function getAllValues(xml: string, tagName: string, attrFilter?: Record<string, string>): string[] {
  const filterStr = attrFilter
    ? Object.entries(attrFilter)
        .map(([k, v]) => `${k}="${v}"`)
        .join("[^>]*")
    : "";
  const regex = new RegExp(
    `<${tagName}[^>]*${filterStr}[^>]*value="([^"]*)"`,
    "gi"
  );
  const results: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[1]);
  }
  return results;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Fetch game data from BGG for a list of IDs (max ~20 per request). */
export async function fetchBggGames(bggIds: number[]): Promise<BggGameData[]> {
  const results: BggGameData[] = [];

  // BGG supports batch requests with comma-separated IDs
  const batchSize = 20;
  for (let i = 0; i < bggIds.length; i += batchSize) {
    const batch = bggIds.slice(i, i + batchSize);
    const ids = batch.join(",");
    const url = `${BGG_API}/thing?id=${ids}&stats=1`;

    const res = await fetch(url);
    if (!res.ok) {
      console.error(`BGG API error: ${res.status}`);
      await sleep(5000);
      continue;
    }

    const xml = await res.text();

    // Split by <item> tags
    const itemRegex = /<item[^>]*id="(\d+)"[^>]*>([\s\S]*?)<\/item>/gi;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(xml)) !== null) {
      const bggId = parseInt(itemMatch[1], 10);
      const itemXml = itemMatch[2];

      const title =
        getTextContent(itemXml, "name", { type: "primary" }) ?? "Unknown";

      const minPlayers = parseInt(
        getAttr(itemXml, "minplayers", "value") ?? "1",
        10
      );
      const maxPlayers = parseInt(
        getAttr(itemXml, "maxplayers", "value") ?? "4",
        10
      );
      const minPlaytime = parseInt(
        getAttr(itemXml, "minplaytime", "value") ?? "30",
        10
      );
      const maxPlaytime = parseInt(
        getAttr(itemXml, "maxplaytime", "value") ?? "60",
        10
      );
      const minage = parseInt(
        getAttr(itemXml, "minage", "value") ?? "10",
        10
      );

      // Complexity (average weight)
      const weightMatch = /<averageweight[^>]*value="([^"]*)"/.exec(itemXml);
      const complexity = weightMatch ? parseFloat(weightMatch[1]) : 2.5;

      // BGG rank
      const rankMatch =
        /<rank[^>]*name="boardgame"[^>]*value="(\d+)"/.exec(itemXml);
      const bggRank = rankMatch ? parseInt(rankMatch[1], 10) : null;

      // Categories and mechanics
      const categories = getAllValues(itemXml, "link", {
        type: "boardgamecategory",
      });
      const mechanics = getAllValues(itemXml, "link", {
        type: "boardgamemechanic",
      });

      // Map categories to our theme tags
      const themes = mapBggCategoriesToThemes(categories);

      results.push({
        bggId,
        title,
        slug: slugify(title),
        playerCountMin: minPlayers,
        playerCountMax: maxPlayers,
        bestPlayerCount: null, // Would need poll data
        playTimeMin: minPlaytime,
        playTimeMax: maxPlaytime,
        complexity: Math.round(complexity * 100) / 100,
        ageMin: minage,
        themes,
        mechanics: mechanics.slice(0, 10),
        bggRank,
      });
    }

    // Respect rate limits
    if (i + batchSize < bggIds.length) {
      await sleep(2000);
    }
  }

  return results;
}

/** Map BGG categories to our standardized theme tags. */
function mapBggCategoriesToThemes(categories: string[]): string[] {
  const themeMap: Record<string, string> = {
    "Strategy Games": "strategy",
    "Economic": "strategy",
    "Wargame": "strategy",
    "Party Game": "party",
    "Humor": "party",
    "Card Game": "card-game",
    "Family Games": "family",
    "Children's Game": "family",
    "Cooperative Game": "cooperative",
    "Adventure": "thematic",
    "Fantasy": "thematic",
    "Science Fiction": "thematic",
    "Horror": "thematic",
    "Mythology": "thematic",
    "Puzzle": "puzzle",
    "Deduction": "deduction",
    "Dice": "dice",
    "Word Game": "word-game",
    "Trivia": "trivia",
    "Abstract Strategy": "abstract",
    "Territory Building": "area-control",
    "City Building": "building",
    "Civilization": "civilization",
    "Negotiation": "negotiation",
    "Racing": "racing",
    "Animals": "animals",
    "Medieval": "medieval",
    "Miniatures": "miniatures",
  };

  const themes = new Set<string>();
  for (const cat of categories) {
    const mapped = themeMap[cat];
    if (mapped) themes.add(mapped);
  }
  return [...themes];
}
