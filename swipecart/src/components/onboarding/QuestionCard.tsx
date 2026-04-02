"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Option {
  value: string;
  label: string;
  emoji: string;
}

interface QuestionCardProps {
  title: string;
  subtitle: string;
  options: Option[];
  multi: boolean;
  onSelect: (value: string | string[]) => void;
}

export function QuestionCard({
  title,
  subtitle,
  options,
  multi,
  onSelect,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<string[]>([]);

  function handleTap(value: string) {
    if (!multi) {
      onSelect(value);
      return;
    }

    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  }

  function handleContinue() {
    if (multi && selected.length > 0) {
      onSelect(selected);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md"
    >
      <h2 className="font-heading text-3xl text-center mb-1">{title}</h2>
      <p className="text-muted-foreground text-center mb-6 font-bold">{subtitle}</p>

      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              onClick={() => handleTap(option.value)}
              className={`card-cardboard flex flex-col items-center gap-2 p-4 transition-all ${
                isSelected
                  ? "!border-primary !shadow-[4px_4px_0px_#FF6B35] rotate-[-1deg]"
                  : "hover:rotate-[1deg]"
              }`}
            >
              <span className="text-4xl">{option.emoji}</span>
              <span className="font-bold text-sm">{option.label}</span>
            </button>
          );
        })}
      </div>

      {multi && selected.length > 0 && (
        <button
          onClick={handleContinue}
          className="btn-chunky w-full mt-5 bg-primary text-primary-foreground border-[#cc5529] py-3 text-lg shadow-[4px_4px_0px_#cc5529]"
        >
          Let&apos;s Go! ({selected.length} picked)
        </button>
      )}
    </motion.div>
  );
}
