

## Plano: Botao "Consultar no TSE" na secao de Dados Eleitorais

### O que sera feito

Adicionar um botao visivel na secao "Dados Eleitorais" do formulario de cadastro que abre o site do TSE numa nova aba para o agente consultar os dados eleitorais da pessoa.

### Alteracao unica

**Arquivo: `src/components/TabCadastrar.tsx`**

Na secao "Dados Eleitorais", logo abaixo do titulo da secao e antes dos campos, adicionar um botao com icone de link externo:

- Texto: "Consultar dados no TSE"
- Icone: `ExternalLink` do lucide-react
- Ao clicar: abre `https://www.tse.jus.br/servicos-eleitorais/autoatendimento-eleitoral#/atendimento-eleitor` em nova aba (`window.open`)
- Estilo: botao secundario com borda, compacto, com texto explicativo pequeno abaixo tipo "Abra o site do TSE, consulte os dados e preencha abaixo"

O agente abre o TSE, digita o CPF/nome da pessoa, copia zona, secao, municipio, colegio e preenche manualmente no formulario.

### Nenhuma migration necessaria

Nao precisa alterar banco de dados.

