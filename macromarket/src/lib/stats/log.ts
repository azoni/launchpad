/**
 * Server-side activity logging for the public /stats dashboard.
 * Persists AI-coach usage to Firestore so cost/usage is visible in-app (in
 * addition to the fire-and-forget portfolio MCP feed). Never throws — logging
 * must never break a chat.
 */
import { FieldValue } from "firebase-admin/firestore";
import { priceUSD } from "@/lib/claude/cost";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

export async function logChat(args: {
  prompt: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}): Promise<void> {
  try {
    const db = getAdminDb();
    if (!db) return;
    const costUSD = Number(
      priceUSD(args.model, args.inputTokens, args.outputTokens).toFixed(6),
    );
    await db.collection(COLLECTIONS.chatLogs).add({
      prompt: args.prompt.slice(0, 300),
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      totalTokens: args.inputTokens + args.outputTokens,
      costUSD,
      ts: FieldValue.serverTimestamp(),
    });
  } catch {
    /* never fail a chat because of logging */
  }
}
