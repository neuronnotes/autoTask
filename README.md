# autoTask v3 — DataviewJS Task & Project Manager para Obsidian

O **autoTask v3** é um script reativo e de alto desempenho para **DataviewJS** no Obsidian que transforma qualquer nota em uma **"Caixa"**: um nó organizador/agrupador que gerencia notas filhas (tarefas ou sub-caixas), exibindo barras de progresso dinâmicas, controle de tempo acumulado e uma checklist interativa em tempo real sincronizada diretamente com o frontmatter de cada arquivo `.md`.

Projetado tanto para gestão de tarefas pessoais quanto para **Gestão do Conhecimento (PKM)** estruturada (cursos, livros, rotinas e projetos complexos).

---

## 📌 Principais Recursos

- **Checklist Interativa e Reativa:** Marque e desmarque tarefas diretamente na visualização. As alterações gravam imediatamente `completed` e `done` no frontmatter da nota correspondente e atualizam toda a interface em cascata sem recarregar a página.
- **Dois Modos de Associação:**
  - **Direta (`order` no frontmatter da caixa):** Lista ordenada de links `[[Nota]]`. Suporta links ainda não criados ("notas fantasmas").
  - **Reversa (`theBox` no frontmatter da nota filha):** A nota filha aponta `theBox: "[[NomeDaCaixa]]"`. Indexação sob demanda super rápida.
- **Hierarquia e Modo Recursivo:**
  - *Modo Padrão:* Cada filha direta vale 1 unidade de progresso.
  - *Modo Recursivo (`recursivo: true`):* Sub-caixas ganham setinhas sanfonadas `▸` / `▾` para expandir e recolher sob demanda, somando todas as tarefas aninhadas em qualquer nível de profundidade.
- **Visualização Micro vs Macro no Topo:**
  - Quando há sub-caixas em modo recursivo, o topo exibe **duas barras distintas**:
    - **Barra Principal (Micro):** 10px, mede o total de todas as tarefas/folhas (azul em andamento, verde em 100%).
    - **Barra Secundária (Macro):** 6px, mede as sub-etapas ou módulos diretamente vinculados à caixa (roxa em andamento, esmeralda em 100%).
  - Rótulos e termos de conclusão totalmente customizáveis via parâmetros (`barraTotal` e `barraFilhas`).
- **Ordenação Inteligente e Estável:**
  - **Ordenação Natural:** Lida com números e títulos complexos de forma intuitiva (ex.: `Ciclo 10` vem após `Ciclo 9`, e não após `Ciclo 1`). Suporte nativo a emojis e acentuação.
  - **Desempate Secundário Estável:** Ao ordenar por `sortBy: "completed"`, as tarefas pendentes ficam no topo e as concluídas embaixo, mantendo rigorosamente a ordem original (`order:`) ou alfabética dentro de cada grupo.
- **Performance Cirúrgica e Zero Flicker:**
  - **Fast Path In-Place:** Atualiza checkboxes, textos e barras diretamente nos elementos existentes. Zero reflow, zero piscada e zero interferência ao digitar em outras notas em abas paralelas.
  - **Coleta de Lixo Automática:** Detecta quando abas de notas são fechadas e libera os elementos da memória RAM, mantendo o Obsidian rápido e leve.
- **Rastreamento de Tempo:** Suporte a blocos do plugin `simple-time-tracker`, somando tempos próprios e das filhas com formatação amigável (`⏱ 2h 15min`).
- **Sistema de Templates Dinâmico:** Crie templates na pasta `templates/` (ex.: `curso.md`, `projeto.md`, `livro.md`, `treino.md`) que são reconhecidos instantaneamente sem precisar alterar código.

---

## 🚀 Como Usar

### Pré-requisitos
1. Plugin comunitário **Dataview** instalado e ativado no Obsidian.
2. Nas configurações do Dataview: habilitar **Enable JavaScript Queries**.

### Chamada Básica (Usando o Template Padrão)

Na nota que você deseja transformar em Caixa, insira um bloco `dataviewjs`:

````markdown
```dataviewjs
await dv.view("scripts/utils/autoTask");
```
````

### Chamada com Template Específico

````markdown
```dataviewjs
await dv.view("scripts/utils/autoTask", { template: "Curso" });
```
````

### Chamada com Parâmetros Customizados

````markdown
```dataviewjs
await dv.view("scripts/utils/autoTask", {
    template: "Projeto",
    sortBy: "completed",
    barras: true
});
```
````

---

## ⚙️ Parâmetros Suportados

Todos os parâmetros são passados no segundo argumento de `dv.view("scripts/utils/autoTask", { ... })`:

| Parâmetro | Tipo / Valores | Padrão | Descrição |
| :--- | :--- | :--- | :--- |
| `template` | `string` (ex.: `"Curso"`, `"Projeto"`, `"default"`) \| `object` | `"default"` | Predefinição de configuração. Carrega automaticamente qualquer arquivo da pasta `templates/` (ex.: `templates/curso.md`). Todos os templates herdam e combinam com o `default.md`. |
| `recursivo` | `true` \| `false` \| `"True"` | `true` (via `default.md`) | Ativa a avaliação recursiva de sub-caixas e a checklist expansível hierárquica. |
| `barraTotal` | `string` \| `[string, string]` | `"Total de tarefas (recursivo)"` | Rótulo da barra micro. String define o texto antes dos dois pontos. Lista `["Título", "Termo"]` define o título e substitui `"concluídas"`. |
| `barraFilhas` | `string` \| `[string, string]` | `"Filhas diretas"` | Rótulo da barra macro. String define o texto antes dos dois pontos. Lista `["Título", "Termo"]` define o título e substitui `"concluídas"`. |
| `sortBy` | `"manual"` \| `"name"` \| `"completed"` \| `"done"` | `"manual"` | Critério de ordenação das notas na checklist. |
| `sortDir` | `"asc"` \| `"desc"` | `"asc"` | Direção da ordenação (ascendente ou descendente). |
| `noTime` | `true` \| `false` \| `"True"` | `false` | Se `true`, desativa a leitura, cálculo e exibição de tempos. |
| `barras` | `true` \| `false` \| `"True"` | `false` | Se `true`, exibe barras visuais ASCII proporcionais de tempo (`⏱️ ████░░ 25%`) em cada item do primeiro nível. |

---

## 📂 Como Estruturar as Notas

### 1. Associação Direta por `order` (Top-Down)
No frontmatter da nota Caixa:

```yaml
---
order:
  - "[[Módulo 1 - Fundamentos]]"
  - "[[Módulo 2 - Prática]]"
  - "[[Projeto Final]]"
---
```
*Se `order` existir, ele define a composição e a sequência exata das tarefas quando `sortBy: "manual"` estiver ativo.*

### 2. Associação Reversa por `theBox` (Bottom-Up)
No frontmatter de qualquer nota filha:

```yaml
---
theBox: "[[Nome Da Caixa]]"
---
```
*O script localiza e agrupa automaticamente todas as notas do cofre que apontam para a caixa atual.*

---

## 🏷️ Propriedades de Frontmatter Gerenciadas

O autoTask lê e atualiza automaticamente as seguintes propriedades YAML:

### Nas Notas Tarefas (Folhas)
- `completed`: `true` ou `false` (atualizado no clique do checkbox).
- `done`: Data no formato `YYYY-MM-DD` (gravada automaticamente ao marcar como concluída, removida ao desmarcar).

### Nas Notas Caixa
- `completed`: `true` quando 100% das tarefas estiverem concluídas; `false` caso contrário.
- `done`: Data em que a última tarefa foi finalizada.

---

## 📚 Documentação Adicional

Para uma explicação detalhada voltada a alunos e praticantes de Gestão do Conhecimento (PKM), consulte:
- 📄 **[Guia Completo e Explicação do autoTask para PKM](file:///workspace/docs/Guia%20Completo%20e%20Explicacao%20do%20autoTask.md)**
