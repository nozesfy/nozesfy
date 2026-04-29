'use server';

import { db } from '@/lib/db';
import { products, stockMovements, inventoryLocations, suppliers, customers, profiles, organizations, organizationInvites } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getSuppliersWithCounts(organizationId: string) {
  try {
    const suppliersData = await db.query.suppliers.findMany({
      where: eq(suppliers.organization_id, organizationId),
      orderBy: (suppliers, { asc }) => [asc(suppliers.name)],
    });

    const productsData = await db.select({ supplier_id: products.supplier_id })
      .from(products)
      .where(eq(products.organization_id, organizationId));
    
    const counts: Record<string, number> = {};
    productsData.forEach(p => {
      if (p.supplier_id) {
        counts[p.supplier_id] = (counts[p.supplier_id] || 0) + 1;
      }
    });

    const result = suppliersData.map(s => ({
      ...s,
      products_count: counts[s.id] || 0
    }));

    return { data: result, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function addSupplier(data: any) {
  try {
    const result = await db.insert(suppliers).values(data).returning();
    revalidatePath('/dashboard/suppliers');
    return { data: result[0], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getStockHistory(organizationId: string) {
  try {
    // Busca apenas os produtos da organização para filtrar as movimentações
    const orgProducts = await db.select({ id: products.id })
      .from(products)
      .where(eq(products.organization_id, organizationId));

    const productIds = orgProducts.map(p => p.id);

    if (productIds.length === 0) return { data: [], error: null };

    const data = await db.query.stockMovements.findMany({
      where: inArray(stockMovements.product_id, productIds),
      with: {
        product: true,
        location: true,
        target_location: true,
        user: true,
      },
      orderBy: (stockMovements, { desc }) => [desc(stockMovements.created_at)],
      limit: 200,
    });
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function addCustomer(data: any) {
  try {
    const result = await db.insert(customers).values(data).returning();
    revalidatePath('/dashboard/customers');
    return { data: result[0], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await db.delete(customers).where(eq(customers.id, id));
    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDashboardStats(organizationId: string) {
  try {
    const productsData = await db.query.products.findMany({
      where: eq(products.organization_id, organizationId),
    });

    const movementsData = await db.query.stockMovements.findMany({
      where: inArray(stockMovements.product_id, productsData.map(p => p.id)),
      with: {
        product: true,
        location: true,
        target_location: true,
        user: true,
      },
      orderBy: (stockMovements, { desc }) => [desc(stockMovements.created_at)],
      limit: 100, // Reduzido para melhorar performance inicial
    });

    // Cálculos no Servidor
    const totalStock = productsData.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    const totalValue = productsData.reduce((acc, curr) => acc + ((curr.cost_price || 0) * (curr.quantity || 0)), 0);
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const alerts: any[] = [];
    productsData.forEach(p => {
      if ((p.quantity || 0) <= (p.min_quantity || 0)) {
        alerts.push({ id: `low-${p.id}`, type: 'CRITICAL', title: 'Ruptura', message: `${p.name} em nível crítico`, productName: p.name });
      } else if (p.expiry_date && new Date(p.expiry_date) < thirtyDaysFromNow) {
        alerts.push({ id: `exp-${p.id}`, type: 'WARNING', title: 'Vencimento', message: `${p.name} próximo do fim`, productName: p.name });
      }
    });

    const productSales: Record<string, { name: string, qty: number }> = {};
    movementsData.forEach(m => {
      if (m.type === 'EXIT') {
        const pName = m.product?.name || 'Produto';
        if (!productSales[m.product_id]) productSales[m.product_id] = { name: pName, qty: 0 };
        productSales[m.product_id].qty += (m.quantity || 0);
      }
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return { 
      data: { 
        stats: {
          totalStock,
          totalValue,
          criticalCount: alerts.filter(a => a.type === 'CRITICAL').length,
          totalAlerts: alerts.length
        },
        alerts: alerts.slice(0, 10), // Apenas os mais importantes
        movements: movementsData.slice(0, 5),
        topProducts
      }, 
      error: null 
    };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function resetBusinessData(organizationId: string) {
  try {
    const productsToDelete = await db.select({ id: products.id }).from(products).where(eq(products.organization_id, organizationId));
    const productIds = productsToDelete.map(p => p.id);

    if (productIds.length > 0) {
      await db.delete(stockMovements).where(inArray(stockMovements.product_id, productIds));
    }

    await Promise.all([
      db.delete(products).where(eq(products.organization_id, organizationId)),
      db.delete(inventoryLocations).where(eq(inventoryLocations.organization_id, organizationId)),
      db.delete(suppliers).where(eq(suppliers.organization_id, organizationId)),
      db.delete(customers).where(eq(customers.organization_id, organizationId)),
    ]);

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProfile(id: string, data: { full_name: string }) {
  try {
    await db.update(profiles).set(data).where(eq(profiles.id, id));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTeamData(organizationId: string) {
  try {
    const members = await db.query.profiles.findMany({
      where: eq(profiles.organization_id, organizationId),
    });
    
    const locationsData = await db.query.inventoryLocations.findMany({
      where: eq(inventoryLocations.organization_id, organizationId),
    });

    return { data: { members, locations: locationsData }, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createOrganization(userId: string, name: string) {
  try {
    const orgId = crypto.randomUUID();
    await db.insert(organizations).values({
      id: orgId,
      name,
      subscription_tier: 'basic',
      subscription_status: 'active',
    });

    await db.update(profiles).set({
      organization_id: orgId,
      role: 'owner',
    }).where(eq(profiles.id, userId));

    revalidatePath('/dashboard');
    return { success: true, data: { id: orgId } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAlerts(organizationId: string) {
  try {
    const productsData = await db.query.products.findMany({
      where: eq(products.organization_id, organizationId),
    });

    const alerts: any[] = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    productsData.forEach((product) => {
      const currentQty = product.quantity || 0;
      const minStock = product.min_quantity || 5;

      if (currentQty <= minStock) {
        alerts.push({
          id: `low-${product.id}`,
          type: 'LOW_STOCK',
          productId: product.id,
          productName: product.name,
          message: `Estoque baixo: apenas ${currentQty} unidades restantes.`,
          severity: currentQty === 0 ? 'critical' : 'high',
          timestamp: new Date().toISOString()
        });
      }

      if (product.expiry_date) {
        const expiry = new Date(product.expiry_date);
        if (expiry < now) {
          alerts.push({
            id: `expired-${product.id}`,
            type: 'EXPIRED',
            productId: product.id,
            productName: product.name,
            message: `PRODUTO VENCIDO! Vencimento em ${expiry.toLocaleDateString()}.`,
            severity: 'critical',
            timestamp: new Date().toISOString()
          });
        } else if (expiry < thirtyDaysFromNow) {
          alerts.push({
            id: `expiring-${product.id}`,
            type: 'EXPIRING_SOON',
            productId: product.id,
            productName: product.name,
            message: `Vencimento próximo: expira em ${expiry.toLocaleDateString()}.`,
            severity: 'medium',
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    return { data: alerts, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function sendInvite(organizationId: string, email: string, role: string, locationId?: string) {
  try {
    await db.insert(organizationInvites).values({
      organization_id: organizationId,
      email,
      role,
      location_id: locationId,
      status: 'pending',
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteInvite(inviteId: string) {
  try {
    await db.delete(organizationInvites).where(eq(organizationInvites.id, inviteId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMemberRole(profileId: string, role: string) {
  try {
    await db.update(profiles).set({ role }).where(eq(profiles.id, profileId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProfileApiKey(profileId: string, apiKey: string) {
  try {
    await db.update(profiles).set({ api_key: apiKey }).where(eq(profiles.id, profileId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteLocation(locationId: string) {
  try {
    await db.delete(inventoryLocations).where(eq(inventoryLocations.id, locationId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInventory(organizationId: string) {
  try {
    const data = await db.query.products.findMany({
      where: eq(products.organization_id, organizationId),
      orderBy: (products, { asc }) => [asc(products.name)],
    });
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getSuppliers(organizationId: string) {
  try {
    const data = await db.query.suppliers.findMany({
      where: eq(suppliers.organization_id, organizationId),
    });
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getCustomers(organizationId: string) {
  try {
    const data = await db.query.customers.findMany({
      where: eq(customers.organization_id, organizationId),
    });
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getLocations(organizationId: string) {
  try {
    const data = await db.query.inventoryLocations.findMany({
      where: eq(inventoryLocations.organization_id, organizationId),
    });
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function addLocation(data: { name: string, description?: string, organization_id: string }) {
  try {
    const existingLocations = await db.query.inventoryLocations.findMany({
      where: eq(inventoryLocations.organization_id, data.organization_id),
    });
    
    const exists = existingLocations.some(loc => loc.name.trim().toLowerCase() === data.name.trim().toLowerCase());
    
    if (exists) {
      return { data: null, error: 'Já existe um local com este nome.' };
    }

    const result = await db.insert(inventoryLocations).values(data).returning();
    revalidatePath('/dashboard/inventory');
    return { data: result[0], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function addProduct(data: any) {
  try {
    const result = await db.insert(products).values(data).returning();
    
    // Se houver quantidade inicial, registrar movimento
    if (data.quantity > 0 && result[0]) {
      await db.insert(stockMovements).values({
        product_id: result[0].id,
        type: 'ENTRY',
        quantity: data.quantity,
        new_quantity: data.quantity,
        reason: 'Saldo inicial de estoque',
        user_id: data.user_id,
      });
    }
    
    revalidatePath('/dashboard/inventory');
    return { data: result[0], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function updateStock(params: {
  productId: string,
  type: 'ENTRY' | 'EXIT' | 'TRANSFER',
  quantity: number,
  locationId: string,
  targetLocationId?: string,
  reason?: string,
  userId?: string,
  supplierId?: string,
  customerId?: string,
}) {
  try {
    const [product] = await db.select().from(products).where(eq(products.id, params.productId)).limit(1);
    if (!product) throw new Error('Produto não encontrado');

    const currentQty = product.quantity || 0;
    const stockByLocation = (product.stock_by_location as any) || {};
    
    let newTotal = currentQty;
    let newStockByLocation = { ...stockByLocation };

    const [location] = await db.select().from(inventoryLocations).where(eq(inventoryLocations.id, params.locationId)).limit(1);
    const locName = location?.name || 'Geral';

    let targetName = '';
    if (params.type === 'TRANSFER' && params.targetLocationId) {
      const [targetLoc] = await db.select().from(inventoryLocations).where(eq(inventoryLocations.id, params.targetLocationId)).limit(1);
      targetName = targetLoc?.name || 'Destino';
      
      newStockByLocation[locName] = (newStockByLocation[locName] || 0) - params.quantity;
      newStockByLocation[targetName] = (newStockByLocation[targetName] || 0) + params.quantity;
    } else {
      const modifier = params.type === 'ENTRY' ? 1 : -1;
      newTotal = currentQty + (params.quantity * modifier);
      newStockByLocation[locName] = (newStockByLocation[locName] || 0) + (params.quantity * modifier);
    }

    if (newTotal < 0) throw new Error('Estoque insuficiente');

    await db.update(products).set({
      quantity: newTotal,
      stock_by_location: newStockByLocation
    }).where(eq(products.id, params.productId));

    await db.insert(stockMovements).values({
      product_id: params.productId,
      type: params.type,
      quantity: params.quantity,
      new_quantity: newTotal,
      reason: params.type === 'TRANSFER' && params.targetLocationId 
        ? (params.reason ? `${params.reason} (Destino: ${targetName})` : `Transferência para ${targetName}`)
        : params.reason,
      location_id: params.locationId,
      target_location_id: params.type === 'TRANSFER' ? params.targetLocationId : null,
      user_id: params.userId,
      supplier_id: params.supplierId || null,
      customer_id: params.customerId || null
    });

    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSupplier(id: string) {
  try {
    await db.delete(suppliers).where(eq(suppliers.id, id));
    revalidatePath('/dashboard/suppliers');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(id: string) {
  try {
    // Delete stock movements first due to foreign key constraint
    await db.delete(stockMovements).where(eq(stockMovements.product_id, id));
    await db.delete(products).where(eq(products.id, id));
    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
