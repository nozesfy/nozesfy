// Importa o SDK oficial do Stripe para Node.js
import Stripe from 'stripe';

// Cria e exporta uma instância configurada do cliente Stripe
// process.env.STRIPE_SECRET_KEY! — a chave secreta do Stripe (definida no .env)
// O "!" diz ao TypeScript que a variável sempre existirá (não é undefined)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any, // Versão da API do Stripe que queremos usar
  appInfo: {
    name: 'Nozesfy',    // Nome do app (aparece nos logs do dashboard Stripe)
    version: '0.1.0',   // Versão do app
  },
});
