# 🎬 REQUISITOS FUNCIONAIS - Nozesfy

**Projeto:** Nozesfy - Plataforma SaaS de Gestão de Estoque  
**Website:** nozesfy.com  
**Stack:** Next.js + Tailwind + Cloudflare Pages + MongoDB Atlas + Stripe  
**Data:** Abril 2025

---

## 🎯 O que são Requisitos Funcionais?

**Requisitos Funcionais (RF)** descrevem **O QUE o sistema faz**. São as ações, operações e funcionalidades concretas que o usuário pode realizar. Eles respondem a pergunta: **"Quais são as operações que o sistema deve oferecer?"**

---

## 📋 REQUISITOS FUNCIONAIS

### **RF-01: Cadastro e Gestão de Produtos**

**O que o sistema faz:**
- Cadastrar novos produtos com informações completas
- Atualizar dados de produtos existentes
- Inativar produtos (soft delete, não apaga)
- Visualizar histórico de alterações
- Suportar produtos com controle de validade

**Informações obrigatórias ao cadastrar:**
- Código (único no sistema)
- Descrição/Nome
- Categoria (alimentos, bebidas, higiene, etc)
- Marca
- Unidade de medida (kg, litro, unidade, pacote)
- Data de validade (se aplicável)
- Preço de compra
- Preço de venda
- Foto/imagem (opcional)

**Por que é funcional:**
```
Usuário Administrador:
1. Clica em "Novo Produto"
2. Preenche: "Arroz Integral 5kg", Marca: "XYZ", Preço: R$ 15, Venda: R$ 25
3. Sistema salva e retorna: "Produto cadastrado com código PROD-1450"
4. Produto agora aparece em listas e pode receber movimentações
```

**Casos de uso:**
- Novo fornecedor com produtos que faltam no sistema
- Produto descontinuado deve ser inativado (mas mantém histórico)
- Alteração de marca: sistema registra mudança com data/hora/usuário
- Buscar produto por código de barras

---

### **RF-02: Controle de Estoque em Tempo Real**

**O que o sistema faz:**
- Impedir que estoque fique negativo (rejeita a operação)
- Permitir definir quantidade mínima por produto
- Permitir definir quantidade máxima por produto
- Atualizar saldo **imediatamente** após cada movimentação
- Controlar estoque separado por local (loja, depósito, filial)

**Por que é funcional:**
```
Cenário 1: Tentativa de venda acima do estoque
  Estoque atual: 10 unidades
  Operador tenta vender: 15 unidades
  Sistema: "ERRO - Estoque insuficiente (10 disponível, 15 solicitado)"
  Resultado: OPERAÇÃO BLOQUEADA

Cenário 2: Multiestoque
  Loja 1: 50 unidades
  Loja 2: 30 unidades
  Depósito: 200 unidades
  Total do sistema: 280 unidades
  Se vender 60 na Loja 1: Loja 1 fica com 50 (OK), outros não mudam
```

**Fluxo técnico:**
```
Venda de 5 unidades
├─ Validação: estoque >= 5? SIM
├─ Bloqueio: Ninguém mais mexe neste estoque
├─ Cálculo: novo_saldo = 20 - 5 = 15
├─ Atualização: BD saldo = 15
├─ Registro: Cria movimentação SAÍDA
├─ Liberação: Bloqueio removido
└─ Resposta: "Venda realizada - Novo saldo: 15"
```

---

### **RF-03: Movimentações de Estoque**

**O que o sistema faz:**
- Registrar entrada de mercadorias (compra, reposição, devolução)
- Registrar saída de mercadorias (venda, consumo, perda)
- Registrar ajustes (correções de inventário)
- Permitir transferências entre estoques
- Manter histórico completo de todas as movimentações
- Exibir histórico com filtros (por data, produto, usuário, tipo)

**Tipos de movimentação e exemplos:**

| Tipo | Subtipo | Exemplo |
|------|---------|---------|
| **ENTRADA** | Compra | 50 unidades do Fornecedor X |
| **ENTRADA** | Reposição | 30 unidades do Depósito p/ Loja |
| **ENTRADA** | Devolução | 5 unidades devolvidas pelo cliente |
| **SAÍDA** | Venda | 8 unidades vendidas ao cliente |
| **SAÍDA** | Consumo Interno | 2 unidades usadas no escritório |
| **SAÍDA** | Perda/Furto | 3 unidades extraviadas |
| **AJUSTE** | Inventário | Contagem manual encontrou diferença |
| **AJUSTE** | Dano | 2 unidades danificadas em transporte |
| **AJUSTE** | Vencimento | 10 unidades vencidas descartadas |
| **TRANSFERÊNCIA** | Inter-loja | 25 unidades de Depósito p/ Loja 2 |

**Cada movimentação contém:**
- Data e hora exata
- Produto envolvido
- Quantidade movimentada
- Tipo de movimentação
- Usuário responsável
- Local de origem e destino
- Justificativa/motivo
- Número de nota fiscal (quando aplicável)
- Data de validade (se relevante)

**Por que é funcional:**
```
Operador quer registrar venda:
1. Vai em "Nova Movimentação"
2. Seleciona: Tipo = SAÍDA, Subtipo = VENDA
3. Busca produto: "Arroz 5kg"
4. Digite quantidade: 8
5. Seleciona cliente: "João Silva"
6. Clica "Confirmar"
7. Sistema:
   - Valida: tem 8? SIM
   - Atualiza: saldo de 50 → 42
   - Registra: MOV-2025-04-15-001234
   - Exibe: "Venda registrada com sucesso"
8. Movimentação aparece no histórico com data/hora/usuário
```

---

### **RF-04: Entrada de Mercadorias**

**O que o sistema faz:**
- Registrar chegada de produtos do fornecedor
- Validar código de barras
- Validar quantidade recebida vs. nota fiscal
- Registrar data de validade por lote
- Sugerir local de armazenamento (otimizado)
- Atualizar estoque automaticamente

**Fluxo de entrada:**
```
1. Fornecedor X chega com mercadoria
2. Operador inicia "Recebimento"
3. Sistema sugere verificar NF (Nota Fiscal) nº 12345
4. Operador escaneia código de barras do produto
5. Sistema mostra: "Arroz 5kg - Esperado: 50 unidades"
6. Operador confirma: "Recebi 50 unidades"
7. Sistema pede: "Data de validade?" → Operador digita: "2026-04-15"
8. Sistema sugere: "Guardar no Depósito B (30% mais perto dos pickers)"
9. Operador confirma
10. Estoque atualizado: Depósito B = +50 unidades
11. Movimentação registrada: ENTRADA | 50 unidades | Fornecedor X | NF 12345
```

**Por que é funcional:**
- Impede discrepâncias: recebe 60 mas NF diz 50 → alerta
- Controle de validade: produtos com mesma validade ficam agrupados
- Otimização: sistema sugere melhor local para guardar
- Rastreabilidade: tudo documentado (NF, data, local, quantidade)

---

### **RF-05: Saída de Mercadorias**

**O que o sistema faz:**
- Registrar vendas feitas (PDV ou e-commerce)
- Fazer baixa automática de estoque
- Registrar consumo interno
- Bloquear vendas acima do estoque disponível
- Integração com caixa/PDV externo

**Cenários de saída:**

**Cenário 1: Venda em PDV (Loja Física)**
```
1. Cliente escolhe Arroz 5kg e Feijão 1kg na loja
2. PDV lê código de barras
3. Sistema verifica estoque: Arroz=50 ✓, Feijão=30 ✓
4. Cliente paga
5. PDV envia para Nozesfy: "SAÍDA | Arroz=1, Feijão=1"
6. Nozesfy atualiza: Arroz=49, Feijão=29
7. Movimentação registrada: SAÍDA | VENDA | PDV-Loja1 | 14:35
```

**Cenário 2: Venda em E-commerce**
```
1. Cliente compra 3 unidades no site
2. E-commerce envia para Nozesfy: "SAÍDA | Produto X=3"
3. Nozesfy verifica estoque: 10 disponíveis ✓
4. Estoque atualizado: 10 - 3 = 7
5. Pedido entra em "Preparação"
6. Movimentação registrada: SAÍDA | ECOMMERCE | Pedido #5432
```

**Cenário 3: Tentativa de saída acima do estoque**
```
1. Operador tenta fazer venda de 100 unidades
2. Estoque atual: 50 unidades
3. Sistema: "ERRO - Estoque insuficiente"
4. Venda é BLOQUEADA
5. Operador vê: "Disponível: 50. Deseja prosseguir com 50?"
```

---

### **RF-06: Ajustes de Estoque**

**O que o sistema faz:**
- Permitir correções manuais de inventário
- Registrar perdas, furtos, danos
- Registrar produtos descartados por vencimento
- Exigir justificativa obrigatória para cada ajuste
- Fazer com que todo ajuste seja auditável (rastreável)

**Exemplos de ajuste:**

```
Ajuste 1: Inventário físico
┌─ Contagem manual encontrou: 45 unidades
├─ Sistema mostra: 50 unidades
├─ Diferença: -5 unidades
├─ Razão: Produtos desaparecidos (furto suspeito)
└─ Resultado: Estoque corrigido para 45

Ajuste 2: Produtos vencidos
┌─ Data: 15/04/2025
├─ Produto: Leite integral 1L
├─ Quantidade: 8 unidades
├─ Validade: 10/04/2025 (VENCIDO)
├─ Razão: Vencimento - descarte obrigatório
└─ Resultado: Estoque -8, Ajuste registrado

Ajuste 3: Dano em transporte
┌─ Recebimento de mercadoria
├─ Encontrado: 2 unidades quebradas
├─ Produto: Óleo de soja 1L
├─ Razão: Embalagem danificada no transporte
└─ Resultado: Estoque -2, Fornecedor notificado para reposição
```

**Por que é funcional:**
- Realidade ≠ Sistema: sempre há diferenças (perdas, danos)
- Justificativa obrigatória: responsabiliza usuário, previne fraudes
- Auditoria: você consegue rastrear quem/quando/por quê de cada ajuste
- Impacto financeiro: produto descartado = perda de dinheiro (precisa registrar)

---

### **RF-07: Gestão de Validade**

**O que o sistema faz:**
- Controlar data de vencimento por lote (não por unidade individual)
- Identificar produtos próximos ao vencimento (configurável: ex. 30 dias antes)
- Identificar produtos já vencidos
- Sugerir promoções para itens com vencimento próximo
- Bloquear venda de produtos vencidos

**Fluxo com lotes:**
```
Produto: Iogurte 500ml

Lote 1: Data de validade 20/04/2025 - 100 unidades
Lote 2: Data de validade 25/04/2025 - 50 unidades
Lote 3: Data de validade 30/04/2025 - 75 unidades

15/04/2025:
├─ Lote 1: ALERTA! Vence em 5 dias (crítico)
├─ Lote 2: AVISO - Vence em 10 dias
└─ Lote 3: OK - Vence em 15 dias

Sistema sugere:
"Lote 1 vence em 5 dias - Sugestão: criar promoção (desconto 20%)
para acelerar venda antes do vencimento"
```

**Regra de saída com validade:**
```
Cliente quer comprar Iogurte
Sistema aplica FIFO (First In, First Out):
- Tira primeiro do Lote 1 (vence antes)
- Se Lote 1 acabar, tira do Lote 2
- Se Lote 2 acabar, tira do Lote 3

Isso garante que produtos mais velhos saem primeiro
```

---

### **RF-08: Custos e Preços**

**O que o sistema faz:**
- Registrar preço de compra de cada produto
- Registrar preço de venda de cada produto
- Calcular custo médio automaticamente
- Atualizar automaticamente relatórios quando preço muda
- Manter histórico de todas as mudanças de preço
- Calcular valorização total do estoque

**Histórico de preços:**
```
Produto: Arroz Integral 5kg
Data: Preço Compra | Preço Venda | Margem | Inserido Por

01/01/2025: R$ 10.00 | R$ 15.00 | 50% | Admin João
15/02/2025: R$ 11.50 | R$ 17.00 | 48% | Admin João
20/03/2025: R$ 10.80 | R$ 16.50 | 53% | Admin Maria
15/04/2025: R$ 12.00 | R$ 18.00 | 50% | Admin Maria

Custo Médio atual: R$ 11.08
Preço de Venda vigente: R$ 18.00
Margem média: 50.4%
```

**Valorização de estoque:**
```
Estoque atual:
- Arroz: 100 unidades × R$ 11.08 = R$ 1.108,00
- Feijão: 80 unidades × R$ 8.50 = R$ 680,00
- Óleo: 150 unidades × R$ 6.20 = R$ 930,00

Total valorizado em custo: R$ 2.718,00
Total se vender tudo (preço venda): R$ 4.650,00
Lucro potencial: R$ 1.932,00
```

---

### **RF-09: Alertas Inteligentes**

**O que o sistema faz:**
- Monitorar estoque continuamente
- Dispara alertas automáticos quando:
  - Estoque abaixo do mínimo
  - Produto sem venda há X dias (produto parado)
  - Produto próximo ao vencimento
  - Produto já vencido
- Enviar notificações via: Dashboard, E-mail, WhatsApp

**Tipos de alertas:**

```
ALERTA 1: ESTOQUE MÍNIMO
┌─ Produto: Leite integral 1L
├─ Estoque mínimo definido: 20 unidades
├─ Estoque atual: 5 unidades
├─ Severidade: 🔴 CRÍTICO
├─ Mensagem: "Leite integral 1L está CRÍTICO. Apenas 5 unidades. Repor imediatamente!"
└─ Ações sugeridas: 
   - Fazer pedido automático de 100 unidades
   - Contatar fornecedor Y

ALERTA 2: PRODUTO PARADO
┌─ Produto: Palmito em conserva 600g
├─ Última movimentação: 15/02/2025 (59 dias atrás)
├─ Qtd no estoque: 47 unidades
├─ Valor: R$ 1.500,00
├─ Severidade: 🟠 MODERADO
├─ Mensagem: "Produto parado há 2 meses. Considere promoção ou descarte"
└─ Ações sugeridas:
   - Fazer promoção (desconto 30%)
   - Transferir para outra loja
   - Descartar se valor for baixo

ALERTA 3: VENCIMENTO PRÓXIMO
┌─ Produto: Iogurte natural 500ml
├─ Lote 1: Vence em 7 dias (20/04/2025)
├─ Severidade: 🟡 MODERADO
├─ Mensagem: "Iogurte vence em 7 dias! Apenas 15 unidades"
└─ Ações sugeridas:
   - Criar promoção (desconto 20%)
   - Direcionar para venda rápida

ALERTA 4: PRODUTO VENCIDO
┌─ Produto: Pão integral
├─ Validade: 10/04/2025 (VENCIDO há 5 dias)
├─ Qtd no estoque: 8 unidades
├─ Severidade: 🔴 CRÍTICO
├─ Mensagem: "Produto VENCIDO! Remover do estoque imediatamente"
└─ Ações: Gerar ajuste de descarte
```

**Configuração de alertas:**
```
Admin pode configurar:
- Quantos dias antes do vencimento alerta? (padrão: 30 dias)
- Quantos dias sem movimento = produto parado? (padrão: 90 dias)
- Canais de notificação? (dashboard, email, WhatsApp)
- Qual perfil recebe cada alerta? (admin, operador, gerente)
```

---

### **RF-10: Gestão de Usuários e Permissões**

**O que o sistema faz:**
- Cadastrar usuários com perfil (Admin, Operador)
- Atribuir permissões conforme perfil
- Registrar TODAS as ações em log de auditoria
- Permitir ativar/desativar usuários

**Permissões por perfil:**

| Ação | Admin | Operador |
|------|-------|----------|
| Cadastrar produto | ✅ | ❌ |
| Editar produto | ✅ | ❌ |
| Inativar produto | ✅ | ❌ |
| Fazer entrada | ✅ | ✅ |
| Fazer saída | ✅ | ✅ |
| Fazer ajuste | ✅ | ✅ |
| Ver custos/preços | ✅ | ❌ |
| Gerar relatórios financeiros | ✅ | ❌ |
| Cadastrar usuário | ✅ | ❌ |
| Ver logs de auditoria | ✅ | ❌ |
| Configurar alertas | ✅ | ❌ |
| Gerenciar planos | ✅ | ❌ |

**Log de auditoria:**
```
2025-04-15 10:30:45 | USER-12 (João Silva - Operador) | ENTRADA | PROD-5 | +50 unidades | "NF-12345"
2025-04-15 11:15:20 | USER-12 (João Silva - Operador) | SAÍDA | PROD-5 | -8 unidades | "PDV-Loja1" | SUCESSO
2025-04-15 14:00:00 | USER-45 (Maria Santos - Admin) | AJUSTE | PROD-5 | -2 unidades | "Dano transporte" | SUCESSO
2025-04-15 14:05:30 | USER-45 (Maria Santos - Admin) | UPDATE_PREÇO | PROD-5 | R$15.00 → R$17.00 | SUCESSO
2025-04-15 16:30:00 | USER-12 (João Silva - Operador) | TENTATIVA_PRODUTO_DELETE | PROD-5 | BLOQUEADO (sem permissão)
```

---

### **RF-11: Multiestoque e Transferências**

**O que o sistema faz:**
- Controlar estoque separadamente por local
- Permitir transferências entre locais
- Registrar transferências como movimentação rastreável
- Consultar saldo por local

**Estrutura de locais:**
```
Empresa: Mercado XYZ

Local 1: Loja São Paulo (Rua A, 100)
├─ Arroz: 150 unidades
├─ Feijão: 80 unidades
└─ Óleo: 200 unidades

Local 2: Loja Rio de Janeiro (Rua B, 200)
├─ Arroz: 100 unidades
├─ Feijão: 120 unidades
└─ Óleo: 150 unidades

Local 3: Depósito Central (Rodovia XYZ, km 50)
├─ Arroz: 500 unidades
├─ Feijão: 400 unidades
└─ Óleo: 600 unidades
```

**Transferência entre locais:**
```
Operador em São Paulo precisa de mais Arroz

Ação: Transferir 100 unidades de Arroz do Depósito Central para Loja SP

Sistema registra:
┌─ SAÍDA em Depósito Central: -100 unidades de Arroz (Transferência)
├─ ENTRADA em Loja SP: +100 unidades de Arroz (Transferência)
└─ Movimentação: TRANSFERÊNCIA | 100 | Depósito → Loja SP | 09:30 | Operador João

Resultado:
├─ Depósito: 500 - 100 = 400
└─ Loja SP: 150 + 100 = 250
```

---

### **RF-12: Relatórios Gerenciais**

**O que o sistema faz:**
- Gerar relatórios automaticamente
- Permitir filtrar por data, produto, local, usuário
- Exportar em PDF/Excel
- Visualizar em dashboard com gráficos

**Tipos de relatórios:**

1. **Posição de Estoque**
   - Mostra quanto há de cada produto por local
   - Valor total do estoque

2. **Histórico de Movimentações**
   - Todas as entradas, saídas, ajustes, transferências
   - Filtro por data, produto, usuário

3. **Produtos Mais Vendidos**
   - Ranking de produtos por quantidade/valor
   - Período personalizável

4. **Produtos Menos Vendidos**
   - Itens que não vendem
   - Sugestão de desconto ou descarte

5. **Produtos Parados**
   - Sem movimentação há X dias
   - Custo de mantê-los estocado

6. **Giro de Estoque**
   - Quantas vezes o estoque "rodou" no mês
   - Fórmula: (Custo Total Vendido / Estoque Médio)

7. **Valorização de Estoque**
   - Valor total do estoque em dinheiro (custo)
   - Valor potencial se vender tudo

---

### **RF-13: Cadastro de Clientes**

**O que o sistema faz:**
- Cadastrar clientes com dados pessoais
- Manter histórico de compras
- Rastrear frequência e gasto por cliente
- Integrar com PDV/E-commerce

**Dados de cliente:**
```
ID: CLI-5432
Nome: João da Silva Santos
CPF: 123.456.789-00
E-mail: joao@email.com
Telefone: (11) 98765-4321
Endereço: Rua A, nº 100, São Paulo, SP
Data de cadastro: 15/01/2025

Histórico de compras:
├─ 20/01/2025: 5 produtos | R$ 125,00
├─ 25/01/2025: 3 produtos | R$ 78,50
├─ 10/02/2025: 8 produtos | R$ 250,00
├─ 05/03/2025: 2 produtos | R$ 45,00
└─ 15/04/2025: 6 produtos | R$ 189,50

Total gasto: R$ 688,00
Frequência: 1 compra a cada 2 semanas
Cliente desde: 3 meses
Status: Ativo | Preferência: Loja física
```

---

### **RF-14: Cadastro e Gestão de Fornecedores**

**O que o sistema faz:**
- Cadastrar fornecedores com dados comerciais
- Manter catálogo de produtos de cada fornecedor
- Registrar condições comerciais (prazos, preços)
- Integrar com pedidos automáticos

**Dados de fornecedor:**
```
ID: FORN-1234
Razão Social: Alimentos XYZ Ltda
CNPJ: 12.345.678/0001-90
Contato: Carlos Silva
Telefone: (11) 3456-7890
E-mail: vendas@alimxyz.com.br
Endereço: Rua B, nº 500, São Paulo, SP

Catálogo de produtos:
├─ Arroz 5kg - R$ 10,00
├─ Feijão 1kg - R$ 8,50
└─ Óleo 1L - R$ 6,20

Condições comerciais:
├─ Prazo de pagamento: 30 dias
├─ Frete: Fornecedor paga acima de R$ 500
└─ Desconto: 5% acima de 100 unidades
```

---

### **RF-15: Previsão de Demanda**

**O que o sistema faz:**
- Analisar histórico de vendas
- Considerar sazonalidade (maior venda em épocas específicas)
- Levar em conta promoções realizadas
- Gerar previsão de demanda futura

**Exemplo de previsão:**
```
Produto: Arroz 5kg
Histórico dos últimos 3 meses:
├─ Janeiro: 500 unidades vendidas
├─ Fevereiro: 520 unidades vendidas
└─ Março: 550 unidades vendidas
Tendência: +25 unidades/mês

Previsão para Abril: ~575 unidades
Previsão para Maio: ~600 unidades

Sazonalidade detectada:
├─ Picos em início de mês (30% maior)
├─ Maior venda em semanas 1-2
└─ Picos festivos (Páscoa, Natal)

Sugestão:
"Para Abril, manter mínimo de 150 unidades.
Comprar 600 unidades no início do mês."
```

---

### **RF-16: Segurança e Confiabilidade**

**O que o sistema faz:**
- Realizar backup automático 2x por dia
- Implementar controle de concorrência (locks)
- Validar TUDO no backend (não confiar em frontend)
- Garantir integridade dos dados

**Exemplo de validação em backend:**
```
Frontend envia: { operacao: "venda", produto: "PROD-5", quantidade: 8 }

Backend SEMPRE verifica:
1. Usuário está autenticado? 
2. Usuário tem permissão para venda?
3. Produto PROD-5 existe?
4. Estoque atual >= 8?
5. Produto está ativo (não inativado)?
6. Todos os campos obrigatórios estão preenchidos?

Se alguma validação falhar → REJEITA a operação
Se tudo OK → Processa e atualiza BD
```

---

### **RF-17: Assinaturas e Planos**

**O que o sistema faz:**
- Oferecer 3 planos com limites diferentes
- Integrar com Stripe para pagamento
- Bloquear funcionalidades quando limite é atingido
- Permitir upgrade de plano

**Planos disponíveis:**

| Recurso | Básico | Profissional | Enterprise |
|---------|--------|-------------|-----------|
| Produtos | até 500 | até 5.000 | Ilimitado |
| Usuários | 2 | 10 | Ilimitado |
| Locais | 1 | 5 | Ilimitado |
| Relatórios | Básicos | Avançados | Customizados |
| Suporte | Email | Email + Chat | Dedicado |
| Preço | R$ 99/mês | R$ 299/mês | Consultar |

**Fluxo de limite atingido:**
```
Cliente com Plano Básico (500 produtos)
Tenta cadastrar 501º produto

Sistema bloqueia e exibe:
┌─ "⚠️ Limite de produtos atingido!"
├─ "Seu plano permite até 500 produtos. Você tem 500."
├─ "Para adicionar mais, faça upgrade:"
└─ [BOTÃO] Upgrade para Profissional (R$ 299/mês)
   ou
   [BOTÃO] Upgrade para Enterprise (Consulte)
```

**Fluxo de upgrade:**
```
1. Cliente clica em "Upgrade"
2. Sistema apresenta nova opção
3. Cliente clica "Assinar"
4. Redirecionado para Stripe
5. Cliente paga
6. Stripe confirma a Nozesfy
7. Plano atualizado instantaneamente
8. Cliente agora pode cadastrar até 5.000 produtos
```

---

## 📊 Resumo dos Requisitos Funcionais

| RF | Nome | Usuário | Impacto |
|---|---|---|---|
| RF-01 | Cadastro de Produtos | Admin | Dados |
| RF-02 | Controle de Estoque | Admin/Op | Operacional |
| RF-03 | Movimentações | Op | Operacional |
| RF-04 | Entrada de Mercadorias | Op | Operacional |
| RF-05 | Saída de Mercadorias | Op | Operacional |
| RF-06 | Ajustes de Estoque | Admin | Operacional |
| RF-07 | Gestão de Validade | Admin/Op | Operacional |
| RF-08 | Custos e Preços | Admin | Financeiro |
| RF-09 | Alertas Inteligentes | Admin/Op | Operacional |
| RF-10 | Usuários e Permissões | Admin | Segurança |
| RF-11 | Multiestoque | Admin/Op | Logística |
| RF-12 | Relatórios | Admin | Gestão |
| RF-13 | Cadastro de Clientes | Admin/Op | Vendas |
| RF-14 | Fornecedores | Admin | Compras |
| RF-15 | Previsão de Demanda | Admin | Gestão |
| RF-16 | Segurança | Técnico | Infraestrutura |
| RF-17 | Assinaturas | Financeiro | Receita |

---

## ✅ Próximos Passos

1. Verificar se todos os requisitos funcionais são implementáveis
2. Estimar esforço de cada RF
3. Priorizar por impacto no negócio
4. Começar desenvolvimento pelos RF-01, RF-02, RF-03 (core do sistema)
5. Documentar APIs para cada RF
