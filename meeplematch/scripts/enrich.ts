/**
 * Enrich script: Searches Amazon for games missing images and updates with real data.
 * Usage: npx tsx scripts/enrich.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { searchItems, getItems } = await import("../src/lib/amazon/client");
  const { affiliateUrl } = await import("../src/lib/amazon/asin");
  const { adminDb } = await import("../src/lib/firebase/admin");
  const { FieldValue } = await import("firebase-admin/firestore");

  // Get all products missing images
  const snap = await adminDb.collection("products").where("active", "==", true).get();
  const allProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const needsEnrich = allProducts.filter(
    (p: any) => !p.images || p.images.length === 0 || !p.rating
  );

  console.log(`${needsEnrich.length} of ${allProducts.length} products need enrichment`);

  let updated = 0;
  let failed = 0;

  for (const product of needsEnrich) {
    const title = (product as any).title as string;
    console.log(`Searching: "${title}"...`);

    try {
      const results = await searchItems(title + " board game", "ToysAndGames");

      if (results.length === 0) {
        // Try broader search
        const broader = await searchItems(title, "All");
        if (broader.length === 0) {
          console.log(`  No results for "${title}"`);
          failed++;
          continue;
        }
        results.push(...broader);
      }

      // Pick best match - prefer one with images and rating
      const best = results.find((r) => r.images.length > 0 && r.rating)
        ?? results.find((r) => r.images.length > 0)
        ?? results[0];

      if (!best || !best.asin) {
        console.log(`  No usable result for "${title}"`);
        failed++;
        continue;
      }

      const updateData: Record<string, any> = {
        updatedAt: FieldValue.serverTimestamp(),
        lastAmazonSync: FieldValue.serverTimestamp(),
      };

      if (best.images.length > 0) updateData.images = best.images;
      if (best.rating != null) updateData.rating = best.rating;
      if (best.reviewCount != null) updateData.reviewCount = best.reviewCount;
      if (best.featureBullets.length > 0) updateData.featureBullets = best.featureBullets;
      if (best.savingsPercent != null) {
        updateData.savingsPercent = best.savingsPercent;
        updateData.savingsDisplay = best.savingsDisplay;
        updateData.isOnSale = best.savingsPercent >= 10;
      }
      if (best.availability) updateData.availability = best.availability;

      // If the ASIN changed, update affiliate URL but keep the old doc ID
      if (best.asin !== product.id) {
        updateData.affiliateUrl = affiliateUrl(best.asin);
        console.log(`  Found as ${best.asin} (was ${product.id}): ${best.title}`);
      } else {
        updateData.affiliateUrl = affiliateUrl(best.asin);
        console.log(`  Updated: ${best.title}`);
      }

      await adminDb.collection("products").doc(product.id).update(updateData);
      updated++;
    } catch (e) {
      console.error(`  Error for "${title}":`, e);
      failed++;
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 1600));
  }

  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);
}

main().catch(console.error);
