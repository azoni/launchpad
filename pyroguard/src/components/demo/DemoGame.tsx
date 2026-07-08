"use client";
import { useCallback, useState } from "react";
import { scenario, stepDevices } from "@/lib/demo/scenario";
import { SiteLogo } from "@/components/SiteLogo";
import { Hud } from "@/components/demo/Hud";
import { StepFrame } from "@/components/demo/StepFrame";
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
import { haptic } from "@/lib/haptics";

const CONTINUE_LABELS: Record<string, string> = {
  "s01-morning": "Roll out →",
  "s03-ontest": "Open the riser room →",
  "s09-severity": "Finish the level →",
  "s11-sync": "Find Dana →",
  "s13-office": "Debrief →",
};

export function DemoGame() {
  const { steps, dummyData, devices, debrief, metaInfo } = scenario;
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [unsynced, setUnsynced] = useState(0);
  const [offlineArmed, setOfflineArmed] = useState(false);
  const [outcomes, setOutcomes] = useState({ ontestFirstTry: true, severityFirstTry: true });

  const step = steps[stepIndex];
  const offline = offlineArmed && step.signal === "none";

  const markDone = useCallback(() => setDone(true), []);
  const bumpUnsynced = useCallback(() => setUnsynced((n) => n + 1), []);

  const advance = () => {
    setDone(false);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const reset = () => {
    setStarted(false);
    setStepIndex(0);
    setDone(false);
    setUnsynced(0);
    setOfflineArmed(false);
    setOutcomes({ ontestFirstTry: true, severityFirstTry: true });
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
        return <CameraScreen onCaptured={bumpUnsynced} onDone={markDone} />;
      case "sync":
        return <SyncScreen onDrain={() => setUnsynced((n) => Math.max(0, n - 1))} onDone={markDone} />;
      case "signature":
        return <SignatureScreen data={dummyData} onDone={markDone} />;
      case "office":
        return <OfficeScreen data={dummyData} onDone={markDone} />;
      case "debrief":
        return <DebriefScreen tallies={debrief.tallies} closing={debrief.closing} outcomes={outcomes} onReplay={reset} />;
    }
  };

  const phone = !started ? (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-8 text-center grid-bg">
      <SiteLogo />
      <div>
        <div className="tactical-label">// Playable demo</div>
        <h1 className="mt-2 font-display text-3xl uppercase tracking-widest2 text-ink">{metaInfo.title}</h1>
        <p className="mt-3 text-muted text-[11px] leading-relaxed max-w-[260px]">{metaInfo.tagline}</p>
      </div>
      <div className="text-fainter text-[11px] tracking-widest2 uppercase">
        ~{metaInfo.estimatedMinutes} min · {dummyData.inspector.name} · {dummyData.inspector.certs.split(" — ")[0]}
      </div>
      <button
        onClick={() => {
          haptic();
          setStarted(true);
        }}
        className="bg-fire hover:bg-fire3 active:scale-[0.98] text-white px-8 py-3.5 rounded text-[12px] tracking-widest2 uppercase transition-all animate-soft-pulse"
      >
        ▶ Clock in
      </button>
    </div>
  ) : (
    <>
      <Hud phase={step.phase} stepIndex={stepIndex} stepCount={steps.length} offline={offline} unsynced={unsynced} />
      <div className="flex-1 overflow-y-auto">
        {step.screen === "debrief" ? (
          <div className="p-4 animate-slide-in">
            <h2 className="text-ink text-[15px] uppercase tracking-widest2">{step.title}</h2>
            <p className="mt-2 mb-4 text-muted text-[11px] leading-relaxed">{step.narrative}</p>
            {renderScreen()}
          </div>
        ) : (
          <StepFrame
            key={step.id}
            title={step.title}
            narrative={step.narrative}
            done={done}
            painPoint={step.painPoint}
            onContinue={advance}
            continueLabel={CONTINUE_LABELS[step.id]}
          >
            {renderScreen()}
          </StepFrame>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-bg md:grid-bg md:flex md:items-center md:justify-center md:gap-12 md:py-10 md:px-6">
      {/* desktop side panel */}
      <div className="hidden md:block max-w-xs">
        <SiteLogo />
        <div className="tactical-label mt-6">// Playable demo</div>
        <h1 className="mt-2 font-display text-3xl uppercase tracking-widest2 text-ink leading-tight">{metaInfo.title}</h1>
        <p className="mt-4 text-muted text-[12px] leading-relaxed">{metaInfo.tagline}</p>
        <p className="mt-4 text-faint text-[12px] leading-relaxed">
          Built for a thumb — open it on your phone for the real feel. Everything you play here is the workflow the
          PyroGuard field app ships: same steps, same offline queue, same paper it kills.
        </p>
      </div>

      {/* the phone */}
      <div className="h-dvh md:h-[780px] md:max-h-[85vh] md:w-[400px] w-full flex flex-col bg-bg md:border md:border-border md:rounded-[24px] md:overflow-hidden md:shadow-[0_0_80px_rgba(255,69,0,0.07)]">
        {phone}
      </div>
    </div>
  );
}
