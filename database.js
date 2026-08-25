const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");


// ==========================================
// DIRETÓRIO DO BANCO
// ==========================================

const databaseDir = path.join(__dirname, "database");

if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, {
        recursive: true
    });
}


// ==========================================
// BANCO
// ==========================================

const dbPath = path.join(
    databaseDir,
    "cafe.db"
);

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");


// ==========================================
// ADMINISTRADORES
// ==========================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`).run();


// ==========================================
// CRIAR ADMIN PADRÃO
// ==========================================

const quantidadeAdmins = db
    .prepare(`
        SELECT COUNT(*) AS total
        FROM admins
    `)
    .get();

if (quantidadeAdmins.total === 0) {

    const senhaHash = bcrypt.hashSync(
        "admin123",
        10
    );

    db.prepare(`
        INSERT INTO admins
        (
            nome,
            email,
            senha
        )
        VALUES (?, ?, ?)
    `).run(
        "Administrador",
        "admin@cafechimoio.com",
        senhaHash
    );

    console.log("");
    console.log("=================================");
    console.log("ADMIN PADRÃO CRIADO");
    console.log("Email: admin@cafechimoio.com");
    console.log("Senha: admin123");
    console.log("=================================");
    console.log("");
}


// ==========================================
// PEDIDOS
// ==========================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        numero TEXT NOT NULL UNIQUE,

        cliente_nome TEXT NOT NULL,

        cliente_telefone TEXT NOT NULL,

        tipo_entrega TEXT NOT NULL,

        observacoes TEXT DEFAULT '',

        total REAL NOT NULL DEFAULT 0,

        valor_entrada REAL NOT NULL DEFAULT 0,

        saldo REAL NOT NULL DEFAULT 0,

        status_pagamento TEXT NOT NULL
            DEFAULT 'PENDENTE',

        status_pedido TEXT NOT NULL
            DEFAULT 'PENDENTE_PAGAMENTO',

        comprovativo TEXT DEFAULT NULL,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`).run();


// ==========================================
// ITENS DOS PEDIDOS
// ==========================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS pedido_itens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        pedido_id INTEGER NOT NULL,

        produto_id TEXT,

        produto_nome TEXT NOT NULL,

        preco REAL NOT NULL,

        quantidade INTEGER NOT NULL,

        subtotal REAL NOT NULL,

        FOREIGN KEY (pedido_id)
            REFERENCES pedidos(id)
            ON DELETE CASCADE
    )
`).run();


// ==========================================
// EXPORTAR
// ==========================================

module.exports = db;