// Importa o adaptador Drizzle ORM específico para o driver better-sqlite3
import { drizzle } from 'drizzle-orm/better-sqlite3';

// Driver nativo do SQLite para Node.js — lê e escreve no arquivo .db local
import Database from 'better-sqlite3';

// Importa todo o schema (tabelas e relacionamentos) definido em schema.ts
import * as schema from './schema';

// Módulo nativo do Node.js para manipulação de caminhos de arquivo
import path from 'path';

// Resolve o caminho absoluto até o arquivo sqlite.db na raiz do projeto
// process.cwd() retorna o diretório onde o processo Node.js foi iniciado
const dbPath = path.resolve(process.cwd(), 'sqlite.db');

// Abre (ou cria, se não existir) o arquivo de banco de dados SQLite
const sqlite = new Database(dbPath);

// Cria e exporta a instância do Drizzle ORM configurada com o banco SQLite e o schema
// "db" é o objeto principal usado em todo o projeto para fazer queries
export const db = drizzle(sqlite, { schema });
