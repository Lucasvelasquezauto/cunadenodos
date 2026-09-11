import Link from "next/link";

export function InstitutionalFooter() {
  return (
    <footer className="border-t border-gray-200 px-4 py-10">
      <div className="mx-auto max-w-3xl text-center sm:text-left">
        <p className="text-sm text-gray-600">
          Este sitio es un desarrollo independiente, resultado de la formación en inteligencia
          artificial recibida en la Beca SER ANDI. Busca tejer una red de contactos entre los
          emprendimientos y el talento del programa para construir valor económico y social.
        </p>
        <Link
          href="/acerca-de"
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
        >
          Conoce más sobre esta iniciativa
        </Link>
      </div>
    </footer>
  );
}
