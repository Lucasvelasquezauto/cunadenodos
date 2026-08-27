// Patrón tomado directo de los afiches oficiales ("Un programa de: / Operado
// por:", logos en blanco sobre fondo oscuro — ver DESIGN.md). SER ANDI Fondo
// Social y NODO todavía no tienen versión con fondo transparente; se muestran
// como wordmark de texto hasta que el usuario entregue esos dos archivos.
export function InstitutionalFooter() {
  return (
    <footer className="border-t border-gray-200 px-4 py-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-16">
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Un programa de
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:justify-start">
            <span className="text-sm font-bold uppercase tracking-wide text-gray-400">
              SER ANDI Fondo Social
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/andi-seccional-antioquia.png"
              alt="ANDI Seccional Antioquia | Más País"
              className="h-8 w-auto opacity-90"
            />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Operado por</p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:justify-start">
            <span className="text-sm font-bold uppercase tracking-wide text-gray-400">NODO</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/universidad-eafit.png"
              alt="Universidad EAFIT"
              className="h-8 w-auto opacity-90"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
