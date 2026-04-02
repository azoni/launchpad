/**
 * Seed script: Populates Firestore with board game data + Amazon enrichment.
 * Usage: npx tsx scripts/seed.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

interface GameSeed {
  asin: string;
  title: string;
  slug: string;
  playerCountMin: number;
  playerCountMax: number;
  bestPlayerCount: number | null;
  playTimeMin: number;
  playTimeMax: number;
  complexity: number;
  ageMin: number;
  cooperative: boolean;
  partyFriendly: boolean;
  familyFriendly: boolean;
  themes: string[];
  mechanics: string[];
  bggId: number | null;
  bggRank: number | null;
}

// Curated board game catalog with hand-coded attributes
const GAMES: GameSeed[] = [
  { asin: "B01IPUGYK6", title: "Gloomhaven", slug: "gloomhaven", playerCountMin: 1, playerCountMax: 4, bestPlayerCount: 3, playTimeMin: 60, playTimeMax: 150, complexity: 3.86, ageMin: 14, cooperative: true, partyFriendly: false, familyFriendly: false, themes: ["strategy", "thematic", "cooperative"], mechanics: ["Hand Management", "Campaign", "Dungeon Crawl"], bggId: 174430, bggRank: 2 },
  { asin: "B01DRGNNTM", title: "Terraforming Mars", slug: "terraforming-mars", playerCountMin: 1, playerCountMax: 5, bestPlayerCount: 3, playTimeMin: 90, playTimeMax: 120, complexity: 3.24, ageMin: 12, cooperative: false, partyFriendly: false, familyFriendly: false, themes: ["strategy"], mechanics: ["Card Drafting", "Hand Management", "Tile Placement"], bggId: 167791, bggRank: 4 },
  { asin: "B010MH2EQ8", title: "Scythe", slug: "scythe", playerCountMin: 1, playerCountMax: 5, bestPlayerCount: 4, playTimeMin: 90, playTimeMax: 120, complexity: 3.44, ageMin: 14, cooperative: false, partyFriendly: false, familyFriendly: false, themes: ["strategy", "area-control"], mechanics: ["Area Control", "Engine Building", "Variable Player Powers"], bggId: 169786, bggRank: 15 },
  { asin: "B079GHSQBR", title: "7 Wonders Duel", slug: "7-wonders-duel", playerCountMin: 2, playerCountMax: 2, bestPlayerCount: 2, playTimeMin: 30, playTimeMax: 30, complexity: 2.23, ageMin: 10, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["strategy", "civilization"], mechanics: ["Card Drafting", "Set Collection"], bggId: 173346, bggRank: 10 },
  { asin: "B07XJRFHQD", title: "Wingspan", slug: "wingspan", playerCountMin: 1, playerCountMax: 5, bestPlayerCount: 3, playTimeMin: 40, playTimeMax: 70, complexity: 2.45, ageMin: 10, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["strategy", "animals"], mechanics: ["Engine Building", "Card Drafting", "Dice Rolling"], bggId: 266192, bggRank: 22 },
  { asin: "B00U26V4VQ", title: "Spirit Island", slug: "spirit-island", playerCountMin: 1, playerCountMax: 4, bestPlayerCount: 2, playTimeMin: 90, playTimeMax: 120, complexity: 4.05, ageMin: 13, cooperative: true, partyFriendly: false, familyFriendly: false, themes: ["strategy", "cooperative", "thematic"], mechanics: ["Hand Management", "Variable Player Powers", "Area Control"], bggId: 162886, bggRank: 12 },
  { asin: "B078TGQSP5", title: "Azul", slug: "azul", playerCountMin: 2, playerCountMax: 4, bestPlayerCount: 2, playTimeMin: 30, playTimeMax: 45, complexity: 1.78, ageMin: 8, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["abstract", "family"], mechanics: ["Pattern Building", "Tile Placement", "Set Collection"], bggId: 233078, bggRank: 36 },
  { asin: "B01KVTLBFM", title: "Codenames", slug: "codenames", playerCountMin: 2, playerCountMax: 8, bestPlayerCount: 6, playTimeMin: 15, playTimeMax: 15, complexity: 1.30, ageMin: 14, cooperative: false, partyFriendly: true, familyFriendly: true, themes: ["party", "word-game", "deduction"], mechanics: ["Team-Based", "Communication Limits", "Push Your Luck"], bggId: 178900, bggRank: 75 },
  { asin: "B076QR54Y7", title: "Mysterium", slug: "mysterium", playerCountMin: 2, playerCountMax: 7, bestPlayerCount: 5, playTimeMin: 42, playTimeMax: 42, complexity: 1.90, ageMin: 10, cooperative: true, partyFriendly: true, familyFriendly: true, themes: ["party", "cooperative", "deduction", "thematic"], mechanics: ["Pattern Recognition", "Communication Limits"], bggId: 181304, bggRank: 127 },
  { asin: "B07W3PJTL2", title: "Just One", slug: "just-one", playerCountMin: 3, playerCountMax: 7, bestPlayerCount: 5, playTimeMin: 20, playTimeMax: 20, complexity: 1.00, ageMin: 8, cooperative: true, partyFriendly: true, familyFriendly: true, themes: ["party", "cooperative", "word-game"], mechanics: ["Communication Limits", "Voting"], bggId: 254640, bggRank: 93 },
  { asin: "B00409AW00", title: "Pandemic", slug: "pandemic", playerCountMin: 2, playerCountMax: 4, bestPlayerCount: 4, playTimeMin: 45, playTimeMax: 45, complexity: 2.42, ageMin: 8, cooperative: true, partyFriendly: false, familyFriendly: true, themes: ["cooperative", "strategy"], mechanics: ["Action Points", "Hand Management", "Set Collection", "Variable Player Powers"], bggId: 30549, bggRank: 80 },
  { asin: "B0002TV2LU", title: "Catan", slug: "catan", playerCountMin: 3, playerCountMax: 4, bestPlayerCount: 4, playTimeMin: 60, playTimeMax: 120, complexity: 2.32, ageMin: 10, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["strategy", "family", "negotiation"], mechanics: ["Dice Rolling", "Trading", "Route Building", "Modular Board"], bggId: 13, bggRank: 305 },
  { asin: "B004U5R5BI", title: "7 Wonders", slug: "7-wonders", playerCountMin: 2, playerCountMax: 7, bestPlayerCount: 4, playTimeMin: 30, playTimeMax: 30, complexity: 2.33, ageMin: 10, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["strategy", "civilization"], mechanics: ["Card Drafting", "Simultaneous Action"], bggId: 68448, bggRank: 78 },
  { asin: "B005N57CNU", title: "Dominion", slug: "dominion", playerCountMin: 2, playerCountMax: 4, bestPlayerCount: 3, playTimeMin: 30, playTimeMax: 30, complexity: 2.36, ageMin: 13, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["strategy", "card-game"], mechanics: ["Deck Building", "Hand Management"], bggId: 36218, bggRank: 72 },
  { asin: "B00000DMFN", title: "Ticket to Ride", slug: "ticket-to-ride", playerCountMin: 2, playerCountMax: 5, bestPlayerCount: 4, playTimeMin: 30, playTimeMax: 60, complexity: 1.83, ageMin: 8, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["family"], mechanics: ["Set Collection", "Route Building", "Hand Management"], bggId: 9209, bggRank: 120 },
  { asin: "B00005N5PF", title: "Carcassonne", slug: "carcassonne", playerCountMin: 2, playerCountMax: 5, bestPlayerCount: 2, playTimeMin: 30, playTimeMax: 45, complexity: 1.91, ageMin: 7, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["family", "medieval"], mechanics: ["Tile Placement", "Area Control"], bggId: 822, bggRank: 144 },
  { asin: "B004OA4UMI", title: "Dixit", slug: "dixit", playerCountMin: 3, playerCountMax: 8, bestPlayerCount: 6, playTimeMin: 30, playTimeMax: 30, complexity: 1.23, ageMin: 8, cooperative: false, partyFriendly: true, familyFriendly: true, themes: ["party", "family"], mechanics: ["Storytelling", "Voting", "Hand Management"], bggId: 39856, bggRank: 200 },
  { asin: "B00TU7WROO", title: "Splendor", slug: "splendor", playerCountMin: 2, playerCountMax: 4, bestPlayerCount: 3, playTimeMin: 30, playTimeMax: 30, complexity: 1.79, ageMin: 10, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["strategy", "family"], mechanics: ["Set Collection", "Engine Building"], bggId: 148228, bggRank: 115 },
  { asin: "B00GXHJ1S8", title: "Patchwork", slug: "patchwork", playerCountMin: 2, playerCountMax: 2, bestPlayerCount: 2, playTimeMin: 15, playTimeMax: 30, complexity: 1.61, ageMin: 8, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["abstract", "puzzle"], mechanics: ["Tile Placement", "Time Track"], bggId: 163412, bggRank: 64 },
  { asin: "B00VX4IRGY", title: "Onitama", slug: "onitama", playerCountMin: 2, playerCountMax: 2, bestPlayerCount: 2, playTimeMin: 15, playTimeMax: 20, complexity: 1.73, ageMin: 8, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["abstract", "strategy"], mechanics: ["Grid Movement", "Hand Management"], bggId: 160477, bggRank: 157 },
  { asin: "B071LHBS2P", title: "Sushi Go Party!", slug: "sushi-go-party", playerCountMin: 2, playerCountMax: 8, bestPlayerCount: 5, playTimeMin: 20, playTimeMax: 20, complexity: 1.29, ageMin: 8, cooperative: false, partyFriendly: true, familyFriendly: true, themes: ["party", "family", "card-game"], mechanics: ["Card Drafting", "Set Collection", "Simultaneous Action"], bggId: 192291, bggRank: 134 },
  { asin: "B07DFNSSDF", title: "Gaia Project", slug: "gaia-project", playerCountMin: 1, playerCountMax: 4, bestPlayerCount: 3, playTimeMin: 60, playTimeMax: 150, complexity: 4.37, ageMin: 14, cooperative: false, partyFriendly: false, familyFriendly: false, themes: ["strategy"], mechanics: ["Area Control", "Network Building", "Variable Player Powers"], bggId: 220308, bggRank: 14 },
  { asin: "B07KTPMNHT", title: "Brass: Birmingham", slug: "brass-birmingham", playerCountMin: 2, playerCountMax: 4, bestPlayerCount: 3, playTimeMin: 60, playTimeMax: 120, complexity: 3.91, ageMin: 14, cooperative: false, partyFriendly: false, familyFriendly: false, themes: ["strategy"], mechanics: ["Hand Management", "Network Building", "Route Building"], bggId: 224517, bggRank: 1 },
  { asin: "B08BNFY39R", title: "Cascadia", slug: "cascadia", playerCountMin: 1, playerCountMax: 4, bestPlayerCount: 3, playTimeMin: 30, playTimeMax: 45, complexity: 1.85, ageMin: 10, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["family", "animals", "puzzle"], mechanics: ["Tile Placement", "Pattern Building"], bggId: 295947, bggRank: 18 },
  { asin: "B07MKNKLPB", title: "The Crew: Quest for Planet Nine", slug: "the-crew", playerCountMin: 2, playerCountMax: 5, bestPlayerCount: 4, playTimeMin: 20, playTimeMax: 20, complexity: 2.07, ageMin: 10, cooperative: true, partyFriendly: false, familyFriendly: true, themes: ["cooperative", "card-game"], mechanics: ["Trick-Taking", "Communication Limits"], bggId: 284083, bggRank: 31 },
  { asin: "B08BNFN8YX", title: "Everdell", slug: "everdell", playerCountMin: 1, playerCountMax: 4, bestPlayerCount: 3, playTimeMin: 40, playTimeMax: 80, complexity: 2.83, ageMin: 10, cooperative: false, partyFriendly: false, familyFriendly: false, themes: ["strategy", "thematic", "animals"], mechanics: ["Worker Placement", "Hand Management", "Tableau Building"], bggId: 199792, bggRank: 24 },
  { asin: "B01BMM9K08", title: "The Quest for El Dorado", slug: "quest-for-el-dorado", playerCountMin: 2, playerCountMax: 4, bestPlayerCount: 3, playTimeMin: 30, playTimeMax: 60, complexity: 1.97, ageMin: 10, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["family", "racing"], mechanics: ["Deck Building", "Hand Management", "Racing"], bggId: 217372, bggRank: 55 },
  { asin: "B077J6MMGL", title: "Sagrada", slug: "sagrada", playerCountMin: 1, playerCountMax: 4, bestPlayerCount: 3, playTimeMin: 30, playTimeMax: 45, complexity: 1.88, ageMin: 14, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["abstract", "puzzle"], mechanics: ["Dice Drafting", "Pattern Building"], bggId: 199561, bggRank: 109 },
  { asin: "B013GRBJZM", title: "Roll for the Galaxy", slug: "roll-for-the-galaxy", playerCountMin: 2, playerCountMax: 5, bestPlayerCount: 3, playTimeMin: 30, playTimeMax: 45, complexity: 2.76, ageMin: 14, cooperative: false, partyFriendly: false, familyFriendly: false, themes: ["strategy"], mechanics: ["Dice Rolling", "Engine Building", "Simultaneous Action"], bggId: 132531, bggRank: 65 },
  { asin: "B06XBT33LF", title: "Star Realms", slug: "star-realms", playerCountMin: 2, playerCountMax: 2, bestPlayerCount: 2, playTimeMin: 20, playTimeMax: 20, complexity: 1.94, ageMin: 12, cooperative: false, partyFriendly: false, familyFriendly: false, themes: ["card-game", "strategy"], mechanics: ["Deck Building", "Hand Management"], bggId: 147020, bggRank: 112 },
  { asin: "B08BNLXZX7", title: "Marvel Champions", slug: "marvel-champions", playerCountMin: 1, playerCountMax: 4, bestPlayerCount: 2, playTimeMin: 45, playTimeMax: 90, complexity: 3.01, ageMin: 14, cooperative: true, partyFriendly: false, familyFriendly: false, themes: ["cooperative", "thematic", "card-game"], mechanics: ["Deck Construction", "Hand Management", "Variable Player Powers"], bggId: 285774, bggRank: 27 },
  { asin: "B004U5R5FY", title: "Ticket to Ride: Europe", slug: "ticket-to-ride-europe", playerCountMin: 2, playerCountMax: 5, bestPlayerCount: 4, playTimeMin: 30, playTimeMax: 60, complexity: 1.96, ageMin: 8, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["family"], mechanics: ["Set Collection", "Route Building", "Hand Management"], bggId: 14996, bggRank: 47 },
  { asin: "B004OA4UMI", title: "Dixit", slug: "dixit", playerCountMin: 3, playerCountMax: 8, bestPlayerCount: 6, playTimeMin: 30, playTimeMax: 30, complexity: 1.23, ageMin: 8, cooperative: false, partyFriendly: true, familyFriendly: true, themes: ["party", "family"], mechanics: ["Storytelling", "Voting"], bggId: 39856, bggRank: 200 },
  { asin: "B0013AMTK6", title: "Power Grid", slug: "power-grid", playerCountMin: 2, playerCountMax: 6, bestPlayerCount: 5, playTimeMin: 120, playTimeMax: 120, complexity: 3.27, ageMin: 12, cooperative: false, partyFriendly: false, familyFriendly: false, themes: ["strategy"], mechanics: ["Auction", "Network Building", "Route Building"], bggId: 2651, bggRank: 38 },
  { asin: "B001EN4TQ4", title: "Twilight Struggle", slug: "twilight-struggle", playerCountMin: 2, playerCountMax: 2, bestPlayerCount: 2, playTimeMin: 120, playTimeMax: 180, complexity: 3.58, ageMin: 13, cooperative: false, partyFriendly: false, familyFriendly: false, themes: ["strategy", "area-control"], mechanics: ["Area Control", "Card Driven", "Hand Management"], bggId: 12333, bggRank: 23 },
  { asin: "B07D4Z34GD", title: "Mansions of Madness", slug: "mansions-of-madness", playerCountMin: 1, playerCountMax: 5, bestPlayerCount: 3, playTimeMin: 120, playTimeMax: 180, complexity: 2.72, ageMin: 14, cooperative: true, partyFriendly: false, familyFriendly: false, themes: ["cooperative", "thematic"], mechanics: ["App-Driven", "Dice Rolling", "Variable Player Powers"], bggId: 205059, bggRank: 76 },
  { asin: "B0728K1GJW", title: "Arkham Horror: The Card Game", slug: "arkham-horror-lcg", playerCountMin: 1, playerCountMax: 2, bestPlayerCount: 2, playTimeMin: 60, playTimeMax: 120, complexity: 3.49, ageMin: 14, cooperative: true, partyFriendly: false, familyFriendly: false, themes: ["cooperative", "thematic", "card-game"], mechanics: ["Deck Construction", "Campaign", "Hand Management"], bggId: 205637, bggRank: 20 },
  { asin: "B07JR7D28J", title: "Wavelength", slug: "wavelength", playerCountMin: 2, playerCountMax: 12, bestPlayerCount: 6, playTimeMin: 30, playTimeMax: 45, complexity: 1.04, ageMin: 10, cooperative: false, partyFriendly: true, familyFriendly: true, themes: ["party"], mechanics: ["Team-Based", "Communication Limits", "Voting"], bggId: 262543, bggRank: 140 },
  { asin: "B00FE3P0DI", title: "Dead of Winter", slug: "dead-of-winter", playerCountMin: 2, playerCountMax: 5, bestPlayerCount: 4, playTimeMin: 60, playTimeMax: 120, complexity: 3.04, ageMin: 13, cooperative: true, partyFriendly: false, familyFriendly: false, themes: ["cooperative", "thematic"], mechanics: ["Dice Rolling", "Variable Player Powers", "Traitor"], bggId: 150376, bggRank: 168 },
  { asin: "B07H1WHGKL", title: "Azul: Stained Glass of Sintra", slug: "azul-stained-glass", playerCountMin: 2, playerCountMax: 4, bestPlayerCount: 3, playTimeMin: 30, playTimeMax: 45, complexity: 2.06, ageMin: 8, cooperative: false, partyFriendly: false, familyFriendly: true, themes: ["abstract", "family", "puzzle"], mechanics: ["Pattern Building", "Tile Placement"], bggId: 256226, bggRank: 285 },
  { asin: "B009LIO07I", title: "Caverna", slug: "caverna", playerCountMin: 1, playerCountMax: 7, bestPlayerCount: 4, playTimeMin: 30, playTimeMax: 210, complexity: 3.78, ageMin: 12, cooperative: false, partyFriendly: false, familyFriendly: false, themes: ["strategy"], mechanics: ["Worker Placement", "Tile Placement"], bggId: 102794, bggRank: 30 },
  { asin: "B000W7JWUA", title: "Twilight Imperium (Fourth Edition)", slug: "twilight-imperium-4e", playerCountMin: 3, playerCountMax: 6, bestPlayerCount: 6, playTimeMin: 240, playTimeMax: 480, complexity: 4.22, ageMin: 14, cooperative: false, partyFriendly: false, familyFriendly: false, themes: ["strategy", "area-control"], mechanics: ["Area Control", "Trading", "Variable Player Powers", "Voting"], bggId: 233867, bggRank: 8 },
  { asin: "B075DLBC5P", title: "Star Wars: Rebellion", slug: "star-wars-rebellion", playerCountMin: 2, playerCountMax: 4, bestPlayerCount: 2, playTimeMin: 180, playTimeMax: 240, complexity: 3.65, ageMin: 14, cooperative: false, partyFriendly: false, familyFriendly: false, themes: ["strategy", "thematic"], mechanics: ["Area Control", "Hand Management", "Variable Player Powers"], bggId: 187645, bggRank: 9 },
  { asin: "B003HC9734", title: "Through the Ages", slug: "through-the-ages", playerCountMin: 2, playerCountMax: 4, bestPlayerCount: 3, playTimeMin: 120, playTimeMax: 240, complexity: 4.41, ageMin: 14, cooperative: false, partyFriendly: false, familyFriendly: false, themes: ["strategy", "civilization"], mechanics: ["Card Drafting", "Hand Management", "Auction"], bggId: 182028, bggRank: 3 },
  { asin: "B01MZIGKFH", title: "The 7th Continent", slug: "the-7th-continent", playerCountMin: 1, playerCountMax: 4, bestPlayerCount: 2, playTimeMin: 60, playTimeMax: 1000, complexity: 2.90, ageMin: 14, cooperative: true, partyFriendly: false, familyFriendly: false, themes: ["cooperative", "thematic"], mechanics: ["Exploration", "Hand Management", "Campaign"], bggId: 180263, bggRank: 100 },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  const { getItems } = await import("../src/lib/amazon/client");
  const { affiliateUrl } = await import("../src/lib/amazon/asin");
  const { adminDb } = await import("../src/lib/firebase/admin");
  const { FieldValue } = await import("firebase-admin/firestore");

  // Deduplicate by ASIN
  const uniqueGames = new Map<string, GameSeed>();
  for (const game of GAMES) {
    if (!uniqueGames.has(game.asin)) {
      uniqueGames.set(game.asin, game);
    }
  }
  const games = [...uniqueGames.values()];

  console.log(`Seeding ${games.length} games...`);

  // Fetch Amazon data in batches of 10
  const amazonProducts = new Map<string, { title: string | null; rating: number | null; reviewCount: number | null; featureBullets: string[]; images: string[]; savingsPercent: number | null; savingsDisplay: string | null; availability: string | null }>();

  const allAsins = games.map((g) => g.asin);
  for (let i = 0; i < allAsins.length; i += 10) {
    const batch = allAsins.slice(i, i + 10);
    console.log(`Amazon batch ${Math.floor(i / 10) + 1}/${Math.ceil(allAsins.length / 10)}...`);
    try {
      const results = await getItems(batch);
      for (const [asin, data] of results) {
        amazonProducts.set(asin, data);
      }
    } catch (e) {
      console.error(`Batch error:`, e);
    }
    if (i + 10 < allAsins.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`Got ${amazonProducts.size} products from Amazon`);

  // Write to Firestore
  const batch = adminDb.batch();
  let count = 0;

  for (const game of games) {
    const amazon = amazonProducts.get(game.asin);
    const now = FieldValue.serverTimestamp();

    const doc = {
      asin: game.asin,
      slug: game.slug,
      title: amazon?.title ?? game.title,
      category: "board-games",
      featureBullets: amazon?.featureBullets ?? [],
      images: amazon?.images ?? [],
      rating: amazon?.rating ?? null,
      reviewCount: amazon?.reviewCount ?? null,
      savingsPercent: amazon?.savingsPercent ?? null,
      savingsDisplay: amazon?.savingsDisplay ?? null,
      isOnSale: (amazon?.savingsPercent ?? 0) >= 10,
      availability: amazon?.availability ?? null,
      affiliateUrl: affiliateUrl(game.asin),
      playerCountMin: game.playerCountMin,
      playerCountMax: game.playerCountMax,
      bestPlayerCount: game.bestPlayerCount,
      playTimeMin: game.playTimeMin,
      playTimeMax: game.playTimeMax,
      complexity: game.complexity,
      ageMin: game.ageMin,
      cooperative: game.cooperative,
      partyFriendly: game.partyFriendly,
      familyFriendly: game.familyFriendly,
      themes: game.themes,
      mechanics: game.mechanics,
      popularityScore: game.bggRank
        ? Math.max(0, 100 - Math.log10(game.bggRank) * 25)
        : 50,
      bggId: game.bggId,
      bggRank: game.bggRank,
      lastAmazonSync: amazon ? now : null,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    batch.set(adminDb.collection("products").doc(game.asin), doc);
    count++;
  }

  await batch.commit();
  console.log(`Seeded ${count} products to Firestore!`);
}

main().catch(console.error);
