# Power BI Custom Visual — PAT Progress Visual

Este repositório contém um **visual customizado do Power BI** (projeto `pbiviz`) chamado **PAT Progress Visual**, criado para exibir o **desempenho/progresso (%) por Eixo e por Ano** em um layout de barras segmentadas.

O visual renderiza:
- Uma linha por **Eixo** (ex.: E1, E2, E3…)
- Um valor de **% médio** do eixo
- Uma **barra segmentada** por **Ano**, com intensidade de cor variando conforme o % (mais forte = melhor; mais claro = abaixo)
- Uma **marcação do “próximo ano”** (linha vertical) para ajudar a comparar o avanço para o próximo período
- Uma linha única de **anos no rodapé** (não repete em cada barra)

## Estrutura do projeto
- `patProgressVisual/` — projeto do visual (Power BI Visuals)
  - `src/visual.ts` — lógica de renderização do visual
  - `capabilities.json` — papéis de dados (dataRoles) e mapeamentos
  - `pbiviz.json` — manifesto do visual (nome, guid, versão, etc.)
  - `style/visual.less` — estilos (mínimo; a maior parte está inline no `visual.ts`)

## Campos (data roles)
No Power BI, arraste os campos para:
- **Eixo** (Grouping): categoria principal (linha)
- **Ano** (Grouping): ano/etapa (segmento dentro da barra) — opcional se você usar Mês
- **Mês** (Grouping): mês/etapa (segmento dentro da barra) — opcional se você usar Ano
- **Data inicial** (Grouping): início do ciclo (modo progresso) — opcional
- **Data final** (Grouping): fim do ciclo (modo progresso) — opcional
- **%** (Measure): valor numérico (aceita 0–1 ou 0–100)

Comportamento:
- Se **Data inicial + Data final** estiverem preenchidos, o visual entra no **modo progresso**:
  - Divide o intervalo em **12 partes iguais (M1…M12)** e usa o **%** como preenchimento do progresso.
- Se **Mês** estiver preenchido, o visual mostra **segmentos por mês** (modo mensal).
- Se **Mês** não estiver preenchido, o visual mostra **segmentos por ano** (modo anual).
- Se você preencher **Ano + Mês**, o modo mensal funciona melhor quando há **apenas 1 ano** no contexto (use filtro/slicer de ano).

## Como usar (dev)
Pré‑requisitos:
- Node.js (LTS recomendado)
- Power BI Visual Tools (`pbiviz`) instalado globalmente

Dentro da pasta do visual:
```powershell
cd patProgressVisual
npm install
pbiviz start
```

Isso inicia o servidor local do visual para testes em um relatório do Power BI.

## Gerar pacote (.pbiviz)
```powershell
cd patProgressVisual
pbiviz package
```

O arquivo `.pbiviz` gerado fica em `patProgressVisual/dist/`.

## Como instalar/importar no Power BI (Desktop)
Esta seção é para a pessoa responsável por **usar** o visual no Power BI (incluindo a versão de **meses/progresso**).

1) Gere o arquivo do visual
- No terminal, execute:
```powershell
cd patProgressVisual
pbiviz package
```
- Confirme que existe um arquivo `.pbiviz` dentro de `patProgressVisual/dist/`.

2) Importe o visual no Power BI Desktop
- Abra o **Power BI Desktop**.
- No painel **Visualizações**, clique em **… (Mais opções)**.
- Selecione **Obter mais visuais** (ou **Importar um visual de um arquivo**, dependendo da versão).
- Escolha **Importar um visual de um arquivo**.
- Selecione o arquivo `.pbiviz` gerado em `patProgressVisual/dist/`.
- Confirme o aviso de segurança (visuais customizados podem executar código).

3) Use o visual no relatório
- O visual aparecerá no painel **Visualizações** como um novo ícone.
- Adicione o visual à página e preencha os campos:
  - **Eixo** (obrigatório)
  - Escolha um modo:
    - **Modo progresso (12 meses por período):** preencha **Data inicial** + **Data final**
    - **Modo mensal por categoria:** preencha **Mês** (e, se houver Ano também, filtre para 1 ano)
    - **Modo anual:** preencha **Ano**
  - **%** (medida) para o cálculo do desempenho/progresso

Dica: se você atualizar o visual (novo `.pbiviz`), basta **reimportar** o arquivo no Power BI Desktop para substituir a versão anterior.

## Personalização no painel de formatação
O visual expõe uma configuração básica em:
- **Data colors → Text Size**: controla a base de tamanho do texto (também influencia o tamanho do emoji).

## Observações
- Se existir algum valor em branco no campo **Eixo**, o visual ignora essa linha (para não aparecer “uma barra sem eixo”).
- O `Measure` de **%** é tratado como percentual automaticamente:
  - Se o valor for `0.85`, o visual entende como `85%`
  - Se o valor for `85`, o visual entende como `85%`
