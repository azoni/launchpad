import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLLECTIONS, PROJECT_ID } from "../lib/collections";
import type { Wallet, ChainId } from "../types";
import { logAudit } from "./auditLog";

const colRef = () => collection(db, COLLECTIONS.wallets);

export function subscribeWallets(cb: (wallets: Wallet[]) => void) {
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  return onSnapshot(q, (snap) => {
    const list: Wallet[] = snap.docs.map((d) => ({ ...(d.data() as Wallet), id: d.id }));
    list.sort((a, b) => a.createdAt - b.createdAt);
    cb(list);
  });
}

export async function listWallets(): Promise<Wallet[]> {
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Wallet), id: d.id }));
}

export async function addWallet(input: {
  address: string;
  chain: ChainId;
  label: string;
  isOwned: boolean;
}): Promise<Wallet> {
  const id = crypto.randomUUID();
  const wallet: Wallet = {
    id,
    projectId: PROJECT_ID,
    address: input.address.trim(),
    chain: input.chain,
    label: input.label.trim() || "Unlabeled wallet",
    isOwned: input.isOwned,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, COLLECTIONS.wallets, id), wallet);
  await logAudit({
    actionType: "wallet_added",
    targetId: id,
    after: wallet,
  });
  return wallet;
}

export async function removeWallet(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.wallets, id));
  await logAudit({ actionType: "wallet_removed", targetId: id });
}
