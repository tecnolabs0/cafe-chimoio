const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const db = require("../database");

const router = express.Router();


// ==========================================
// CONFIGURAÇÃO DO UPLOAD
// ==========================================

const uploadDir = path.join(
    __dirname,
    "..",
    "uploads",
    "comprovativos"
);


if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}


const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },


    filename: (req, file, cb) => {

        const uniqueName =
            `comprovativo-${Date.now()}-${Math.round(Math.random() * 1000000)}`;

        const extension =
            path.extname(file.originalname).toLowerCase();

        cb(null, uniqueName + extension);
    }

});


const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];


    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Formato inválido. Envie JPG, PNG ou WEBP."
            )
        );
    }

};


const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }

});


// ==========================================
// GERAR NÚMERO DO PEDIDO
// ==========================================

function generateOrderNumber() {

    const now = new Date();

    const year =
        now.getFullYear()
            .toString()
            .slice(-2);

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    const random =
        Math.floor(
            1000 + Math.random() * 9000
        );

    return `CC${year}${month}${day}${random}`;

}


// ==========================================
// CRIAR PEDIDO
// ==========================================

router.post("/", (req, res) => {

    try {

        const {
            cliente_nome,
            cliente_telefone,
            tipo_entrega,
            observacoes,
            itens
        } = req.body;


        // ----------------------------------
        // VALIDAR DADOS
        // ----------------------------------

        if (
            !cliente_nome ||
            !cliente_telefone ||
            !tipo_entrega
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Preencha todos os dados obrigatórios."
            });

        }


        if (
            !Array.isArray(itens) ||
            itens.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "O pedido deve ter pelo menos um produto."
            });

        }


        // ----------------------------------
        // CALCULAR TOTAL NO SERVIDOR
        // ----------------------------------

        let total = 0;

        const processedItems = [];


        for (const item of itens) {

            const produto_nome =
                String(item.produto_nome || item.name || "")
                    .trim();

            const preco =
                Number(item.preco || item.price);

            const quantidade =
                Number(item.quantidade || item.quantity);


            if (
                !produto_nome ||
                !Number.isFinite(preco) ||
                preco <= 0 ||
                !Number.isInteger(quantidade) ||
                quantidade <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Existe um produto inválido no pedido."
                });

            }


            const subtotal =
                preco * quantidade;


            total += subtotal;


            processedItems.push({

                produto_id:
                    item.produto_id ||
                    item.id ||
                    null,

                produto_nome,
                preco,
                quantidade,
                subtotal

            });

        }


        // ----------------------------------
        // PAGAMENTO OBRIGATÓRIO DE 50%
        // ----------------------------------

        const valor_entrada =
            Math.round(total * 0.5 * 100) / 100;

        const saldo =
            Math.round(
                (total - valor_entrada) * 100
            ) / 100;


        // ----------------------------------
        // NÚMERO ÚNICO DO PEDIDO
        // ----------------------------------

        let numero;
        let exists = true;


        while (exists) {

            numero =
                generateOrderNumber();

            const found =
                db.prepare(`
                    SELECT id
                    FROM pedidos
                    WHERE numero = ?
                `).get(numero);


            exists = !!found;

        }


        // ----------------------------------
        // TRANSAÇÃO
        // ----------------------------------

        const createOrder = db.transaction(() => {

            const result = db.prepare(`
                INSERT INTO pedidos (
                    numero,
                    cliente_nome,
                    cliente_telefone,
                    tipo_entrega,
                    observacoes,
                    total,
                    valor_entrada,
                    saldo,
                    status_pagamento,
                    status_pedido
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(

                numero,
                cliente_nome.trim(),
                cliente_telefone.trim(),
                tipo_entrega,
                observacoes ?
                    String(observacoes).trim() :
                    "",

                total,
                valor_entrada,
                saldo,

                "PENDENTE",
                "PENDENTE_PAGAMENTO"
            );


            const pedidoId =
                result.lastInsertRowid;


            const insertItem = db.prepare(`
                INSERT INTO pedido_itens (
                    pedido_id,
                    produto_id,
                    produto_nome,
                    preco,
                    quantidade,
                    subtotal
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `);


            for (
                const item of processedItems
            ) {

                insertItem.run(

                    pedidoId,

                    item.produto_id,

                    item.produto_nome,

                    item.preco,

                    item.quantidade,

                    item.subtotal

                );

            }


            return pedidoId;

        });


        const pedidoId =
            createOrder();


        // ----------------------------------
        // RESPOSTA
        // ----------------------------------

        res.status(201).json({

            success: true,

            message:
                "Pedido criado. Efetue o pagamento de 50% para continuar.",

            pedido: {

                id: Number(pedidoId),

                numero,

                total,

                valor_entrada,

                saldo,

                status_pagamento:
                    "PENDENTE",

                status_pedido:
                    "PENDENTE_PAGAMENTO"

            }

        });

    } catch (error) {

        console.error(
            "Erro ao criar pedido:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Não foi possível criar o pedido."

        });

    }

});


// ==========================================
// ENVIAR COMPROVATIVO
// ==========================================

router.post(
    "/:id/comprovativo",
    upload.single("comprovativo"),

    (req, res) => {

        try {

            const pedidoId =
                Number(req.params.id);


            if (
                !Number.isInteger(pedidoId) ||
                pedidoId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "ID do pedido inválido."
                });

            }


            const pedido =
                db.prepare(`
                    SELECT *
                    FROM pedidos
                    WHERE id = ?
                `).get(pedidoId);


            if (!pedido) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Pedido não encontrado."
                });

            }


            if (!req.file) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Envie o comprovativo do pagamento."
                });

            }


            // Remover comprovativo anterior
            // caso o cliente envie outro

            if (pedido.comprovativo) {

                const oldFile =
                    path.join(
                        __dirname,
                        "..",
                        pedido.comprovativo
                    );


                if (fs.existsSync(oldFile)) {
                    fs.unlinkSync(oldFile);
                }

            }


            const comprovativo =
                `uploads/comprovativos/${req.file.filename}`;


            db.prepare(`
                UPDATE pedidos
                SET
                    comprovativo = ?,

                    status_pagamento = 'COMPROVATIVO_ENVIADO',

                    status_pedido = 'AGUARDANDO_PAGAMENTO',

                    updated_at = CURRENT_TIMESTAMP

                WHERE id = ?
            `).run(
                comprovativo,
                pedidoId
            );


            res.json({

                success: true,

                message:
                    "Comprovativo enviado com sucesso. Aguarde a confirmação do Café Chimoio.",

                pedido: {

                    id: pedidoId,

                    numero: pedido.numero,

                    valor_a_pagar:
                        pedido.valor_entrada,

                    status_pagamento:
                        "COMPROVATIVO_ENVIADO"

                }

            });

        } catch (error) {

            console.error(
                "Erro ao enviar comprovativo:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Não foi possível enviar o comprovativo."

            });

        }

    }
);


// ==========================================
// CONSULTAR PEDIDO
// ==========================================

router.get("/:id", (req, res) => {

    try {

        const pedidoId =
            Number(req.params.id);


        if (
            !Number.isInteger(pedidoId) ||
            pedidoId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "ID do pedido inválido."
            });

        }


        const pedido =
            db.prepare(`
                SELECT *
                FROM pedidos
                WHERE id = ?
            `).get(pedidoId);


        if (!pedido) {

            return res.status(404).json({
                success: false,
                message:
                    "Pedido não encontrado."
            });

        }


        const itens =
            db.prepare(`
                SELECT
                    id,
                    produto_id,
                    produto_nome,
                    preco,
                    quantidade,
                    subtotal
                FROM pedido_itens
                WHERE pedido_id = ?
                ORDER BY id ASC
            `).all(pedidoId);


        res.json({

            success: true,

            pedido: {
                ...pedido,
                itens
            }

        });

    } catch (error) {

        console.error(
            "Erro ao consultar pedido:",
            error
        );


        res.status(500).json({

            success: false,
            message:
                "Não foi possível consultar o pedido."

        });

    }

});


// ==========================================
// ERROS DO MULTER
// ==========================================

router.use((error, req, res, next) => {

    if (error instanceof multer.MulterError) {

        if (
            error.code === "LIMIT_FILE_SIZE"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "O comprovativo não pode ter mais de 5 MB."

            });

        }

    }


    if (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Erro ao enviar comprovativo."

        });

    }


    next();

});


module.exports = router;