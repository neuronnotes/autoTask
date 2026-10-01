---
order:
  - "[[fantasma 1]]"
  - "[[fantasma 2]]"

  - "[[fantasmão 3|fantasma 3]]"
totalTime: 30
---

```dataviewjs
await dv.view("scripts/autoTask");
```
  
## Validação
  1. Modo padrão (sem recursivo ou recursivo: false):
      • Em uma caixa com order de 3 notas onde apenas 1 existe no vault e está concluída: a barra mostrará 1 / 3 concluidas (33%), e a caixa não será marcada como    
      completed: true.
      • As 2 notas não criadas aparecerão com o checkbox desabilitado e o link na cor opaca/estilo não resolvido (is-unresolved).
      • Clicar no link de uma nota fantasma abre/cria a nota normalmente no Obsidian.
  2. Modo recursivo (recursivo: "True"):
      • As notas fantasmas não possuem filhas, portanto comportam-se como folhas pendentes valendo 1 unidade cada no total (resultado idêntico de 1 / 3).             
  3. Criação das notas pendentes:
      • Ao criar os arquivos das notas faltantes, o Dataview as indexa e elas passam automaticamente a ser filhas normais com checkboxes interativos.

## Duas consequências que você precisa saber antes de aplicar:

1. **Link morto vira pendência eterna.** Se você apagar uma nota ou errar o nome no `order`, ela passa a contar como não concluída para sempre. A solução é remover o link do `order`. Antes ela sumia em silêncio, agora fica visível, o que acho melhor.
2. **Temporada não criada conta como 1 só.** No modo recursivo, se o `order` de uma série lista 8 temporadas e só a 1 existe (com 10 episódios), o total será 17 (10 episódios mais 7 temporadas fantasmas). O script não tem como saber quantos episódios as outras terão, então o percentual só se estabiliza quando as notas são criadas.