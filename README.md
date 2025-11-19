# Sistema de Gestão Financeira e Orçamentos

Sistema completo para controle financeiro, cadastro de clientes, produtos e geração de orçamentos.

## 🚀 Funcionalidades

### 📊 Dashboard
- Visão geral do saldo em conta
- Saídas confirmadas
- Saldo devedor (pendente)
- Saldo a receber (pendente)
- Saldo atrasado (vencimentos passados)
- Últimos lançamentos
- Orçamentos pendentes

### 💰 Controle Financeiro
Baseado na lógica da sua planilha Excel:

**Categorias:**
- **Devo**: Contas a pagar
- **A receber**: Valores a receber
- **Débito**: Pagamentos em débito
- **Pix**: Pagamentos em Pix
- **Crédito**: Pagamentos em crédito

**Status:**
- **Pendente**: Não confirmado (não afeta saldo atual)
- **Confirmado**: Confirmado (afeta saldo atual)

**Cálculos Automáticos:**
- Saldo em Conta = Saldo Inicial + Entradas Confirmadas - Saídas Confirmadas
- Saídas da Conta = Total de Devo + Débito + Crédito confirmados
- Saldo Devedor = Total de "Devo" pendentes
- Saldo a Receber = Total de "A receber" pendentes
- Saldo Atrasado = Lançamentos pendentes com vencimento passado

### 👥 Cadastro de Clientes
- Nome completo
- CPF/CNPJ
- Telefone
- Email
- Endereço completo

### 📦 Cadastro de Produtos/Serviços
- Código do produto
- Descrição
- Preço de custo
- Preço de venda
- Cálculo automático de margem
- Unidade (UN, KG, M², etc)

### 📋 Orçamentos
- Seleção de cliente
- Adição de múltiplos produtos
- Quantidade e preço personalizável
- Cálculo automático do total
- Observações
- Status (Pendente/Aprovado/Cancelado)
- Geração de orçamento para impressão
- **Aprovação integrada**: Ao aprovar um orçamento, ele automaticamente lança o valor no financeiro como "A receber"

### ⚙️ Configurações
- Nome da empresa
- CNPJ
- Telefone e email
- Endereço
- Upload de logo (aparece na sidebar e nos orçamentos)
- Exportação de dados (backup JSON)
- Importação de dados

## 📱 Como Usar

### Instalação
1. Abra o arquivo `index.html` em qualquer navegador
2. O sistema funciona 100% offline (todos os dados são salvos no navegador)

### Tornar Instalável (PWA)
Para usar como aplicativo instalável no Windows:

1. Abra o sistema no **Google Chrome** ou **Microsoft Edge**
2. Clique no ícone de instalação na barra de endereço (ou menu > "Instalar Sistema de Gestão")
3. O sistema será instalado como um aplicativo no seu computador

### Primeiro Uso
1. Vá em **Configurações** e preencha os dados da sua empresa
2. Faça upload da sua logo
3. Configure o **Saldo Inicial** da conta em **Financeiro**
4. Cadastre seus **Clientes**
5. Cadastre seus **Produtos/Serviços**
6. Comece a criar **Orçamentos** e **Lançamentos Financeiros**

## 💾 Backup dos Dados

**IMPORTANTE**: Os dados são salvos no navegador (LocalStorage). Para segurança:

1. Vá em **Configurações**
2. Clique em **Exportar Dados**
3. Salve o arquivo JSON em local seguro
4. Faça backups regularmente

Para restaurar os dados:
1. Vá em **Configurações**
2. Clique em **Importar Dados**
3. Selecione o arquivo JSON do backup

## 🖨️ Impressão de Orçamentos

1. Abra um orçamento em **Visualizar**
2. Clique em **Imprimir**
3. O orçamento será formatado automaticamente com:
   - Logo e dados da empresa
   - Dados do cliente
   - Lista de itens
   - Total do orçamento

## 🔄 Integração Orçamento → Financeiro

Quando você **aprova um orçamento**:
1. O status muda para "Aprovado"
2. Um lançamento é criado automaticamente no Financeiro
3. Categoria: "A receber"
4. Status: "Pendente"
5. Valor: Total do orçamento
6. Descrição: Referência ao número do orçamento e cliente

Depois você pode:
- Marcar como "Confirmado" quando receber o pagamento
- O saldo será atualizado automaticamente

## 🎨 Personalização

Edite o arquivo `styles.css` para alterar:
- Cores do tema
- Fontes
- Layout
- Espaçamentos

## 🔒 Segurança

- Todos os dados ficam apenas no seu navegador
- Nenhuma informação é enviada para internet
- Faça backups regulares usando a função de exportação

## 📱 Responsivo

O sistema funciona em:
- Desktop (Windows, Mac, Linux)
- Tablets
- Smartphones

## ⚡ Recursos Técnicos

- **HTML5, CSS3, JavaScript puro**
- **LocalStorage** para armazenamento
- **PWA (Progressive Web App)** - instalável
- **Funciona offline**
- **Sem necessidade de servidor**
- **Sem banco de dados externo**

## 🆘 Suporte

Se precisar de ajuda:
1. Verifique se está usando um navegador moderno (Chrome, Edge, Firefox)
2. Verifique se o JavaScript está habilitado
3. Faça backup dos dados antes de qualquer alteração

## 📝 Notas

- O sistema calcula automaticamente os saldos baseado na lógica da planilha Excel
- Categorias "Devo", "Débito" e "Crédito" quando confirmadas = SAÍDAS
- Categorias "A receber" e "Pix" quando confirmadas = ENTRADAS
- Itens pendentes não afetam o saldo atual, apenas os indicadores de devedor/a receber

---

**Desenvolvido para gestão completa de pequenos negócios** 🚀
