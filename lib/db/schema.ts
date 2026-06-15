import { pgTable, text, integer, doublePrecision, uuid, jsonb } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  subscription_tier: text('subscription_tier').default('basic'),
  subscription_status: text('subscription_status'),
  stripe_customer_id: text('stripe_customer_id'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  full_name: text('full_name'),
  email: text('email').unique(),
  password: text('password'),
  role: text('role').default('member'),
  organization_id: text('organization_id').references(() => organizations.id),
  home_location_id: text('home_location_id'),
  api_key: text('api_key'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const inventoryLocations = pgTable('inventory_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  organization_id: text('organization_id').references(() => organizations.id),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  cnpj: text('cnpj'),
  category: text('category'),
  organization_id: text('organization_id').references(() => organizations.id),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  cpf_cnpj: text('cpf_cnpj'),
  type: text('type'),
  organization_id: text('organization_id').references(() => organizations.id),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  barcode: text('barcode'),
  category: text('category').default('Geral'),
  unit: text('unit').default('unidade'),
  price: doublePrecision('price').default(0),
  cost_price: doublePrecision('cost_price').default(0),
  quantity: integer('quantity').default(0),
  min_quantity: integer('min_quantity').default(0),
  max_quantity: integer('max_quantity').default(0),
  stock_by_location: jsonb('stock_by_location'),
  expiry_date: text('expiry_date'),
  supplier_id: uuid('supplier_id').references(() => suppliers.id),
  organization_id: text('organization_id').references(() => organizations.id),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  product_id: uuid('product_id').notNull().references(() => products.id),
  type: text('type').notNull(),
  quantity: integer('quantity').notNull(),
  new_quantity: integer('new_quantity'),
  reason: text('reason'),
  user_id: text('user_id'),
  location_id: uuid('location_id').references(() => inventoryLocations.id),
  target_location_id: uuid('target_location_id').references(() => inventoryLocations.id),
  supplier_id: uuid('supplier_id').references(() => suppliers.id),
  customer_id: uuid('customer_id').references(() => customers.id),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const organizationInvites = pgTable('organization_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  organization_id: text('organization_id').notNull().references(() => organizations.id),
  email: text('email').notNull(),
  role: text('role').notNull(),
  location_id: uuid('location_id').references(() => inventoryLocations.id),
  status: text('status').notNull().default('pending'),
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
