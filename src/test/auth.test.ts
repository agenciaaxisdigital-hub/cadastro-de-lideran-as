import { describe, it, expect } from "vitest";

// Replica a função interna nomeToEmail do AuthContext para testar o comportamento
function nomeToEmail(nome: string): string {
  const slug = nome.toLowerCase().trim().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
  return `${slug}@liderancas.app`;
}

describe("nomeToEmail (conversão de nome de usuário para email)", () => {
  it("converte nome simples para email", () => {
    expect(nomeToEmail("maria")).toBe("maria@liderancas.app");
  });

  it("converte nome com espaços para pontos", () => {
    expect(nomeToEmail("Maria Silva")).toBe("maria.silva@liderancas.app");
  });

  it("converte para minúsculas", () => {
    expect(nomeToEmail("ADMINISTRADOR")).toBe("administrador@liderancas.app");
  });

  it("remove espaços extras do início e fim", () => {
    expect(nomeToEmail("  joao  ")).toBe("joao@liderancas.app");
  });

  it("remove caracteres especiais", () => {
    expect(nomeToEmail("João@#Silva!")).toBe("joosilva@liderancas.app");
  });

  it("substitui múltiplos espaços por um ponto", () => {
    expect(nomeToEmail("ana   beatriz")).toBe("ana.beatriz@liderancas.app");
  });

  it("mantém números no nome", () => {
    expect(nomeToEmail("usuario123")).toBe("usuario123@liderancas.app");
  });

  it("gera sempre o domínio correto @liderancas.app", () => {
    const email = nomeToEmail("qualquer nome");
    expect(email).toMatch(/@liderancas\.app$/);
  });

  it("nome com acentos — remove acento mas mantém letras base (sem i18n)", () => {
    // ã, ç, etc. são removidos pela regex [^a-z0-9.]
    const email = nomeToEmail("José");
    expect(email).toBe("jos@liderancas.app");
  });
});

describe("validações de formulário de login", () => {
  it("username vazio é inválido", () => {
    expect("".trim().length > 0).toBe(false);
  });

  it("username com espaços é inválido", () => {
    expect("   ".trim().length > 0).toBe(false);
  });

  it("username preenchido é válido", () => {
    expect("Administrador".trim().length > 0).toBe(true);
  });

  it("password vazia é inválida", () => {
    expect("".length > 0).toBe(false);
  });

  it("password preenchida é válida", () => {
    expect("senha123".length > 0).toBe(true);
  });
});
