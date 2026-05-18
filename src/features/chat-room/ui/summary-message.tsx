import type { Message } from "../domain/types";

const summaryLabels = [
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
  return (
    <article className="flex justify-start">
      <div className="w-full rounded-lg border border-accent/30 bg-accent-muted/40 px-5 py-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Summary
        </p>
        <div className="space-y-2 text-sm leading-6 text-text-secondary">
          {message.content.split("\n").map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return null;

            const matched = summaryLabels.find((label) =>
              trimmed.startsWith(`${label}:`),
            );

            if (matched) {
              const body = trimmed.slice(matched.length + 1).trim();
              return (
                <p key={index} className="mt-3">
                  <span className="font-semibold text-foreground">
                    {matched}:
                  </span>{" "}
                  {body}
                </p>
              );
            }

            return <p key={index}>{trimmed}</p>;
          })}
        </div>
      </div>
    </article>
  );
}
