"use client";

import { useState, useTransition } from "react";

export function GenerateAndCopy({
  label,
  action,
}: {
  label: string;
  action: () => Promise<string | null>;
}) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setCopied(false);
          startTransition(async () => {
            const result = await action();
            setLink(result);
          });
        }}
        className="btn-secondary self-start"
      >
        {isPending ? "Generando..." : label}
      </button>
      {link && (
        <div className="flex gap-2">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            className="field flex-1"
          />
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              setCopied(true);
            }}
            className="btn-secondary"
          >
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      )}
    </div>
  );
}
