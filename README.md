# Power BI Custom Visual — PAT Progress Visual

Este repositório contém um **visual customizado do Power BI**, desenvolvido com o **Power BI Visuals SDK (`pbiviz`)**, para exibir o **desempenho (%) por Eixo ao longo dos Anos** em barras horizontais segmentadas.

O visual foi criado para uso **institucional/corporativo**, permitindo análise visual rápida do progresso por eixo estratégico.

---

## 📊 O que este visual mostra

Para cada **Eixo** (E1, E2, E3…):

- 📈 **% médio** do eixo
- 🟦 **Barra horizontal segmentada por Ano**
- 📅 **Anos exibidos abaixo da barra**
- 🙂 **Indicador visual (emoji)** conforme o desempenho

---

## 🧱 Estrutura do projeto

```

patProgressVisual/
├─ src/
│  └─ visual.ts           # Lógica principal do visual
├─ capabilities.json      # Campos (data roles) do visual
├─ pbiviz.json            # Manifesto (nome, versão, autor)
├─ style/
│  └─ visual.less
├─ dist/                  # Arquivo .pbiviz gerado
└─ package.json

````

---

## 🧩 Campos usados no Power BI (Data Roles)

Ao usar o visual no Power BI, os seguintes campos devem ser preenchidos:

### Obrigatórios
- **Eixo** *(Grouping)*  
  Ex.: `E1`, `E2`, `E3`

- **Ano** *(Grouping)*  
  Ex.: `2021`, `2022`, `2023`

- **%** *(Measure)*  
  Ex.: `% PAT`, `% PDI`

### Regra do percentual
- Valores entre `0 e 1` → interpretados como percentual  
  Ex.: `0.86` → `86%`
- Valores entre `0 e 100` → usados diretamente  
  Ex.: `86` → `86%`

---

## 🖥️ Pré-requisitos (máquina limpa)

### 1️⃣ Instalar Node.js
- Baixar a versão **LTS** em:  
  https://nodejs.org/

Verificar instalação:
```powershell
node -v
npm -v
````

---

### 2️⃣ Instalar PowerShell 7 (OBRIGATÓRIO)

O Power BI Visual Tools usa o comando `pwsh`.

* Instalar pela Microsoft Store:
  [https://www.microsoft.com/store/productId/9MZ1SNWT0N5D](https://www.microsoft.com/store/productId/9MZ1SNWT0N5D)

Verificar instalação:

```powershell
pwsh -v
```

> ⚠️ **PowerShell antigo (Windows PowerShell 5)** não funciona para gerar certificados.

---

### 3️⃣ Instalar Power BI Visual Tools

```powershell
npm install -g powerbi-visuals-tools
```

Verificar:

```powershell
pbiviz
```

---

## ⚙️ Configurar o Power BI Desktop (passo ESSENCIAL)

No **Power BI Desktop**:

1. Vá em **Arquivo → Opções e configurações → Opções**
2. Selecione **Configurações do relatório**
3. Marque:

   * ✅ **Permitir desenvolver um visual**
4. Clique em **OK**
5. **Feche e reabra o Power BI Desktop**

> Sem essa opção marcada, o visual **não carrega em modo desenvolvimento**.

---

## 🛠️ Modo desenvolvimento (para quem vai alterar o código)

### 1️⃣ Entrar na pasta do projeto

```powershell
cd patProgressVisual
```

### 2️⃣ Instalar dependências

```powershell
npm install
```

### 3️⃣ Gerar certificado local

```powershell
pbiviz install-cert
```

> Execute **uma única vez por máquina**.

---

### 4️⃣ Rodar o visual em modo dev

```powershell
pbiviz start
```

Deixe o terminal **aberto**.

---

### 5️⃣ Usar o visual de desenvolvedor no Power BI

No Power BI Desktop:

1. Vá em **Inserir → Mais visuais → Meus Arquivos**
2. Adicione o visual à página
3. Arraste os campos:

   * **Eixo**
   * **Ano**
   * **%**

O visual será atualizado automaticamente a cada alteração no código.

---

## 📦 Gerar o pacote (.pbiviz)

Para distribuir ou instalar o visual:

```powershell
cd patProgressVisual
pbiviz package
```

O arquivo será gerado em:

```
patProgressVisual/dist/patProgressVisual.pbiviz
```

---

## 📥 Importar o visual no Power BI (uso final)

1. Abra o **Power BI Desktop**
2. No painel **Visualizações**, clique em **…**
3. Selecione **Importar um visual de um arquivo**
4. Escolha o arquivo `.pbiviz` da pasta `dist`
5. Confirme o aviso de segurança

O visual aparecerá como um novo ícone.

---

## 🔄 Atualizar o visual no Power BI

Sempre que o código mudar:

1. Execute:

```powershell
pbiviz package
```

2. No Power BI:

* Remova o visual antigo
* Reimporte o novo `.pbiviz`

---

## ⚠️ Observações importantes

* Linhas sem **Eixo** são ignoradas
* O visual apenas **renderiza**, não altera dados
* O Power BI pode cachear visuais:

  * Se algo não atualizar, **feche e reabra** o relatório
* Emojis, cores e layout são configuráveis no código (`visual.ts`)

---

## 🧠 Tecnologias utilizadas

* Power BI Visuals SDK (`pbiviz`)
* TypeScript
* HTML / CSS
* Power BI Desktop

---

## 📌 Uso recomendado

* Visual institucional
* Dashboards estratégicos
* Monitoramento de desempenho por eixo
* Uso interno (não publicado no AppSource)

---
