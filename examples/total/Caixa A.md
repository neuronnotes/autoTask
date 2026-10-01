
```dataviewjs
await dv.view("scripts/autoTask", { barras: "True", recursivo: "True" });
```
## Como validar no Obsidian

Estrutura de exemplo:

```
Caixa A
  Tarefa 1 (completed: true)
  Tarefa 2 (completed: false)
  Caixa B (theBox: [[Caixa A]])
    Tarefa 3 (completed: true)
    Tarefa 4 (completed: true)
    Tarefa 5 (completed: false)
```

### 1. Sem o parâmetro (ou com `recursivo: false`)

```
await dv.view("scripts/utils/autoTask", { sortBy: "completed", barras: "True" });
```

Resultado esperado na Caixa A:

- **Barra de progresso:** `1 / 3 concluidas (33%)`, porque só a Tarefa 1 está concluída entre as 3 filhas diretas.
- **Caixa B:** aparece na checklist com o checkbox normal, habilitado, valendo por si própria.

### 2. Com o parâmetro ativo (`recursivo: "True"` ou `recursivo: true`)

```
await dv.view("scripts/utils/autoTask", { sortBy: "completed", barras: "True", recursivo: "True" });
```

Resultado esperado na Caixa A:

- **Barra de progresso:** `3 / 5 concluidas (60%) · 1 / 3 filhas diretas`. Contam as folhas 1 a 5, e as Tarefas 1, 3 e 4 estão concluídas.

Na checklist:

- **Tarefa 1:** marcada e riscada.
- **Tarefa 2:** desmarcada.
- **Caixa B:** checkbox desabilitado e desmarcado (2/3 é menos que 100%), texto sem risco, com o badge `2/3` ao lado do link.

Ao clicar na Tarefa 2 na Caixa A:

- O progresso sobe para `4 / 5 concluidas (80%) · 2 / 3 filhas diretas`.
- A `syncBoxStatus` mantém `completed: false` na Caixa A, porque ainda falta a Tarefa 5.
- Ao marcar também a Tarefa 5, a Caixa A grava `completed: true` e `done` com a data de hoje.