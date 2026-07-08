"use client";
import { useEffect, useRef } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { C } from "@/lib/firebase/collections";
import {
  DEFAULT_VIEW,
  normalizeView,
  type DeficiencyView,
  type SavedPreset,
} from "@/lib/deficiencies-view";

/**
 * Per-inspector UI preferences. Persisted to localStorage (instant) via zustand, and mirrored
 * to Firestore under workspaces/{id}/meta/prefs (cross-device) by useDeficiencyPrefsSync.
 * `updatedAt` stamps every local change so the sync layer can do last-write-wins instead of
 * blindly letting a stale remote doc clobber a newer local edit.
 */

type PrefsState = {
  deficiencyView: DeficiencyView;
  savedPresets: SavedPreset[];
  defaultPresetId: string | null;
  updatedAt: number;
  setView: (v: DeficiencyView) => void;
  patchView: (p: Partial<DeficiencyView>) => void;
  savePreset: (name: string) => void;
  applyPreset: (id: string) => void;
  setDefaultPreset: (id: string | null) => void;
  deletePreset: (id: string) => void;
  resetView: () => void;
  hydrate: (data: Partial<Pick<PrefsState, "deficiencyView" | "savedPresets" | "defaultPresetId" | "updatedAt">>) => void;
};

const clone = (v: DeficiencyView): DeficiencyView => JSON.parse(JSON.stringify(v));
const newId = () => `p_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e4).toString(36)}`;
const normalizePresets = (ps: SavedPreset[]): SavedPreset[] =>
  ps.filter(Boolean).map((p) => ({ ...p, view: normalizeView(p.view) }));

export const useDeficiencyPrefs = create<PrefsState>()(
  persist(
    (set, get) => ({
      deficiencyView: DEFAULT_VIEW,
      savedPresets: [],
      defaultPresetId: null,
      updatedAt: 0,

      setView: (v) => set({ deficiencyView: normalizeView(v), updatedAt: Date.now() }),
      patchView: (p) =>
        set({ deficiencyView: normalizeView({ ...get().deficiencyView, ...p }), updatedAt: Date.now() }),

      savePreset: (name) =>
        set((s) => ({
          savedPresets: [
            ...s.savedPresets,
            { id: newId(), name: name.trim() || "Untitled view", view: clone(s.deficiencyView) },
          ],
          updatedAt: Date.now(),
        })),

      applyPreset: (id) => {
        const p = get().savedPresets.find((x) => x.id === id);
        if (p) set({ deficiencyView: normalizeView(p.view), updatedAt: Date.now() });
      },

      setDefaultPreset: (id) => set({ defaultPresetId: id, updatedAt: Date.now() }),

      deletePreset: (id) =>
        set((s) => ({
          savedPresets: s.savedPresets.filter((p) => p.id !== id),
          defaultPresetId: s.defaultPresetId === id ? null : s.defaultPresetId,
          updatedAt: Date.now(),
        })),

      resetView: () => {
        const { defaultPresetId, savedPresets } = get();
        const def = defaultPresetId ? savedPresets.find((p) => p.id === defaultPresetId) : null;
        set({ deficiencyView: def ? normalizeView(def.view) : DEFAULT_VIEW, updatedAt: Date.now() });
      },

      hydrate: (data) =>
        set((s) => ({
          deficiencyView: data.deficiencyView ? normalizeView(data.deficiencyView) : s.deficiencyView,
          savedPresets: Array.isArray(data.savedPresets) ? normalizePresets(data.savedPresets) : s.savedPresets,
          defaultPresetId: data.defaultPresetId ?? s.defaultPresetId,
          updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : s.updatedAt,
        })),
    }),
    { name: "pyroguard-prefs" }
  )
);

/**
 * Loads prefs from Firestore on workspace change and writes local changes back (debounced).
 * Last-write-wins by `updatedAt` so a stale remote doc can't revert a newer local edit (or a
 * deep-linked filter that was just applied). Call once from the deficiencies page.
 */
export function useDeficiencyPrefsSync(workspaceId: string | null) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    loaded.current = false;
    if (!workspaceId) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, C.prefs(workspaceId)));
        if (!cancelled && snap.exists()) {
          const data = snap.data() as Partial<PrefsState>;
          const remoteAt = typeof data.updatedAt === "number" ? data.updatedAt : 0;
          const localAt = useDeficiencyPrefs.getState().updatedAt ?? 0;
          // Only accept the remote doc if it's at least as new as local (last-write-wins).
          if (remoteAt >= localAt) useDeficiencyPrefs.getState().hydrate(data);
        }
      } catch {
        /* best-effort */
      } finally {
        if (!cancelled) loaded.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    const unsub = useDeficiencyPrefs.subscribe((s) => {
      if (!loaded.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setDoc(
          doc(db, C.prefs(workspaceId)),
          {
            deficiencyView: s.deficiencyView,
            savedPresets: s.savedPresets,
            defaultPresetId: s.defaultPresetId,
            updatedAt: s.updatedAt || Date.now(),
          },
          { merge: true }
        ).catch(() => {});
      }, 600);
    });
    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [workspaceId]);
}
