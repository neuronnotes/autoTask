---
sortBy: manual
sortDir: asc
noTime: false
barras: false
recursivo: true
barraTotal:
  - Total de tarefas (recursivo)
  - concluídas
barraFilhas:
  - Filhas diretas
  - concluídas
---

# Template: Padrão (Default)

Esta nota define as **configurações globais de fábrica** do **autoTask**.  
Todos os outros templates (como `curso`, `projeto`, `livro` e `treino`) e qualquer chamada do script herdam essas propriedades automaticamente, sobrescrevendo apenas o que for configurado de forma específica.

---

## 🎛️ Guia Rápido dos Parâmetros e Opções Disponíveis

Use este guia como referência rápida para editar as propriedades no topo desta nota ou personalizá-las em notas específicas:

---

### 1. `sortBy` — Critério de Ordenação das Notas
Define como as tarefas e sub-caixas são organizadas na sua checklist.

| Opção | Comportamento | Quando usar |
| :--- | :--- | :--- |
| `manual` *(Padrão)* | Respeita rigorosamente a lista sequencial escrita no `order:` do frontmatter. | Cursos, livros e etapas com ordem pré-determinada. Se não houver `order:`, usa a ordem alfabética. |
| `name` | Ordena alfabeticamente com **ordenação natural** (ex.: `Capítulo 10` vem após `Capítulo 9`, e não após o `1`). | Listas de referência, índices temáticos, glossários ou notas criadas com `theBox`. |
| `completed` | Agrupa as tarefas pendentes no topo e move as concluídas para o final da lista. | Listas de pendências diárias (*To-Do*) onde você quer focar no que ainda falta fazer. |
| `done` | Ordena pela data em que cada nota foi concluída (`AAAA-MM-DD`). | Históricos de execução, logs de progresso e revisões semanais. |

---

### 2. `sortDir` — Direção da Ordenação
Controla o sentido da ordenação escolhida no `sortBy`.

| Opção | Comportamento |
| :--- | :--- |
| `asc` *(Padrão)* | **Crescente:** De A a Z, do 1 ao 99, ou datas mais antigas primeiro. Se `completed`, pendentes no topo. |
| `desc` | **Decrescente:** De Z a A, do 99 ao 1, ou datas mais recentes primeiro. Se `completed`, concluídas no topo. |

---

### 3. `recursivo` — Hierarquia e Sub-caixas Sanfonadas
Controla se o autoTask deve abrir e somar sub-pastas e etapas aninhadas.

| Opção | Comportamento |
| :--- | :--- |
| `true` *(Padrão)* | **Modo Recursivo:** Sub-caixas ganham setinhas `▸` / `▾` para expandir e recolher. O progresso soma todas as tarefas atômicas aninhadas e exibe a barra dupla (Micro e Macro). |
| `false` | **Modo Direto:** Trata apenas as notas diretamente vinculadas. Cada nota filha conta como 1 unidade de progresso simples. |

---

### 4. `noTime` — Desativação do Rastreamento de Tempo
Controla a leitura dos blocos de tempo do plugin `simple-time-tracker`.

| Opção | Comportamento |
| :--- | :--- |
| `false` *(Padrão)* | **Tempo Ativo:** Lê automaticamente os blocos de tempo das notas e soma o total (`⏱ 4h 30min`). |
| `true` | **Tempo Desativado:** Desativa completamente o cálculo e a exibição de tempos para um visual mais limpo. |

---

### 5. `barras` — Barras Gráficas Proporcionais de Tempo
Exibe um gráfico visual ASCII da proporção de tempo gasto em cada nota.

| Opção | Comportamento |
| :--- | :--- |
| `false` *(Padrão)* | Não exibe barras adicionais de tempo abaixo de cada item. |
| `true` | Desenha uma barra proporcional abaixo de cada nota no primeiro nível (ex.: `⏱️ ████░░░░░░ 25.0%`). |

---

### 6. `barraTotal` — Rótulo da Barra Principal (Micro / Total)
Controla o texto exibido na barra superior que mede todas as tarefas atômicas.

- **Formato Simples (`texto`):** Altera apenas o nome antes dos dois pontos.
  - Exemplo: `barraTotal: "Aulas"` ➔ `Aulas: 3 / 10 concluídas (30%)`
- **Formato Completo (`[título, termo]`):** Altera o nome e o termo de conclusão.
  - Exemplo:
    ```yaml
    barraTotal:
      - Episódios
      - assistidos
    ```
    ➔ `Episódios: 3 / 10 assistidos (30%)`

---

### 7. `barraFilhas` — Rótulo da Barra Secundária (Macro / Etapas)
Controla o texto da segunda barra que mede as filhas diretas (módulos, fases, partes).

- **Formato Simples (`texto`):** Altera apenas o nome antes dos dois pontos.
  - Exemplo: `barraFilhas: "Módulos"` ➔ `Módulos: 1 / 3 concluídas (33%)`
- **Formato Completo (`[título, termo]`):** Altera o nome e o termo de conclusão.
  - Exemplo:
    ```yaml
    barraFilhas:
      - Módulos
      - completados
    ```
    ➔ `Módulos: 1 / 3 completados (33%)`