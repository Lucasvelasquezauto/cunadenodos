"use client";

import { useRef, useState, useTransition } from "react";
import { generateMyPasswordResetLink } from "@/app/actions";

export function ChangePasswordButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function open() {
    setLink(null);
    setCopied(false);
    dialogRef.current?.showModal();
    startTransition(async () => {
      const result = await generateMyPasswordResetLink();
      setLink(result);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="text-gray-500 hover:text-primary hover:underline"
      >
        Cambiar contraseña
      </button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-sm rounded-xl border border-gray-200 bg-surface p-5 backdrop:bg-black/40"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Cambiar mi contraseña</h2>
          <p className="text-sm text-gray-600">
            Abre este link de un solo uso para elegir una contraseña nueva.
          </p>

          {isPending && <p className="text-sm text-gray-500">Generando link...</p>}

          {!isPending && link && (
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

          {!isPending && !link && (
            <p role="alert" className="text-sm text-error">
              No se pudo generar el link. Intenta de nuevo.
            </p>
          )}

          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="btn-primary self-start"
          >
            Cerrar
          </button>
        </div>
      </dialog>
    </>
  );
}
