import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (class name merger)", () => {
  it("retorna uma classe simples", () => {
    expect(cn("text-white")).toBe("text-white");
  });

  it("combina múltiplas classes", () => {
    expect(cn("text-white", "bg-black")).toBe("text-white bg-black");
  });

  it("resolve conflitos do tailwind (última ganha)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("resolve conflito de padding", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("ignora valores falsy (undefined, null, false)", () => {
    expect(cn("text-white", undefined, null, false)).toBe("text-white");
  });

  it("suporta condicionais com objeto", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });

  it("suporta condicionais falsas com objeto", () => {
    expect(cn("base", { active: false })).toBe("base");
  });

  it("retorna string vazia sem argumentos", () => {
    expect(cn()).toBe("");
  });

  it("suporta arrays de classes", () => {
    expect(cn(["text-white", "bg-black"])).toBe("text-white bg-black");
  });

  it("resolve conflito de margin entre classes", () => {
    expect(cn("m-2", "mx-4")).toBe("m-2 mx-4");
  });
});
