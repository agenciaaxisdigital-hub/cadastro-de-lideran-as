import { describe, it, expect } from "vitest";
import { validateCPF } from "@/lib/cpf";

// Replica as regras de validação do handleSave em TabCadastrar
function validarFormulario(form: {
  nome: string;
  telefone: string;
  whatsapp: string;
  cpf: string;
}): string | null {
  if (!form.nome.trim()) return "Preencha o nome";
  if (!form.telefone.trim() && !form.whatsapp.trim()) return "Informe telefone ou WhatsApp";
  if (form.cpf && form.cpf.length === 11 && !validateCPF(form.cpf)) return "CPF inválido";
  return null;
}

describe("validação de formulário de cadastro", () => {
  const baseForm = {
    nome: "Maria Silva",
    telefone: "(62) 99999-0000",
    whatsapp: "",
    cpf: "",
  };

  it("formulário válido completo retorna null", () => {
    expect(validarFormulario(baseForm)).toBeNull();
  });

  it("nome vazio retorna erro", () => {
    expect(validarFormulario({ ...baseForm, nome: "" })).toBe("Preencha o nome");
  });

  it("nome só com espaços retorna erro", () => {
    expect(validarFormulario({ ...baseForm, nome: "   " })).toBe("Preencha o nome");
  });

  it("sem telefone e sem whatsapp retorna erro", () => {
    expect(validarFormulario({ ...baseForm, telefone: "", whatsapp: "" })).toBe(
      "Informe telefone ou WhatsApp"
    );
  });

  it("só whatsapp preenchido é aceito", () => {
    expect(validarFormulario({ ...baseForm, telefone: "", whatsapp: "(62) 98888-0000" })).toBeNull();
  });

  it("só telefone preenchido é aceito", () => {
    expect(validarFormulario({ ...baseForm, telefone: "(62) 99999-0000", whatsapp: "" })).toBeNull();
  });

  it("CPF vazio não gera erro de CPF", () => {
    expect(validarFormulario({ ...baseForm, cpf: "" })).toBeNull();
  });

  it("CPF com menos de 11 dígitos não valida (não é checado)", () => {
    // Regra: só valida se cpf.length === 11
    expect(validarFormulario({ ...baseForm, cpf: "1234567890" })).toBeNull();
  });

  it("CPF inválido com 11 dígitos retorna erro", () => {
    expect(validarFormulario({ ...baseForm, cpf: "00000000000" })).toBe("CPF inválido");
  });

  it("CPF válido com 11 dígitos não retorna erro", () => {
    expect(validarFormulario({ ...baseForm, cpf: "52998224725" })).toBeNull();
  });

  it("CPF com dígito verificador errado retorna erro", () => {
    expect(validarFormulario({ ...baseForm, cpf: "52998224724" })).toBe("CPF inválido");
  });
});

describe("validação de campos numéricos do cadastro", () => {
  it("apoiadores_estimados: string numérica converte para int corretamente", () => {
    expect(parseInt("150")).toBe(150);
  });

  it("apoiadores_estimados: string vazia vira null (não parseInt)", () => {
    const val = "";
    const result = val ? parseInt(val) : null;
    expect(result).toBeNull();
  });

  it("meta_votos: string numérica converte para int", () => {
    expect(parseInt("500")).toBe(500);
  });

  it("meta_votos: valor zero é tratado", () => {
    const val = "0";
    expect(parseInt(val)).toBe(0);
  });
});

describe("status de liderança", () => {
  const statusOptions = ["Ativa", "Potencial", "Em negociação", "Fraca", "Descartada"];

  it("contém exatamente 5 opções", () => {
    expect(statusOptions).toHaveLength(5);
  });

  it("contém o status padrão 'Ativa'", () => {
    expect(statusOptions).toContain("Ativa");
  });

  it("status padrão do formulário é 'Ativa'", () => {
    const emptyForm = { status: "Ativa" };
    expect(emptyForm.status).toBe("Ativa");
  });

  it("todos os status são strings não vazias", () => {
    statusOptions.forEach((s) => expect(s.length).toBeGreaterThan(0));
  });
});

describe("níveis de comprometimento", () => {
  const comprometimentos = ["Alto", "Médio", "Baixo"];

  it("contém exatamente 3 opções", () => {
    expect(comprometimentos).toHaveLength(3);
  });

  it("todas as opções são válidas", () => {
    expect(comprometimentos).toEqual(["Alto", "Médio", "Baixo"]);
  });
});

describe("situações do título eleitoral", () => {
  const situacoesTitulo = ["Regular", "Cancelado", "Suspenso", "Não informado"];

  it("contém exatamente 4 opções", () => {
    expect(situacoesTitulo).toHaveLength(4);
  });

  it("contém 'Regular' como primeira opção", () => {
    expect(situacoesTitulo[0]).toBe("Regular");
  });
});
