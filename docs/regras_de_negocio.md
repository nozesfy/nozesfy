# 📋 REGRAS DE NEGÓCIO - Nozesfy

**Projeto:** Nozesfy - Plataforma SaaS de Gestão de Estoque  
**Website:** nozesfy.com  
**Stack:** Next.js + Tailwind + Cloudflare Pages + MongoDB Atlas + Stripe  
**Data:** Abril 2025

---

## 🎯 O que são Regras de Negócio?

**Regras de Negócio (RN)** são as **restrições, políticas e processos** que definem como o sistema deve funcionar do ponto de vista do negócio. Elas respondem a pergunta: **"Como e por que fazemos as coisas dessa forma?"**

Diferente de requisitos, as RNs não descrevem o QUE o sistema faz, mas SIM como ele deve se comportar em situações reais do negócio.

---

## 🏗️ REGRAS DE NEGÓCIO

### **RN-01: Controle de Estoque Inteligente**

**Regra:**
- O estoque **nunca pode ficar negativo**
- Todo produto obrigatoriamente deve ter:
  - **Quantidade Mínima:** limite abaixo do qual alertas são disparados
  - **Quantidade Máxima:** limite para compras automáticas ou alertas
- Cada movimentação deve atualizar o estoque **em tempo real**
- O controle é feito por **local** (multiestoque: loja, depósito, etc.)

**Por que?**
- Estoques negativos criam problemas legais (venda de itens inexistentes) e operacionais (promessas que não podem ser cumpridas)
- Quantidades mín/máx evitam falta de produtos ou excesso que gasta espaço e dinheiro
- Multiestoque permite controle descentralizado em redes de lojas/depósitos
- Atualização em tempo real garante que decisões sejam baseadas em dados corretos

**Exemplo prático:**
```
Produto: Arroz 5kg
Qtd Mín: 50 unidades (abaixo disso, alerta!)
Qtd Máx: 200 unidades (não compra mais)
Local: Loja 1 - 150 unidades, Depósito 2 - 300 unidades
Se vender 80 unidades na Loja 1: 150 - 80 = 70 (OK)
Se tentar vender 100 unidades e tem 80: Sistema BLOQUEIA
```

---

### **RN-02: Classificação de Movimentações**

**Regra:**
- O sistema registra e classifica todas as movimentações em:
  - **ENTRADA:** compra de fornecedor, reposição, devoluções
  - **SAÍDA:** venda ao cliente, consumo interno, furto/perda
  - **AJUSTE:** correções de inventário, danos, vencimentos
- Cada movimentação impacta **imediatamente** o saldo
- Sistema mantém histórico completo auditável

**Por que?**
- Classificação permite análises: quais produtos vendem mais, quais ficam parados, rotatividade
- Impacto imediato garante sincronização perfeita entre realidade operacional e sistema
- Auditoria atende conformidade legal (LGPD, impostos) e controle interno

**Exemplo:**
```
15/04/2025 10:30 - ENTRADA: 50 unidades de Arroz (Fornecedor X)
15/04/2025 11:00 - SAÍDA: 5 unidades de Arroz (Venda PDV - João Silva)
15/04/2025 14:30 - AJUSTE: -2 unidades de Arroz (Dano em transporte)
Resultado final: 50 - 5 - 2 = 43 unidades
```

---

### **RN-03: Informações Obrigatórias em Movimentações**

**Regra:**
Toda movimentação DEVE conter:
1. **Data e Hora** - rastreabilidade temporal
2. **ID do Usuário** - responsabilidade pessoal
3. **Categoria** - tipo da movimentação (entrada/saída/ajuste)
4. **ID do Produto** - qual item foi movimentado
5. **Quantidade** - quanto foi movimentado
6. **Validade** - data de vencimento (se aplicável)
7. **Motivo/Justificativa** - por que foi feito (obrigatório em ajustes)

**Por que?**
- Rastreabilidade 100%: você consegue saber quem fez o quê, quando e por quê
- Segurança: evita fraudes ("sumiu estoque" - alguém foi negligente)
- Conformidade: auditorias internas/externas exigem essa documentação
- Análise: identifica padrões e responsáveis por desvios

**Exemplo:**
```json
{
  "movimentacao_id": "MOV-2025-04-15-001",
  "data_hora": "2025-04-15T10:30:00Z",
  "usuario_id": "USER-127",
  "usuario_nome": "João Silva",
  "categoria": "ENTRADA",
  "produto_id": "PROD-5",
  "produto_nome": "Arroz Integral 5kg",
  "quantidade": 50,
  "data_validade": "2026-04-15",
  "motivo": "Compra de fornecedor - NF-e 12345",
  "local": "Depósito Principal"
}
```

---

### **RN-04: Cálculo Automático de Custo Médio**

**Regra:**
- Sistema calcula **custo médio automático** de cada produto
- Cada produto tem:
  - **Preço de Compra:** o que pagamos ao fornecedor
  - **Preço de Venda:** o que o cliente paga
- Mudanças de custo refletem **automaticamente** em:
  - Relatórios financeiros
  - Valorização do estoque (quanto vale todo o estoque em dinheiro)
- Histórico de custos é preservado para análises

**Por que?**
- Custo médio é a forma mais justa de calcular lucro (não usa primeira compra ou última)
- Atualização automática evita erros manuais em cálculos
- Histórico permite rastrear quando preços mudaram (mudanças de fornecedor)
- Essencial para contabilidade: saber quanto custa manter o estoque em dinheiro

**Fórmula:**
```
Custo Médio = (Quantidade Total × Custo Anterior + Nova Compra Qtd × Novo Custo) / Quantidade Total Atualizada

Exemplo:
Tinha 100 unidades ao custo de R$ 10 = R$ 1.000
Comprei 50 unidades a R$ 12 = R$ 600
Custo Médio = (100×10 + 50×12) / 150 = 1.600 / 150 = R$ 10,67
```

---

### **RN-05: Alertas Inteligentes e Automáticos**

**Regra:**
Sistema notifica automaticamente quando:
1. **Estoque Mínimo:** produto abaixo da quantidade mínima
2. **Produto Parado:** sem movimentação por X dias (configurável)
3. **Vencimento Próximo:** produto perto de vencer (30 dias antes)
4. **Produto Vencido:** sem movimentação após vencer

Canais de notificação:
- Dashboard (visual em tempo real)
- E-mail (notificação formal)
- WhatsApp (urgência imediata)

**Por que?**
- Impede vendas de produtos parados (perda de dinheiro)
- Evita vendas acidentais de vencidos (legal + reputação)
- Alertas automáticos descentralizam responsabilidade (ninguém pode dizer "não sabia")
- Múltiplos canais garantem que a mensagem chegue

**Exemplo de regra:**
```
SE estoque_atual < estoque_minimo E produto_tipo != "descartável"
  ENTÃO enviar_alerta("CRÍTICO", ["dashboard", "email", "whatsapp"])

SE dias_sem_movimentacao > 90 E custo_total > R$ 1.000
  ENTÃO enviar_alerta("AÇÃO", ["dashboard", "email"])

SE data_vencimento - data_hoje ENTRE 30 dias E 1 dia
  ENTÃO enviar_alerta("MODERADO", ["dashboard"])
```

---

### **RN-06: Controle de Acesso por Perfil**

**Regra:**
Dois perfis de acesso:

**Administrador:**
- Acesso total ao sistema
- Pode criar/editar produtos, usuários, configurações
- Pode ver relatórios financeiros completos
- Pode fazer ajustes sem limitação

**Operador:**
- Acesso RESTRITO a movimentações de estoque
- Pode fazer entrada/saída/ajuste (com justificativa)
- Não pode ver custos/preços (confidencial)
- Não pode criar produtos nem usuários

Todas as ações geram **logs de auditoria obrigatórios**

**Por que?**
- Segurança: operador não precisa de acesso a dados sensíveis (preços, custos)
- Responsabilidade: cada ação tem responsável identificado
- Conformidade: auditorias externas exigem rastreabilidade
- Integridade: impede que operador altere dados de outros operadores

**Exemplo:**
```
Operador tenta deletar produto:
Sistema bloqueia e registra log:
"USER-45 tentou deletar PROD-120 às 14:35 - BLOQUEADO (permissão insuficiente)"
```

---

### **RN-07: Multiestoque com Transferências**

**Regra:**
- Sistema controla estoque em múltiplos locais (loja, depósito, filial)
- Cada local tem seu próprio saldo independente
- Permite transferências entre locais
- Transferência é registrada como SAÍDA de um local + ENTRADA em outro

**Por que?**
- Redes de lojas precisam distribuir produtos entre unidades
- Cada local precisa saber seu próprio estoque real
- Transferência rastreável evita perdas no transporte
- Otimiza logística: move produtos para onde há demanda

**Exemplo:**
```
Loja 1: 150 unidades de Arroz
Depósito: 300 unidades de Arroz

Transferir 100 unidades de Depósito → Loja 1
Resultado:
  Loja 1: 150 + 100 = 250
  Depósito: 300 - 100 = 200

Sistema registra:
  SAÍDA no Depósito: 100 unidades (Transferência)
  ENTRADA na Loja 1: 100 unidades (Transferência)
```

---

### **RN-08: Relatórios Gerenciais Essenciais**

**Regra:**
Sistema gera automaticamente:
1. **Posição de Estoque:** quanto há de cada produto por local
2. **Histórico de Movimentações:** todas as entradas/saídas/ajustes
3. **Produtos Mais Vendidos:** ranking de vendas
4. **Produtos Menos Vendidos:** itens de baixa demanda
5. **Produtos Parados:** sem movimento há X dias
6. **Giro de Estoque:** quantas vezes o estoque "roda" no período
7. **Valorização de Estoque:** quanto vale TODO o estoque em dinheiro

**Por que?**
- Gestão baseada em dados: decisões sobre o quê comprar, vender, descartar
- Produtos parados = dinheiro parado = prejuízo
- Giro de estoque indica saúde financeira
- Valorização permite contabilidade correta e decisões de investimento

---

### **RN-09: Segurança e Confiabilidade Máxima**

**Regra:**
- Backup automático dos dados (mínimo 2x por dia)
- Controle de concorrência: dois usuários não podem mexer no mesmo produto ao mesmo tempo
- **TODAS** as validações críticas ocorrem no BACKEND (nunca confiar em frontend)
- Sistema previne conflitos de estoque

**Por que?**
- Perda de dados = fechamento da empresa
- Concorrência mal controlada = números errados (dois vendedores tiram do mesmo estoque)
- Frontend pode ser burlado (JavaScript pode ser modificado)
- Backend é confiável: validações ali são invioláveis

**Exemplo de conflito de concorrência:**
```
Situação SEM controle:
  Estoque: 50 unidades
  Operador 1 vende 30 (quer deixar 20)
  Operador 2 vende 25 (quer deixar 25)
  Ambos leem 50 ao mesmo tempo
  Operador 1: 50 - 30 = 20 ✓
  Operador 2: 50 - 25 = 25 ✓
  Sistema salva ambas, resultado final: 25 ou 20 (ERRADO!)
  
Situação COM controle (lock):
  Operador 1 BLOQUEIA estoque
  Lê: 50, calcula: 50 - 30 = 20, salva 20
  Libera bloqueio
  Operador 2 BLOQUEIA estoque
  Lê: 20, calcula: 20 - 25 = -5, REJEITA (estoque negativo!)
```

---

### **RN-10: Assinaturas e Planos com Limites**

**Regra:**
Sistema opera por **assinatura** (SaaS model):
- **Plano Básico:** até 500 produtos, 2 usuários
- **Plano Profissional:** até 5.000 produtos, 10 usuários
- **Plano Enterprise:** ilimitado, com suporte dedicado

Pagamento via **Stripe** (recorrente mensal ou anual)

Ao atingir limite: funcionalidades são BLOQUEADAS até upgrade

**Por que?**
- Modelo de receita recorrente (previsível, escalável)
- Limites evitam overload de banco de dados
- Incentiva upgrade natural (cliente cresce, precisa de mais)
- Stripe fornece pagamento seguro e compliance

**Exemplo:**
```
Cliente com Plano Básico tenta cadastrar 501º produto:
Sistema bloqueia e exibe:
"Você atingiu o limite de 500 produtos no seu plano.
Upgrade para Profissional para continuar."
```

---

## 📊 Resumo Visual das Regras

| RN | Nome | Impacto | Validação |
|---|---|---|---|
| RN-01 | Controle de Estoque | Operacional | Backend |
| RN-02 | Classificação de Movimentações | Análise | Backend |
| RN-03 | Informações Obrigatórias | Auditoria | Frontend + Backend |
| RN-04 | Custo Médio Automático | Financeiro | Backend |
| RN-05 | Alertas Inteligentes | Operacional | Backend |
| RN-06 | Controle de Acesso | Segurança | Backend |
| RN-07 | Multiestoque | Logística | Backend |
| RN-08 | Relatórios | Gestão | Backend |
| RN-09 | Segurança/Confiabilidade | Confiança | Backend |
| RN-10 | Assinaturas/Planos | Receita | Backend |

---

## 🔗 Próximos Passos

1. **Requisitos Funcionais (RF):** O QUE o sistema faz (operações concretas)
2. **Requisitos Não Funcionais (RNF):** COMO o sistema se comporta (desempenho, segurança, etc)
3. **Modelagem de Dados:** Estrutura do banco (MongoDB)
4. **APIs:** Endpoints que implementam essas regras
5. **Testes:** Validar que cada regra está sendo respeitada

---

## ✅ Checklist de Implementação

- [ ] Validação de estoque negativo em todas as movimentações
- [ ] Alertas automáticos disparam conforme configurado
- [ ] Logs de auditoria registram TODAS as ações
- [ ] Stripe integrado e testado
- [ ] MongoDB com controle de concorrência
- [ ] Backups automáticos configurados
- [ ] Testes de múltiplos usuários simultâneos
- [ ] Documentação de API atualizada
