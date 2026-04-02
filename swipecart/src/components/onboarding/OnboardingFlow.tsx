"use client";

import { useState } from "react";
import { QuestionCard } from "./QuestionCard";
import type { OnboardingAnswers } from "@/lib/types";

interface OnboardingFlowProps {
  onComplete: (answers: OnboardingAnswers) => void;
}

const QUESTIONS = [
  {
    title: "How many players?",
    subtitle: "Pick your typical group size",
    options: [
      { value: "2", label: "2", emoji: "👫" },
      { value: "3-4", label: "3-4", emoji: "👨‍👩‍👧" },
      { value: "5+", label: "5+", emoji: "🎉" },
      { value: "any", label: "Any", emoji: "🤷" },
    ],
    key: "playerCount" as const,
    multi: false,
  },
  {
    title: "How long do you want to play?",
    subtitle: "Ideal session length",
    options: [
      { value: "short", label: "Quick (<30 min)", emoji: "⚡" },
      { value: "medium", label: "Medium (30-60 min)", emoji: "⏱️" },
      { value: "long", label: "Long (60+ min)", emoji: "🕐" },
      { value: "any", label: "Any", emoji: "🤷" },
    ],
    key: "playTime" as const,
    multi: false,
  },
  {
    title: "How complex?",
    subtitle: "How much brain power?",
    options: [
      { value: "easy", label: "Easy to learn", emoji: "🌱" },
      { value: "medium", label: "Some strategy", emoji: "🧩" },
      { value: "heavy", label: "Brain burner", emoji: "🧠" },
      { value: "any", label: "Surprise me", emoji: "🎲" },
    ],
    key: "complexity" as const,
    multi: false,
  },
  {
    title: "What sounds fun?",
    subtitle: "Pick all that appeal to you",
    options: [
      { value: "strategy", label: "Strategy", emoji: "♟️" },
      { value: "cooperative", label: "Cooperative", emoji: "🤝" },
      { value: "party", label: "Party", emoji: "🎈" },
      { value: "family", label: "Family", emoji: "👨‍👩‍👧‍👦" },
      { value: "thematic", label: "Thematic", emoji: "🏰" },
      { value: "card-game", label: "Card Game", emoji: "🃏" },
    ],
    key: "themes" as const,
    multi: true,
  },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});

  const question = QUESTIONS[step];

  function handleSelect(value: string | string[]) {
    const key = question.key;
    const updated = { ...answers, [key]: value };
    setAnswers(updated);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete({
        playerCount: (updated.playerCount as OnboardingAnswers["playerCount"]) ?? "any",
        playTime: (updated.playTime as OnboardingAnswers["playTime"]) ?? "any",
        complexity: (updated.complexity as OnboardingAnswers["complexity"]) ?? "any",
        themes: (updated.themes as string[]) ?? [],
      });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <QuestionCard
        key={step}
        title={question.title}
        subtitle={question.subtitle}
        options={question.options}
        multi={question.multi}
        onSelect={handleSelect}
      />
    </div>
  );
}
