// Marca este arquivo como Server Action do Next.js
// Todo o código aqui roda APENAS no servidor (nunca no navegador)
'use server';

// Instância do banco de dados configurada em lib/db/index.ts
import { db } from '@/lib/db';

// Importa as tabelas do schema para usar nas queries
import { products, stockMovements, inventoryLocations, suppliers, customers, profiles, organizations, organizationInvites } from '@/lib/db/schema';

// Operadores lógicos do Drizzle ORM
import { eq, and, inArray } from 'drizzle-orm';

// revalidatePath: limpa o cache do Next.js para forçar a atualização da UI
import { revalidatePath } from 'next/cache';

/**
 * GETSUPPLIERSWITHCOUNTS — Busca todos os fornecedores da organização e conta quantos produtos cada um tem.
 */
export async function getSuppliersWithCounts(organizationId: string) {
  try {
    // Busca a lista de fornecedores ordenados alfabeticamente
    const suppliersData = await db.query.suppliers.findMany({
      where: eq(suppliers.organization_id, organizationId),
      orderBy: (suppliers, { asc }) => [asc(suppliers.name)],
    });

    // Busca apenas o campo 'supplier_id' de todos os produtos da organização
    const productsData = await db.select({ supplier_id: products.supplier_id })
      .from(products)
      .where(eq(products.organization_id, organizationId));
    
    // Calcula a contagem de produtos por fornecedor
    const counts: Record<string, number> = {};
    productsData.forEach(p => {
      if (p.supplier_id) {
        counts[p.supplier_id] = (counts[p.supplier_id] || 0) + 1;
      }
    });

    // Adiciona a contagem 'products_count' a cada fornecedor retornado
    const result = suppliersData.map(s => ({
      ...s,
      products_count: counts[s.id] || 0
    }));

    return { data: result, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * ADDSUPPLIER — Adiciona um novo fornecedor.
 */
export async function addSupplier(data: any) {
  try {
    const result = await db.insert(suppliers).values(data).returning();
    revalidatePath('/dashboard/suppliers'); // Atualiza a página de fornecedores
    return { data: result[0], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * GETSTOCKHISTORY — Busca o histórico de movimentações (entradas, saídas, transferências).
 */
export async function getStockHistory(organizationId: string) {
  try {
    // 1. Busca os IDs de todos os produtos pertencentes à organização
    const orgProducts = await db.select({ id: products.id })
      .from(products)
      .where(eq(products.organization_id, organizationId));

    const productIds = orgProducts.map(p => p.id);

    // Se não há produtos, não há histórico
    if (productIds.length === 0) return { data: [], error: null };

    // 2. Busca as movimentações relacionadas a esses produtos
    const data = await db.query.stockMovements.findMany({
      where: inArray(stockMovements.product_id, productIds),
      with: {
        product: true,
        location: true,
        target_location: true,
        user: true,
      },
      orderBy: (stockMovements, { desc }) => [desc(stockMovements.created_at)],
      limit: 200, // Limita a 200 registros recentes por performance
    });
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * ADDCUSTOMER — Cadastra um novo cliente.
 */
export async function addCustomer(data: any) {
  try {
    const result = await db.insert(customers).values(data).returning();
    revalidatePath('/dashboard/customers'); // Atualiza a tabela na UI
    return { data: result[0], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * DELETECUSTOMER — Remove um cliente do banco.
 */
export async function deleteCustomer(id: string) {
  try {
    await db.delete(customers).where(eq(customers.id, id));
    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * GETDASHBOARDSTATS — Compila as estatísticas para o painel principal (Dashboard).
 * Inclui: total de estoque, valor financeiro estimado, produtos críticos, etc.
 */
export async function getDashboardStats(organizationId: string) {
  try {
    // Busca todos os produtos da organização
    const productsData = await db.query.products.findMany({
      where: eq(products.organization_id, organizationId),
    });

    // Busca as últimas movimentações de estoque da organização
    const movementsData = await db.query.stockMovements.findMany({
      where: inArray(stockMovements.product_id, productsData.map(p => p.id)),
      with: {
        product: true,
        location: true,
        target_location: true,
        user: true,
      },
      orderBy: (stockMovements, { desc }) => [desc(stockMovements.created_at)],
      limit: 100, // Limite para melhorar a performance de carregamento inicial
    });

    // --- CÁLCULOS FEITOS NO SERVIDOR ---
    
    // Soma a quantidade total de itens no estoque
    const totalStock = productsData.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    // Multiplica quantidade x preço de custo para estimar o valor financeiro do estoque
    const totalValue = productsData.reduce((acc, curr) => acc + ((curr.cost_price || 0) * (curr.quantity || 0)), 0);
    
    // Data atual e data limite para vencimento (30 dias no futuro)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    // Avalia alertas (ruptura de estoque ou vencimento próximo)
    const alerts: any[] = [];
    productsData.forEach(p => {
      // Alerta crítico se a quantidade estiver abaixo do mínimo configurado
      if ((p.quantity || 0) <= (p.min_quantity || 0)) {
        alerts.push({ id: `low-${p.id}`, type: 'CRITICAL', title: 'Ruptura', message: `${p.name} em nível crítico`, productName: p.name });
      } 
      // Alerta de atenção se a validade expirar em menos de 30 dias
      else if (p.expiry_date && new Date(p.expiry_date) < thirtyDaysFromNow) {
        alerts.push({ id: `exp-${p.id}`, type: 'WARNING', title: 'Vencimento', message: `${p.name} próximo do fim`, productName: p.name });
      }
    });

    // Agrupa e conta a saída de produtos para determinar o "Top 5 Mais Vendidos"
    const productSales: Record<string, { name: string, qty: number }> = {};
    movementsData.forEach(m => {
      if (m.type === 'EXIT') { // Considera apenas saídas
        const pName = m.product?.name || 'Produto';
        if (!productSales[m.product_id]) productSales[m.product_id] = { name: pName, qty: 0 };
        productSales[m.product_id].qty += (m.quantity || 0);
      }
    });

    // Ordena do maior para o menor e pega os 5 primeiros
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Retorna a estrutura final que a página Dashboard vai renderizar
    return { 
      data: { 
        stats: {
          totalStock,
          totalValue,
          criticalCount: alerts.filter(a => a.type === 'CRITICAL').length,
          totalAlerts: alerts.length
        },
        alerts: alerts.slice(0, 10), // Apenas os 10 mais importantes para a UI inicial
        movements: movementsData.slice(0, 5), // As 5 movimentações mais recentes
        topProducts
      }, 
      error: null 
    };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * RESETBUSINESSDATA — "Zera" a empresa. Exclui todo o estoque, produtos, contatos e locais.
 * ATENÇÃO: Ação irreversível usada na página de configurações.
 */
export async function resetBusinessData(organizationId: string) {
  try {
    // Identifica quais produtos serão apagados
    const productsToDelete = await db.select({ id: products.id }).from(products).where(eq(products.organization_id, organizationId));
    const productIds = productsToDelete.map(p => p.id);

    // Se houver produtos, apaga as movimentações deles primeiro (regra de Chave Estrangeira)
    if (productIds.length > 0) {
      await db.delete(stockMovements).where(inArray(stockMovements.product_id, productIds));
    }

    // Apaga todas as outras entidades vinculadas à organização em paralelo
    await Promise.all([
      db.delete(products).where(eq(products.organization_id, organizationId)),
      db.delete(inventoryLocations).where(eq(inventoryLocations.organization_id, organizationId)),
      db.delete(suppliers).where(eq(suppliers.organization_id, organizationId)),
      db.delete(customers).where(eq(customers.organization_id, organizationId)),
    ]);

    revalidatePath('/dashboard'); // Força a atualização da UI após reset
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * UPDATEPROFILE — Atualiza o nome completo de um usuário.
 */
export async function updateProfile(id: string, data: { full_name: string }) {
  try {
    await db.update(profiles).set(data).where(eq(profiles.id, id));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * GETTEAMDATA — Retorna a lista de membros e de locais de estoque de uma organização.
 * Usado para a tela de configurações de equipe/locais.
 */
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

/**
 * CREATEORGANIZATION — Cria a empresa inicial quando o usuário faz cadastro.
 */
export async function createOrganization(userId: string, name: string) {
  try {
    const orgId = crypto.randomUUID();
    // Insere a nova organização
    await db.insert(organizations).values({
      id: orgId,
      name,
      subscription_tier: 'basic',
      subscription_status: 'active',
    });

    // Atualiza o perfil do usuário vinculando-o a esta organização como dono (owner)
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

/**
 * GETALERTS — Busca todos os alertas detalhados (Ruptura e Vencimento) para a página dedicada a alertas.
 */
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

      // Alertas de estoque
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

      // Alertas de validade
      if (product.expiry_date) {
        const expiry = new Date(product.expiry_date);
        // Já vencido = Crítico
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
        } 
        // Vencendo nos próximos 30 dias = Atenção
        else if (expiry < thirtyDaysFromNow) {
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

/**
 * SENDINVITE — Cria um convite pendente para um novo membro na organização.
 */
export async function sendInvite(organizationId: string, email: string, role: string, locationId?: string) {
  try {
    await db.insert(organizationInvites).values({
      organization_id: organizationId,
      email,
      role,
      location_id: locationId, // Pode ser null se o acesso não for restrito a um local
      status: 'pending',
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * DELETEINVITE — Cancela/exclui um convite enviado anteriormente.
 */
export async function deleteInvite(inviteId: string) {
  try {
    await db.delete(organizationInvites).where(eq(organizationInvites.id, inviteId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * UPDATEMEMBERROLE — Altera o cargo (role) de um usuário existente na organização.
 */
export async function updateMemberRole(profileId: string, role: string) {
  try {
    await db.update(profiles).set({ role }).where(eq(profiles.id, profileId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * UPDATEPROFILEAPIKEY — Gera ou atualiza uma chave de API para o perfil do usuário.
 */
export async function updateProfileApiKey(profileId: string, apiKey: string) {
  try {
    await db.update(profiles).set({ api_key: apiKey }).where(eq(profiles.id, profileId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * DELETELOCATION — Apaga um local de estoque físico/virtual.
 */
export async function deleteLocation(locationId: string) {
  try {
    await db.delete(inventoryLocations).where(eq(inventoryLocations.id, locationId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * GETINVENTORY — Retorna a lista completa de produtos em estoque, ordenados por nome.
 */
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

/**
 * GETSUPPLIERS — Busca apenas a listagem simples de fornecedores.
 */
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

/**
 * GETCUSTOMERS — Busca os clientes cadastrados.
 */
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

/**
 * GETLOCATIONS — Busca todos os depósitos/locais físicos da organização.
 */
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

/**
 * ADDLOCATION — Cria um novo depósito ou seção de estoque. 
 * Verifica duplicidade de nomes.
 */
export async function addLocation(data: { name: string, description?: string, organization_id: string }) {
  try {
    // Procura por locais existentes para evitar nomes duplicados
    const existingLocations = await db.query.inventoryLocations.findMany({
      where: eq(inventoryLocations.organization_id, data.organization_id),
    });
    
    // Compara ignorando maiúsculas e espaços extras
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

/**
 * ADDPRODUCT — Insere um novo produto no catálogo e registra saldo inicial.
 */
export async function addProduct(data: any) {
  try {
    // Insere os dados do produto no banco
    const result = await db.insert(products).values(data).returning();
    
    // Se foi informada uma quantidade inicial > 0, cria imediatamente um registro de entrada (movimentação)
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
    
    revalidatePath('/dashboard/inventory'); // Atualiza a tabela de inventário na UI
    return { data: result[0], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * UPDATESTOCK — A ação mais complexa: processa entradas, saídas e transferências de estoque.
 * Mantém sincronizada a tabela de Produtos com o Histórico de Movimentação e o Estoque por Local.
 */
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
    // 1. Pega os dados atuais do produto do banco
    const [product] = await db.select().from(products).where(eq(products.id, params.productId)).limit(1);
    if (!product) throw new Error('Produto não encontrado');

    const currentQty = product.quantity || 0;
    // O campo stock_by_location guarda quanto do produto está em cada local (em JSON)
    const stockByLocation = (product.stock_by_location as any) || {};
    
    let newTotal = currentQty;
    let newStockByLocation = { ...stockByLocation };

    // 2. Resolve o nome do local de origem da movimentação
    const [location] = await db.select().from(inventoryLocations).where(eq(inventoryLocations.id, params.locationId)).limit(1);
    const locName = location?.name || 'Geral';

    let targetName = '';
    
    // 3. Aplica as regras matemáticas dependendo do tipo da operação
    if (params.type === 'TRANSFER' && params.targetLocationId) {
      // --- TRANSFERÊNCIA ---
      // Tira quantidade do local A e coloca no local B. O total geral da empresa não muda.
      const [targetLoc] = await db.select().from(inventoryLocations).where(eq(inventoryLocations.id, params.targetLocationId)).limit(1);
      targetName = targetLoc?.name || 'Destino';
      
      newStockByLocation[locName] = (newStockByLocation[locName] || 0) - params.quantity;
      newStockByLocation[targetName] = (newStockByLocation[targetName] || 0) + params.quantity;
    } else {
      // --- ENTRADA ou SAÍDA ---
      // Entrada = +1 | Saída = -1
      const modifier = params.type === 'ENTRY' ? 1 : -1;
      
      // Atualiza o total geral
      newTotal = currentQty + (params.quantity * modifier);
      
      // Atualiza a contagem daquele local específico
      newStockByLocation[locName] = (newStockByLocation[locName] || 0) + (params.quantity * modifier);
    }

    // Trava de segurança: impede que a movimentação deixe o saldo geral negativo
    if (newTotal < 0) throw new Error('Estoque insuficiente');

    // 4. Salva a nova quantidade e JSON de locais na tabela products
    await db.update(products).set({
      quantity: newTotal,
      stock_by_location: newStockByLocation
    }).where(eq(products.id, params.productId));

    // 5. Salva um registro imutável do que ocorreu na tabela stock_movements (histórico/auditoria)
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

    revalidatePath('/dashboard/inventory'); // Atualiza a tela do usuário com os novos saldos
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * DELETESUPPLIER — Apaga um fornecedor do banco de dados.
 */
export async function deleteSupplier(id: string) {
  try {
    await db.delete(suppliers).where(eq(suppliers.id, id));
    revalidatePath('/dashboard/suppliers');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * DELETEPRODUCT — Apaga um produto e todo o seu histórico.
 */
export async function deleteProduct(id: string) {
  try {
    // Apaga as movimentações (histórico) PRIMEIRO devido à restrição de chave estrangeira
    await db.delete(stockMovements).where(eq(stockMovements.product_id, id));
    
    // Em seguida apaga o produto
    await db.delete(products).where(eq(products.id, id));
    
    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

