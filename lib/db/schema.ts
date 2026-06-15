// Importa os tipos de coluna do adaptador SQLite do Drizzle ORM
// sqliteTable: cria uma tabela, text: coluna de texto, integer: coluna numérica inteira, real: coluna numérica decimal
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// sql: permite escrever SQL bruto dentro do Drizzle (ex: valor padrão CURRENT_TIMESTAMP)
// relations: define os relacionamentos entre tabelas para queries com joins
import { sql, relations } from 'drizzle-orm';

// ─────────────────────────────────────────────
// TABELA: organizations (Organizações / Empresas)
// Cada usuário dono cria uma organização que agrupa todos os dados
// ─────────────────────────────────────────────
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),                                     // ID único da organização (UUID gerado manualmente)
  name: text('name').notNull(),                                    // Nome da empresa/organização (obrigatório)
  subscription_tier: text('subscription_tier').default('basic'),   // Plano atual: 'basic', 'pro', etc. Padrão: 'basic'
  subscription_status: text('subscription_status'),                // Status da assinatura no Stripe: 'active', 'canceled', etc.
  stripe_customer_id: text('stripe_customer_id'),                  // ID do cliente no Stripe para gerenciar pagamentos
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),  // Data/hora de criação (preenchido automaticamente pelo banco)
});

// ─────────────────────────────────────────────
// TABELA: profiles (Perfis de Usuário)
// Armazena os dados de cada usuário do sistema
// ─────────────────────────────────────────────
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),                                                          // ID único do usuário (UUID)
  full_name: text('full_name'),                                                         // Nome completo (pode ser nulo no cadastro inicial)
  email: text('email').unique(),                                                        // E-mail do usuário (único no banco, não pode repetir)
  password: text('password'),                                                           // Senha criptografada com bcrypt
  role: text('role').default('member'),                                                 // Cargo: 'owner', 'admin', 'operator', 'member'
  organization_id: text('organization_id').references(() => organizations.id),          // Chave estrangeira → vincula o usuário a uma organização
  home_location_id: text('home_location_id'),                                           // Localização padrão do operador (opcional)
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),                       // Data de criação do perfil
});

// ─────────────────────────────────────────────
// TABELA: inventory_locations (Locais de Estoque)
// Representa locais físicos onde o estoque é guardado (ex: Depósito A, Loja 1)
// ─────────────────────────────────────────────
export const inventoryLocations = sqliteTable('inventory_locations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()), // UUID gerado automaticamente pelo JavaScript
  name: text('name').notNull(),                                       // Nome do local (obrigatório)
  description: text('description'),                                   // Descrição opcional do local
  organization_id: text('organization_id').references(() => organizations.id), // Organização proprietária do local
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),    // Data de criação
});

// ─────────────────────────────────────────────
// TABELA: suppliers (Fornecedores)
// Empresas ou pessoas que fornecem produtos
// ─────────────────────────────────────────────
export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()), // UUID gerado automaticamente
  name: text('name').notNull(),                                       // Nome do fornecedor (obrigatório)
  email: text('email'),                                               // E-mail de contato (opcional)
  phone: text('phone'),                                               // Telefone de contato (opcional)
  address: text('address'),                                           // Endereço completo (opcional)
  cnpj: text('cnpj'),                                                 // CNPJ da empresa fornecedora (opcional)
  category: text('category'),                                         // Categoria do fornecedor (ex: 'Alimentos', 'Eletrônicos')
  organization_id: text('organization_id').references(() => organizations.id), // Organização dona deste fornecedor
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),    // Data de cadastro
});

// ─────────────────────────────────────────────
// TABELA: customers (Clientes)
// Clientes que compram os produtos do estoque
// ─────────────────────────────────────────────
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()), // UUID gerado automaticamente
  name: text('name').notNull(),                                       // Nome do cliente (obrigatório)
  email: text('email'),                                               // E-mail do cliente (opcional)
  phone: text('phone'),                                               // Telefone do cliente (opcional)
  address: text('address'),                                           // Endereço do cliente (opcional)
  cpf_cnpj: text('cpf_cnpj'),                                        // CPF (pessoa física) ou CNPJ (pessoa jurídica)
  type: text('type'),                                                 // Tipo: 'PF' (pessoa física) ou 'PJ' (pessoa jurídica)
  organization_id: text('organization_id').references(() => organizations.id), // Organização dona deste cliente
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),    // Data de cadastro
});

// ─────────────────────────────────────────────
// TABELA: products (Produtos do Estoque)
// Armazena todos os produtos cadastrados no inventário
// ─────────────────────────────────────────────
export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),  // UUID gerado automaticamente
  name: text('name').notNull(),                                        // Nome do produto (obrigatório)
  barcode: text('barcode'),                                            // Código de barras (EAN/UPC) para leitura por scanner
  category: text('category').default('Geral'),                        // Categoria do produto. Padrão: 'Geral'
  unit: text('unit').default('unidade'),                              // Unidade de medida: 'unidade', 'kg', 'litro', etc.
  price: real('price').default(0),                                    // Preço de venda (decimal)
  cost_price: real('cost_price').default(0),                          // Preço de custo (decimal) para cálculo de margem
  quantity: integer('quantity').default(0),                           // Quantidade total em estoque
  min_quantity: integer('min_quantity').default(0),                   // Quantidade mínima antes de disparar alerta de reposição
  max_quantity: integer('max_quantity').default(0),                   // Quantidade máxima permitida em estoque
  stock_by_location: text('stock_by_location', { mode: 'json' }),    // JSON com estoque por local { locationId: quantidade }
  expiry_date: text('expiry_date'),                                   // Data de validade do produto (opcional)
  supplier_id: text('supplier_id').references(() => suppliers.id),   // Fornecedor padrão deste produto
  organization_id: text('organization_id').references(() => organizations.id), // Organização dona do produto
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),    // Data de cadastro
});

// ─────────────────────────────────────────────
// TABELA: stock_movements (Movimentações de Estoque)
// Registra cada entrada ou saída de produto — o histórico completo do estoque
// ─────────────────────────────────────────────
export const stockMovements = sqliteTable('stock_movements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),                     // UUID gerado automaticamente
  product_id: text('product_id').notNull().references(() => products.id),                // Produto movimentado (obrigatório)
  type: text('type').notNull(), // 'ENTRY' | 'EXIT'                                      // Tipo da movimentação: ENTRY (entrada) ou EXIT (saída)
  quantity: integer('quantity').notNull(),                                               // Quantidade movimentada nesta operação
  new_quantity: integer('new_quantity'),                                                 // Quantidade total após a movimentação (snapshot)
  reason: text('reason'),                                                                // Motivo da movimentação (ex: 'Venda', 'Compra', 'Transferência')
  user_id: text('user_id'),                                                              // ID do usuário que realizou a movimentação
  location_id: text('location_id').references(() => inventoryLocations.id),             // Local de origem da movimentação
  target_location_id: text('target_location_id').references(() => inventoryLocations.id), // Local de destino (para transferências)
  supplier_id: text('supplier_id').references(() => suppliers.id),                      // Fornecedor (para entradas por compra)
  customer_id: text('customer_id').references(() => customers.id),                      // Cliente (para saídas por venda)
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),                       // Data/hora da movimentação
});

// ─────────────────────────────────────────────
// RELACIONAMENTOS (Relations)
// Define como o Drizzle deve fazer JOINs entre as tabelas
// Isso permite usar "with: { organization: true }" nas queries
// ─────────────────────────────────────────────

// Um perfil pertence a uma organização
export const profilesRelations = relations(profiles, ({ one }) => ({
  organization: one(organizations, {
    fields: [profiles.organization_id],    // Campo local (chave estrangeira)
    references: [organizations.id],        // Campo referenciado na tabela organizations
  }),
}));

// Um produto pertence a uma organização, a um fornecedor, e tem muitas movimentações
export const productsRelations = relations(products, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [products.organization_id],
    references: [organizations.id],
  }),
  supplier: one(suppliers, {
    fields: [products.supplier_id],
    references: [suppliers.id],
  }),
  stockMovements: many(stockMovements), // Um produto pode ter muitas movimentações
}));

// Uma movimentação pertence a um produto, local de origem, local de destino, fornecedor, cliente e usuário
export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, {
    fields: [stockMovements.product_id],
    references: [products.id],
  }),
  location: one(inventoryLocations, {
    fields: [stockMovements.location_id],
    references: [inventoryLocations.id],
  }),
  target_location: one(inventoryLocations, {
    fields: [stockMovements.target_location_id],
    references: [inventoryLocations.id],
  }),
  supplier: one(suppliers, {
    fields: [stockMovements.supplier_id],
    references: [suppliers.id],
  }),
  customer: one(customers, {
    fields: [stockMovements.customer_id],
    references: [customers.id],
  }),
  user: one(profiles, {
    fields: [stockMovements.user_id],
    references: [profiles.id],
  }),
}));

// Um local de estoque pertence a uma organização e tem muitas movimentações
export const inventoryLocationsRelations = relations(inventoryLocations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [inventoryLocations.organization_id],
    references: [organizations.id],
  }),
  stockMovements: many(stockMovements),
}));

// Um fornecedor pertence a uma organização e tem muitos produtos
export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [suppliers.organization_id],
    references: [organizations.id],
  }),
  products: many(products),
}));

// Um cliente pertence a uma organização e tem muitas movimentações (compras)
export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organization_id],
    references: [organizations.id],
  }),
  stockMovements: many(stockMovements),
}));

// ─────────────────────────────────────────────
// TABELA: organization_invites (Convites para Organizações)
// Permite convidar membros para a organização por e-mail
// ─────────────────────────────────────────────
export const organizationInvites = sqliteTable('organization_invites', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),                    // UUID gerado automaticamente
  organization_id: text('organization_id').notNull().references(() => organizations.id), // Organização que enviou o convite
  email: text('email').notNull(),                                                        // E-mail do convidado (obrigatório)
  role: text('role').notNull(),                                                          // Cargo que será atribuído ao convidado
  location_id: text('location_id').references(() => inventoryLocations.id),             // Local onde o convidado atuará (opcional)
  status: text('status').notNull().default('pending'),                                  // Status do convite: 'pending', 'accepted', 'rejected'
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),                       // Data de envio do convite
});

// Um convite pertence a uma organização e opcionalmente a um local
export const organizationInvitesRelations = relations(organizationInvites, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvites.organization_id],
    references: [organizations.id],
  }),
  location: one(inventoryLocations, {
    fields: [organizationInvites.location_id],
    references: [inventoryLocations.id],
  }),
}));
