import { describe, expect, it } from "vitest";
import { isCompanyComplete } from "../lib/companies";

describe("isCompanyComplete", () => {
  it("es verdadero cuando los cuatro campos requeridos están llenos", () => {
    expect(
      isCompanyComplete({
        name: "Café Sereno",
        tagline: "Café de origen, tostado en Antioquia",
        description: "Compramos directo a caficultores y tostamos en pequeños lotes.",
        valueProp: "Trazabilidad completa, del cultivo a la taza.",
      }),
    ).toBe(true);
  });

  it("es falso si falta cualquiera de los campos requeridos", () => {
    expect(
      isCompanyComplete({
        name: "Café Sereno",
        tagline: "",
        description: "Compramos directo a caficultores.",
        valueProp: "Trazabilidad completa.",
      }),
    ).toBe(false);
  });

  it("es falso si un campo solo tiene espacios en blanco", () => {
    expect(
      isCompanyComplete({
        name: "Café Sereno",
        tagline: "   ",
        description: "Compramos directo a caficultores.",
        valueProp: "Trazabilidad completa.",
      }),
    ).toBe(false);
  });
});
