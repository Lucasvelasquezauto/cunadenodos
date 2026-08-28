// Compartido entre las dos rutas de descarga de CV (con sesión y de invitado)
// para no duplicar el saneo del nombre de archivo en el header.
export function cvResponseHeaders(fileName: string, mimeType: string | null): HeadersInit {
  const safeName = fileName.replace(/["\r\n]/g, "");
  return {
    "Content-Type": mimeType || "application/pdf",
    "Content-Disposition": `attachment; filename="${safeName}"`,
  };
}
