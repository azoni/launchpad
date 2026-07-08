"use client";
import { useCallback, useState } from "react";
import { scenario, stepDevices } from "@/lib/demo/scenario";
import { SiteLogo } from "@/components/SiteLogo";
import { Hud } from "@/components/demo/Hud";
import { StepFrame } from "@/components/demo/StepFrame";
import { NotesSheet } from "@/components/demo/NotesSheet";
import { DeficiencyTray } from "@/components/demo/DeficiencyTray";
import { BriefingScreen } from "@/components/demo/screens/BriefingScreen";
import { SitemapScreen } from "@/components/demo/screens/SitemapScreen";
import { ChoiceScreen } from "@/components/demo/screens/ChoiceScreen";
import { ChecklistScreen } from "@/components/demo/screens/ChecklistScreen";
import { ExtinguishersScreen } from "@/components/demo/screens/ExtinguishersScreen";
import { CameraScreen } from "@/components/demo/screens/CameraScreen";
import { SyncScreen } from "@/components/demo/screens/SyncScreen";
import { SignatureScreen } from "@/components/demo/screens/SignatureScreen";
import { OfficeScreen } from "@/components/demo/screens/OfficeScreen";
import { DebriefScreen } from "@/components/demo/screens/DebriefScreen";
import { useFieldNotes } from "@/lib/demo/useFieldNotes";
import { useDeficiencies } from "@/lib/demo/useDeficiencies";
import { haptic } from "@/lib/haptics";

const CONTINUE_LABELS: Record<string, string> = {
  "s01-morning": "Roll out →",
  "s02-sitemap": "Into the riser room →",
  "s03-ontest": "Run the riser →",
  "s04-riser": "Head to the street →",
  "s05-l1-sweep": "Elevator to L3 →",
  "s06-l3-round": "Down to B1 →",
  "s07-descend": "Find the head →",
  "s08-deficiency": "Classify it →",
  "s09-severity": "Finish the level →",
  "s10-b1-sweep": "Elevator up →",
  "s11-sync": "Find Dana →",
  "s12-signature": "Back at the office →",
  "s13-office": "See the scorecard →",
};

const C7_DEF = {
  id: "def-c7",
  deviceId: "HEAD-B1-C7",
  label: "Pendent Head, Row C Stall 7",
  floor: "B1",
  location: "Row C above stall 7, under the exhaust fan",
  status: "local" as const,
  photo: true,
  historyNote: "minor surface corrosion noted — monitor",
};

export function DemoGame() {
  const { steps, dummyData, devices, debrief, metaInfo } = scenario;
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [unsynced, setUnsynced] = useState(0);
  const [offlineArmed, setOfflineArmed] = useState(false);
  const [outcomes, setOutcomes] = useState({ ontestFirstTry: true, severityFirstTry: true });
  const [notesOpen, setNotesOpen] = useState(false);
  const [defsOpen, setDefsOpen] = useState(false);

  const fieldNotes = useFieldNotes();
  const defs = useDeficiencies();

  const step = steps[stepIndex];
  const offline = offlineArmed && step.signal === "none";
  // Only a real device id becomes a note's context — never leak an internal step id like "s08-deficiency".
  const contextId = stepDevices[step.id]?.[0];

  const markDone = useCallback(() => setDone(true), []);
  const bumpUnsynced = useCallback(() => setUnsynced((n) => n + 1), []);

  const advance = () => {
    setDone(false);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const clockIn = () => {
    haptic();
    defs.reset(); // each run starts with a clean building; notes persist by design
    setStarted(true);
  };

  const reset = () => {
    // Replay drops straight back into the run (Step 1), not the Clock-in title screen.
    haptic();
    setStepIndex(0);
    setDone(false);
    setUnsynced(0);
    setOfflineArmed(false);
    setOutcomes({ ontestFirstTry: true, severityFirstTry: true });
    defs.reset();
    setStarted(true);
  };

  const deviceById = (id: string) => devices.find((d) => d.id === id)!;

  const renderScreen = () => {
    switch (step.screen) {
      case "briefing":
        return <BriefingScreen data={dummyData} onDone={markDone} />;
      case "sitemap":
        return (
          <SitemapScreen
            floors={dummyData.site.floors}
            mode={step.id === "s02-sitemap" ? "orient" : "descend"}
            onDone={markDone}
            onWentOffline={() => setOfflineArmed(true)}
          />
        );
      case "ontest":
        return (
          <ChoiceScreen
            choices={step.choices ?? []}
            onDone={(firstTry) => {
              setOutcomes((o) => ({ ...o, ontestFirstTry: firstTry }));
              markDone();
            }}
          />
        );
      case "severity":
        return (
          <ChoiceScreen
            choices={step.choices ?? []}
            onDone={(firstTry) => {
              setOutcomes((o) => ({ ...o, severityFirstTry: firstTry }));
              defs.setSeverity("def-c7", "critical");
              bumpUnsynced(); // classification captured offline
              markDone();
            }}
          />
        );
      case "checklist":
        return (
          <ChecklistScreen
            key={step.id}
            devices={(stepDevices[step.id] ?? []).map(deviceById)}
            offline={step.signal === "none"}
            onDeviceComplete={step.signal === "none" ? bumpUnsynced : undefined}
            onDone={markDone}
          />
        );
      case "extinguishers":
        return <ExtinguishersScreen survey={deviceById("HEADS-L3")} extinguisher={deviceById("FE-L3-04")} onDone={markDone} />;
      case "camera":
        return (
          <CameraScreen
            onCaptured={() => {
              bumpUnsynced();
              defs.add(C7_DEF);
            }}
            onDone={markDone}
          />
        );
      case "sync":
        return (
          <SyncScreen
            onDrain={() => setUnsynced((n) => Math.max(0, n - 1))}
            onDone={() => {
              defs.setStatus("def-c7", "synced");
              markDone();
            }}
          />
        );
      case "signature":
        return <SignatureScreen data={dummyData} onDone={markDone} />;
      case "office":
        return (
          <OfficeScreen
            data={dummyData}
            onDone={() => {
              defs.setStatus("def-c7", "quoted");
              markDone();
            }}
          />
        );
      case "debrief":
        return (
          <DebriefScreen
            tallies={debrief.tallies}
            closing={debrief.closing}
            outcomes={outcomes}
            notes={fieldNotes.notes}
            deficiencies={defs.list}
            onReplay={reset}
          />
        );
    }
  };

  const phone = !started ? (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-8 text-center grid-bg">
      <SiteLogo />
      <div>
        <div className="tactical-label">// Playable demo</div>
        <h1 className="mt-2 font-display text-3xl uppercase tracking-widest2 text-ink">{metaInfo.title}</h1>
        <p className="mt-3 text-muted text-[13px] leading-relaxed max-w-[280px] font-sans">{metaInfo.tagline}</p>
      </div>
      <div className="text-fainter text-[11px] tracking-widest2 uppercase">
        ~{metaInfo.estimatedMinutes} min · {dummyData.inspector.name} · {dummyData.inspector.certs.split(" — ")[0]}
      </div>
      <button
        onClick={clockIn}
        className="bg-fire hover:bg-fire3 active:scale-[0.98] text-white px-8 py-3.5 rounded text-[12px] tracking-widest2 uppercase transition-all animate-soft-pulse"
      >
        ▶ Clock in
      </button>
    </div>
  ) : (
    <>
      <Hud
        phase={step.phase}
        stepIndex={stepIndex}
        stepCount={steps.length}
        stepPhases={steps.map((s) => s.phase)}
        offline={offline}
        unsynced={unsynced}
        notesCount={fieldNotes.notes.length}
        deficiencyCount={defs.list.length}
        onOpenNotes={() => setNotesOpen(true)}
        onOpenDeficiencies={() => setDefsOpen(true)}
      />
      <div className="flex-1 overflow-y-auto">
        {step.screen === "debrief" ? (
          <div className="p-4 animate-slide-in">
            <h2 className="text-ink text-[17px] uppercase tracking-widest2">{step.title}</h2>
            <p className="mt-2.5 mb-4 text-ink2 text-[14px] leading-relaxed font-sans">{step.narrative}</p>
            {renderScreen()}
          </div>
        ) : (
          <StepFrame
            key={step.id}
            title={step.title}
            narrative={step.narrative}
            interaction={step.interaction}
            done={done}
            painPoint={step.painPoint}
            onContinue={advance}
            continueLabel={CONTINUE_LABELS[step.id]}
          >
            {renderScreen()}
          </StepFrame>
        )}
      </div>

      <NotesSheet
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        contextId={contextId}
        notes={fieldNotes.notes}
        onAdd={fieldNotes.add}
        onRemove={fieldNotes.remove}
      />
      <DeficiencyTray open={defsOpen} onClose={() => setDefsOpen(false)} deficiencies={defs.list} />
    </>
  );

  return (
    <div className="min-h-dvh bg-bg md:grid-bg md:flex md:items-center md:justify-center md:gap-12 md:py-10 md:px-6">
      {/* desktop side panel */}
      <div className="hidden md:block max-w-xs">
        <SiteLogo />
        <div className="tactical-label mt-6">// Playable demo</div>
        <h1 className="mt-2 font-display text-3xl uppercase tracking-widest2 text-ink leading-tight">{metaInfo.title}</h1>
        <p className="mt-4 text-muted text-[13.5px] leading-relaxed font-sans">{metaInfo.tagline}</p>
        <p className="mt-4 text-faint text-[13px] leading-relaxed font-sans">
          Built for a thumb — open it on your phone for the real feel. Everything you play here is the workflow the
          PyroGuard field app ships: same steps, same offline queue, same paper it kills.
        </p>
      </div>

      {/* the phone */}
      <div className="relative h-dvh md:h-[780px] md:max-h-[85vh] md:w-[400px] w-full flex flex-col bg-bg overflow-hidden md:border md:border-border md:rounded-[24px] md:shadow-[0_0_80px_rgba(255,69,0,0.07)]">
        {phone}
      </div>
    </div>
  );
}
