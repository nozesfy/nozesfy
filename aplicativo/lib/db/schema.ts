import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  subscription_tier: text('subscription_tier').default('basic'),
  subscription_status: text('subscription_status'),
  stripe_customer_id: text('stripe_customer_id'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  full_name: text('full_name'),
  email: text('email').unique(),
  password: text('password'),
  role: text('role').default('member'),
  organization_id: text('organization_id').references(() => organizations.id),
  home_location_id: text('home_location_id'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const inventoryLocations = sqliteTable('inventory_locations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  organization_id: text('organization_id').references(() => organizations.id),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  cnpj: text('cnpj'),
  category: text('category'),
  organization_id: text('organization_id').references(() => organizations.id),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  cpf_cnpj: text('cpf_cnpj'),
  type: text('type'),
  organization_id: text('organization_id').references(() => organizations.id),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  barcode: text('barcode'),
  category: text('category').default('Geral'),
  unit: text('unit').default('unidade'),
  price: real('price').default(0),
  cost_price: real('cost_price').default(0),
  quantity: integer('quantity').default(0),
  min_quantity: integer('min_quantity').default(0),
  max_quantity: integer('max_quantity').default(0),
  stock_by_location: text('stock_by_location', { mode: 'json' }),
  expiry_date: text('expiry_date'),
  supplier_id: text('supplier_id').references(() => suppliers.id),
  organization_id: text('organization_id').references(() => organizations.id),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const stockMovements = sqliteTable('stock_movements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  product_id: text('product_id').notNull().references(() => products.id),
  type: text('type').notNull(), // 'ENTRY' | 'EXIT'
  quantity: integer('quantity').notNull(),
  new_quantity: integer('new_quantity'),
  reason: text('reason'),
  user_id: text('user_id'),
  location_id: text('location_id').references(() => inventoryLocations.id),
  target_location_id: text('target_location_id').references(() => inventoryLocations.id),
  supplier_id: text('supplier_id').references(() => suppliers.id),
  customer_id: text('customer_id').references(() => customers.id),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
  organization: one(organizations, {
    fields: [profiles.organization_id],
    references: [organizations.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [products.organization_id],
    references: [organizations.id],
  }),
  supplier: one(suppliers, {
    fields: [products.supplier_id],
    references: [suppliers.id],
  }),
  stockMovements: many(stockMovements),
}));

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

export const inventoryLocationsRelations = relations(inventoryLocations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [inventoryLocations.organization_id],
    references: [organizations.id],
  }),
  stockMovements: many(stockMovements),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [suppliers.organization_id],
    references: [organizations.id],
  }),
  products: many(products),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organization_id],
    references: [organizations.id],
  }),
  stockMovements: many(stockMovements),
}));

export const organizationInvites = sqliteTable('organization_invites', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organization_id: text('organization_id').notNull().references(() => organizations.id),
  email: text('email').notNull(),
  role: text('role').notNull(),
  location_id: text('location_id').references(() => inventoryLocations.id),
  status: text('status').notNull().default('pending'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

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
