import Link from "next/link";

export const metadata = {
  title: "Acerca de — Cuna de Nodos",
};

export default function AcercaDePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-4 py-14">
      <div>
        <h1 className="text-2xl font-semibold">Acerca de Cuna de Nodos</h1>
        <p className="mt-4 text-base text-gray-600">
          Cuna de Nodos es una iniciativa independiente, no un producto oficial de la
          Universidad EAFIT ni de la ANDI. Surge como resultado práctico de la formación en
          inteligencia artificial, creatividad y criterio recibida en la Beca SER ANDI —
          Inteligencia Artificial, con el objetivo de mantener viva la red de contactos entre
          los emprendimientos y el talento formado en el programa, para que sigan generando
          oportunidades de negocio, empleo y colaboración entre sí, es decir, valor económico
          y social, más allá de la duración de la beca.
        </p>
      </div>
      <Link href="/" className="text-sm font-medium text-primary hover:underline">
        Volver al inicio
      </Link>
    </main>
  );
}
