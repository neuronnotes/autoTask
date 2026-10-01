# Guia Completo do autoTask v3 para Gestão do Conhecimento
> **Público:** Alunos e praticantes de Gestão do Conhecimento Pessoal (PKM) no Obsidian.  
> **Pré-requisito técnico:** Nenhum. Você não precisa saber programação para entender e usar o autoTask com maestria.

---

# Sumário
1. [O que é o autoTask e por que ele existe?](#1-o-que-é-o-autotask-e-por-que-ele-existe)
2. [Os Dois Pilares: Caixas e Tarefas](#2-os-dois-pilares-caixas-e-tarefas)
3. [Como Estruturar seu Cofre (Top-Down vs Bottom-Up)](#3-como-estruturar-seu-cofre-top-down-vs-bottom-up)
4. [A Visão Macro vs Micro (As Duas Barras de Progresso)](#4-a-visão-macro-vs-micro-as-duas-barras-de-progresso)
5. [O Poder dos Templates: Padronização Sem Esforço](#5-o-poder-dos-templates-padronização-sem-esforço)
6. [Controle de Tempo Integrado (Simple Time Tracker)](#6-controle-de-tempo-integrado)
7. [Como Usar no Dia a Dia (Guia Prático Passo a Passo)](#7-como-usar-no-dia-a-dia-guia-prático-passo-a-passo)
8. [Como o autoTask Pensa por Baixo dos Panos](#8-como-o-autotask-pensa-por-baixo-dos-panos)
9. [Perguntas Frequentes dos Alunos](#9-perguntas-frequentes-dos-alunos)

---

# 1. O que é o autoTask e por que ele existe?

Na **Gestão do Conhecimento Pessoal (PKM)**, um dos maiores desafios é acompanhar o andamento de projetos complexos, cursos longos e leituras de livros sem perder tempo atualizando planilhas ou checklists manuais que ficam desatualizadas.

O **autoTask** transforma qualquer nota comum do seu Obsidian em um **painel inteligente de controle** (chamado de **"Caixa"**):
- Ele lê automaticamente as notas vinculadas àquele projeto.
- Cria uma lista interativa onde você pode marcar tarefas com um clique.
- Calcula a porcentagem de conclusão em tempo real.
- Soma o tempo gasto estudando ou trabalhando.
- Salva o status de conclusão diretamente dentro de cada arquivo `.md`, permitindo que seus dados continuem sendo seus, em texto puro e portáteis.

Tudo isso acontece de forma fluida, rápida e sem recarregar a tela.

---

# 2. Os Dois Pilares: Caixas e Tarefas

Para organizar o conhecimento no autoTask, você só precisa entender dois tipos de notas:

```
                      ┌────────────────────────┐
                      │  NOTA CAIXA (Projeto)  │
                      │  Ex: Curso de Inglês   │
                      └───────────┬────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         │                                                 │
┌────────▼───────────────┐                       ┌─────────▼──────────────┐
│ NOTA CAIXA (Sub-etapa) │                       │  NOTA TAREFA (Folha)   │
│ Ex: Módulo 1           │                       │  Ex: Aula Inaugural    │
└────────┬───────────────┘                       └────────────────────────┘
         │
┌────────▼───────────────┐
│  NOTA TAREFA (Folha)   │
│  Ex: Aula de Gramática │
└────────────────────────┘
```

1. **Nota Tarefa (Folha):** É a nota final onde o trabalho acontece. É o resumo de uma aula, o capítulo de um livro ou uma ação específica. Ela tem uma caixinha de seleção (checkbox) para você marcar quando terminar.
2. **Nota Caixa (Nó Organizador):** É a nota que agrupa outras notas. Pode ser a nota principal de um Curso, de um Livro ou de um Projeto. Ela não tem um checkbox próprio; seu progresso é calculado automaticamente pela soma das tarefas filhas.

> **Regra de Ouro:** Quando 100% das tarefas de uma Caixa são concluídas, a própria Caixa se marca como concluída automaticamente no seu cofre!

---

# 3. Como Estruturar seu Cofre (Top-Down vs Bottom-Up)

O autoTask oferece duas formas complementares de conectar suas notas. Você escolhe a que for mais natural para o seu fluxo de pensamento:

### Método 1: Associação Direta (`order:` no topo da Caixa) — *Top-Down*
Você abre a nota do Projeto e escreve no início dela (no Frontmatter/Propriedades) a lista das etapas na ordem exata em que deseja executá-las:

```yaml
---
order:
  - "[[01 - Fundamentos]]"
  - "[[02 - Prática Intermediária]]"
  - "[[03 - Projeto Final]]"
---
```

* **Vantagem:** Você tem controle total da sequência exata das tarefas.
* **Recurso Notas Fantasmas:** Você pode planejar links para notas que ainda nem foram criadas (ex.: `[[Capítulo 5]]`). Elas aparecem na lista com um visual especial, prontas para serem clicadas e criadas quando você chegar lá!

### Método 2: Associação Reversa (`theBox:` dentro da Tarefa) — *Bottom-Up*
Você está criando anotações avulsas no dia a dia e quer que elas pertençam a uma Caixa, sem precisar ir até a Caixa para adicionar o link:

```yaml
---
theBox: "[[Curso de Inglês]]"
---
```

* **Vantagem:** Totalmente descentralizado. Crie novas aulas ou tarefas a qualquer momento; basta apontar `theBox` para a nota mãe e ela aparecerá instantaneamente no painel da Caixa.

---

# 4. A Visão Macro vs Micro (As Duas Barras de Progresso)

Quando você gerencia projetos com várias etapas, olhar apenas para o número total de tarefas pode gerar ansiedade ou dar uma falsa sensação de progresso.

Por isso, quando o **Modo Recursivo** está ativo, o autoTask exibe **duas barras no topo**:

```
Total de tarefas (recursivo): 18 / 30 concluídas (60%)  ·  ⏱ 14h 20min
[████████████████████████░░░░░░░░░░░░░░░░]  <- BARRA MICRO (Azul / Verde)

Módulos: 2 / 4 concluídos (50%)
[████████████████████░░░░░░░░░░░░░░░░░░░░]  <- BARRA MACRO (Roxa / Esmeralda)
```

1. **Barra Micro (Total de Tarefas):** Mostra o trabalho atômico real. Soma cada aula, cada exercício e cada capítulo de todas as sub-pastas e níveis.
2. **Barra Macro (Filhas Diretas):** Mostra o avanço das grandes etapas. Diz quantos módulos, fases ou partes inteiras já foram finalizados.

---

# 5. O Poder dos Templates: Padronização Sem Esforço

Você não precisa configurar opções toda vez que criar uma nova nota. O autoTask possui um sistema de **Templates** na pasta `templates/`.

### Como Usar um Template:
Basta indicar o nome do template no seu código:
````markdown
```dataviewjs
await dv.view("scripts/autoTask", { template: "Curso" });
```
````

### Templates Nativos Incluídos:
- `template: "Curso"` ➔ Configura rótulos de **Aulas** e **Módulos**, ativando o modo recursivo.
- `template: "Projeto"` ➔ Configura rótulos de **Tarefas** e **Etapas**.
- `template: "Livro"` ➔ Configura rótulos de **Capítulos** e **Partes**.
- `template: "Treino"` ➔ Configura rótulos de **Treinos** e **Séries**.

### Como Criar seu Próprio Template (Sem Código):
1. Crie uma nota na pasta `autoTask/templates/` com o nome que desejar (ex.: `artigo.md`).
2. Adicione no início da nota as propriedades desejadas:
```yaml
---
recursivo: true
barraTotal: Parágrafos
barraFilhas: Seções
---
```
3. Pronto! Agora qualquer nota no seu cofre pode usar `{ template: "Artigo" }`.

---

# 6. Controle de Tempo Integrado

Se você utiliza o plugin comunitário **Simple Time Tracker** para cronometrar suas sessões de estudo ou trabalho Pomodoro, o autoTask se integra a ele automaticamente:

1. Quando você cronometra tempo dentro de uma tarefa filha, o autoTask lê os blocos `simple-time-tracker`.
2. Ele soma esse tempo e exibe o selo ao lado da tarefa: `🕒 1h 45min`.
3. Ele sobe somando o tempo de todas as tarefas filhas para exibir na barra principal o tempo total acumulado no projeto inteiro: `⏱ 32h 10min`.
4. Tudo é lido de forma ultra-otimizada: ele só gasta processamento para reler o arquivo se você tiver modificado o cronômetro.

---

# 7. Como Usar no Dia a Dia (Guia Prático Passo a Passo)

### Cenário 1: Criando um Curso com Módulos e Aulas
1. Crie a nota mãe: `Inglês Fluente.md`.
2. No início dela, insira o código:
````markdown
```dataviewjs
await dv.view("scripts/utils/autoTask", { template: "Curso" });
```
````
3. Crie as notas dos módulos e adicione no frontmatter deles:
```yaml
---
theBox: "[[Inglês Fluente]]"
---
```
4. Dentro de cada aula, aponte para o respectivo módulo:
```yaml
---
theBox: "[[Módulo 01 - Sons do Idioma]]"
---
```
5. Abra a nota `Inglês Fluente.md`: sua árvore inteira estará montada, com setinhas expansíveis `▸` / `▾` para você abrir e fechar os módulos conforme estuda!

---

### Cenário 2: Escolhendo a Ordenação das Notas
Você pode controlar como as tarefas são exibidas na lista através da opção `sortBy`:

- `sortBy: "manual"` (Padrão): Respeita a ordem exata em que você escreveu os links no `order:`.
- `sortBy: "name"`: Coloca em ordem alfabética inteligente (onde o *Ciclo 10* vem depois do *Ciclo 9*, e não depois do *Ciclo 1*).
- `sortBy: "completed"`: Agrupa as tarefas pendentes no topo e move as concluídas para baixo. Dentro de cada grupo, mantém a ordem original ou alfabética.
- `sortBy: "done"`: Ordena pela data em que cada tarefa foi finalizada.

Exemplo de uso:
````markdown
```dataviewjs
await dv.view("scripts/utils/autoTask", {
    template: "Projeto",
    sortBy: "completed"
});
```
````
---

# 8. Como o autoTask Pensa por Baixo dos Panos

Para que você se sinta seguro e no controle do seu cofre, aqui está o que acontece nos bastidores quando você interage com o autoTask:

### O que acontece ao clicar num checkbox?
1. **Ação Visual Imediata:** O texto da tarefa é riscado na hora na sua tela e o número da barra avança suavemente.
2. **Atualização da Hierarquia:** Se aquela era a última aula que faltava para fechar o módulo, o módulo é marcado como concluído automaticamente.
3. **Gravação Segura no Disco:** O script abre os arquivos `.md` correspondentes em segundo plano e grava:
   ```yaml
   completed: true
   done: 2026-10-01
   ```
4. **Zero Reflow (Sem Piscar):** O script sabe que a alteração partiu do seu próprio clique. Ele não redesenha a tela, não move itens de lugar e não causa nenhum salto visual.

### Por que ele não deixa o Obsidian lento?
- **Gerenciamento Responsável de Memória:** Quando você fecha uma aba de nota, o autoTask detecta que aquela tela não está mais visível e libera a memória imediatamente. Seu Obsidian continua leve mesmo após semanas de uso ininterrupto.
- **Leitura em Memória RAM:** Em vez de abrir dezenas de arquivos no disco toda vez que você olha para a nota, ele consulta o índice do Obsidian em microssegundos.

---

# 9. Perguntas Frequentes dos Alunos

#### P: O autoTask altera o texto das minhas anotações?
**R:** Não. Ele altera exclusivamente as propriedades do cabeçalho YAML (`completed` e `done`). Todo o corpo da sua nota, seus resumos e links permanecem 100% intocados.

#### P: E se um dia eu parar de usar o autoTask? Meus dados ficam presos?
**R:** De forma alguma! Como ele grava propriedades padrão (`completed: true`), você pode consultar seus dados usando qualquer plugin do ecossistema Obsidian (Dataview padrão, Tasks, Kanban, etc.) ou simplesmente abrir seus arquivos em qualquer outro leitor de Markdown do planeta.

#### P: Posso usar emojis nos títulos das minhas notas?
**R:** Sim! O autoTask foi projetado para funcionar perfeitamente com emojis (ex.: `♻️ CICLO 1`, `🔰 Missão 2`). Ele ordena números e textos com acentos e símbolos de forma natural e limpa.

#### P: O que acontece se eu renomear uma nota filha?
**R:** O autoTask reconhece a mudança de nome cirurgicamente. O link na lista é atualizado na hora para apontar para o novo nome, sem quebrar o cálculo de progresso e sem abrir notas em branco acidentalmente.
