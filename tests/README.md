# 🧪 Ambiente de Testes do autoTask

Ambiente de testes modular, rápido e desacoplado, projetado segundo as melhores práticas de engenharia de software para garantir que nenhuma alteração futura cause regressões nos comportamentos do script.

---

## 🚀 Como Executar

Você pode executar os testes por qualquer um dos comandos:

```bash
# Execução direta via index:
node tests/index.js

# Ou via entrypoint na raiz:
node test.js
```

---

## 🎯 Princípios de Design

1. **Desacoplamento Total de `examples/`**:
   - A pasta `examples/` é de uso livre para você testar manualmente no Obsidian sem medo de quebrar os testes automatizados.
   - Todos os dados dos testes automatizados residem isolados em `tests/fixtures/vault.js` (em memória, clonados a cada execução para isolamento puro).

2. **Modularidade por Suíte (`tests/suites/`)**:
   - Cada funcionalidade ou subsistema possui seu próprio arquivo de teste dedicado.
   - Fácil de manter, debugar e expandir.

3. **Prevenção de Regressões (Blindagem de Bugs Resolvidos)**:
   - **Ordenação Natural Alfanumérica**: Garante que `Ciclo 10` venha após `Ciclo 9` (e não antes de `Ciclo 2`).
   - **Desempate Estável em `sortBy: "completed"`**: Garante que dentro de cada grupo (pendentes vs concluídas), a ordem manual (`order:`) ou alfabética (`theBox:`) seja rigorosamente respeitada, sem pular de posição.
   - **Estabilidade da Árvore**: Garante que ao editar uma nota externa no Obsidian, o refresh do Dataview não jogue tarefas concluídas para o final da lista.
   - **Fast Path sem Flicker**: Reconciliação in-place no DOM sem recriar elementos desnecessariamente.
   - **Coleta de Lixo (Garbage Collection)**: Garante que abas fechadas no Obsidian tenham suas views órfãs (`isConnected === false`) expurgadas do cache em memória.

---

## 📁 Estrutura de Arquivos

```
tests/
├── fixtures/
│   └── vault.js              # Mock em memória de notas, frontmatter e templates (isolado)
├── helpers/
│   ├── dom-mock.js           # Mock leve e preciso da DOM do Obsidian/Dataview
│   └── runner.js             # Harness de asserções, cenários e runner de suítes
├── suites/
│   ├── 01-recursive.test.js              # Hierarquias, contagem de folhas e badges
│   ├── 02-non-recursive.test.js          # Filhas diretas e barra única
│   ├── 03-ghost-notes.test.js            # Links não resolvidos (is-unresolved) e aliases
│   ├── 04-templates.test.js              # Herança de default.md e templates customizados
│   ├── 05-thebox-index.test.js           # Indexação reversa (theBox: [[...]])
│   ├── 06-checkbox-clicks.test.js        # Simulação de clique interativo e atualização de UI
│   ├── 07-sync-box-status.test.js        # Sincronização atômica de caixas intermediárias no disco
│   ├── 08-time-tracking.test.js          # Agregação bottom-up de tempo e simple-time-tracker
│   ├── 09-sorting-natural.test.js        # Ordenação alfanumérica natural e desempate estável
│   ├── 10-reconciliation-antiflicker.test.js # Fast Path cirúrgico e anti-flicker
│   └── 11-memory-and-lifecycle.test.js   # Coleta de lixo, abas independentes e lazy rendering
├── index.js                  # Agregador e executor principal de todas as suítes
└── README.md                 # Esta documentação
```
