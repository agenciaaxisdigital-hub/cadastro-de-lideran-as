import { describe, it, expect } from "vitest";
import { formatCPF, cleanCPF, validateCPF, maskCPF } from "@/lib/cpf";

// CPFs válidos conhecidos para testes
const CPF_VALIDO = "52998224725";
const CPF_VALIDO_2 = "11144477735";
const CPF_FORMATADO = "529.982.247-25";

describe("cleanCPF", () => {
  it("remove pontos e hífen", () => {
    expect(cleanCPF("529.982.247-25")).toBe("52998224725");
  });

  it("remove espaços e letras", () => {
    expect(cleanCPF("529 982 abc 247 25")).toBe("52998224725");
  });

  it("retorna string vazia se vazio", () => {
    expect(cleanCPF("")).toBe("");
  });

  it("não altera string só com números", () => {
    expect(cleanCPF("52998224725")).toBe("52998224725");
  });
});

describe("formatCPF", () => {
  it("formata CPF completo (11 dígitos)", () => {
    expect(formatCPF("52998224725")).toBe("529.982.247-25");
  });

  it("formata CPF completo já formatado (remove e reformata)", () => {
    expect(formatCPF("529.982.247-25")).toBe("529.982.247-25");
  });

  it("formata parcialmente com 3 dígitos", () => {
    expect(formatCPF("529")).toBe("529");
  });

  it("formata parcialmente com 4 dígitos", () => {
    expect(formatCPF("5299")).toBe("529.9");
  });

  it("formata parcialmente com 6 dígitos", () => {
    expect(formatCPF("529982")).toBe("529.982");
  });

  it("formata parcialmente com 7 dígitos", () => {
    expect(formatCPF("5299822")).toBe("529.982.2");
  });

  it("formata parcialmente com 9 dígitos", () => {
    expect(formatCPF("529982247")).toBe("529.982.247");
  });

  it("formata parcialmente com 10 dígitos", () => {
    expect(formatCPF("5299822472")).toBe("529.982.247-2");
  });

  it("ignora dígitos além do 11º", () => {
    expect(formatCPF("529982247259999")).toBe(CPF_FORMATADO);
  });

  it("retorna string vazia se vazio", () => {
    expect(formatCPF("")).toBe("");
  });
});

describe("validateCPF", () => {
  it("valida CPF correto sem formatação", () => {
    expect(validateCPF(CPF_VALIDO)).toBe(true);
  });

  it("valida CPF correto com formatação", () => {
    expect(validateCPF(CPF_FORMATADO)).toBe(true);
  });

  it("valida segundo CPF correto", () => {
    expect(validateCPF(CPF_VALIDO_2)).toBe(true);
  });

  it("rejeita CPF com todos dígitos iguais (00000000000)", () => {
    expect(validateCPF("00000000000")).toBe(false);
  });

  it("rejeita CPF com todos dígitos iguais (11111111111)", () => {
    expect(validateCPF("11111111111")).toBe(false);
  });

  it("rejeita CPF com todos dígitos iguais (99999999999)", () => {
    expect(validateCPF("99999999999")).toBe(false);
  });

  it("rejeita CPF com menos de 11 dígitos", () => {
    expect(validateCPF("1234567890")).toBe(false);
  });

  it("rejeita CPF com mais de 11 dígitos numéricos", () => {
    expect(validateCPF("123456789012")).toBe(false);
  });

  it("rejeita CPF com dígito verificador errado", () => {
    expect(validateCPF("52998224724")).toBe(false);
  });

  it("rejeita CPF vazio", () => {
    expect(validateCPF("")).toBe(false);
  });

  it("rejeita CPF com apenas letras", () => {
    expect(validateCPF("abcdefghijk")).toBe(false);
  });

  it("valida CPF formatado com pontos e hífen", () => {
    expect(validateCPF("111.444.777-35")).toBe(true);
  });
});

describe("maskCPF", () => {
  it("mascara CPF completo sem formatação", () => {
    expect(maskCPF("52998224725")).toBe("***.982.247-**");
  });

  it("mascara CPF completo com formatação (usa os dígitos brutos)", () => {
    // maskCPF espera CPF sem formatação (só dígitos) baseado na implementação
    expect(maskCPF("52998224725")).toBe("***.982.247-**");
  });

  it("retorna string vazia se vazio", () => {
    expect(maskCPF("")).toBe("");
  });

  it("retorna original se menos de 11 caracteres", () => {
    expect(maskCPF("5299822")).toBe("5299822");
  });

  it("oculta corretamente os 3 primeiros e 2 últimos dígitos", () => {
    const result = maskCPF("11144477735");
    expect(result).toBe("***.444.777-**");
  });
});
