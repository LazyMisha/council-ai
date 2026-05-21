"use client";

import { useId, useState } from "react";
import type { Message } from "../domain/types";
import { cn } from "@/components/ui/class-names";

const summaryLabels = [
  "Decision",
  "Why",
  "Open risks",
  "Next move",
  "Short answer",
  "Key points",
  "Main disagreements / tradeoffs",
  "Assumptions",
  "Recommendation",
  "Next steps",
];

type SummaryMessageProps = {
  message: Message;
};

export function SummaryMessage({ message }: SummaryMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = useId();
  const summaryLines = getSummaryLines(message.content);
  const preview = summaryLines[0];

  return (
    <article className="flex justify-start">
      <div className="w-full rounded-lg border border-accent/30 bg-accent-muted/40 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Summary
            </p>
            {!isExpanded && preview ? (
              <p className="mt-2 line-clamp-2 text-base leading-7 text-text-secondary md:text-sm md:leading-6">
                {preview.label ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {preview.label}:
                    </span>{" "}
                  </>
                ) : null}
                {preview.body}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-controls={contentId}
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((expanded) => !expanded)}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-accent/30 bg-surface px-2.5 text-xs font-medium text-accent hover:bg-accent-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
          >
            <span
              aria-hidden="true"
              className={cn(
                "transition-transform duration-150",
                isExpanded ? "rotate-180" : "rotate-0",
              )}
            >
              ▾
            </span>
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>

        {isExpanded ? (
          <div
            id={contentId}
            className="mt-3 space-y-2 text-base leading-7 text-text-secondary md:text-sm md:leading-6"
          >
            {summaryLines.map((line) => {
              if (line.label) {
                return (
                  <p key={line.id} className="mt-3">
                    <span className="font-semibold text-foreground">
                      {line.label}:
                    </span>{" "}
                    {line.body}
                  </p>
                );
              }

              return <p key={line.id}>{line.body}</p>;
            })}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function getSummaryLines(content: string) {
  return content
    .split("\n")
    .map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      const label = summaryLabels.find((summaryLabel) =>
        trimmed.startsWith(`${summaryLabel}:`),
      );

      if (!label) {
        return { id: `${index}-${trimmed}`, body: trimmed };
      }

      return {
        id: `${index}-${trimmed}`,
        label,
        body: trimmed.slice(label.length + 1).trim(),
      };
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line));
}
