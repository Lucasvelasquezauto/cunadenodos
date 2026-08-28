/** @type {import('next').NextConfig} */
const nextConfig = {
  // Default de Server Actions es 1MB — muy poco para subir la hoja de vida
  // en PDF (hasta 5MB, ver lib/talent.ts MAX_CV_SIZE_BYTES) más el resto del
  // formulario de /perfil.
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
