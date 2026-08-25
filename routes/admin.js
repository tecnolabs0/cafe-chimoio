const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../database");

const router = express.Router();


// =====================================================
// CONFIGURAÇÕES
// =====================================================

const ADMIN_EMAIL_PADRAO =
    process.env.ADMIN_EMAIL || "admin@cafechimoio.co.mz";

const ADMIN_SENHA_PADRAO =
    process.env.ADMIN_PASSWORD || "admin123";


// =====================================================
// CRIAR ADMINISTRADOR INICIAL
// =====================================================
//
// Se ainda não existir nenhum administrador,
// será criado automaticamente.
//
// Depois de entrar, altere a senha.
// =====================================================

function garantirAdministradorInicial() {

    try {

        const quantidade =
            db.prepare(`
                SELECT COUNT(*) AS total
                FROM admins
            `).get();

        if (Number(quantidade.total) === 0) {

            const senhaHash =
                bcrypt.hashSync(
                    ADMIN_SENHA_PADRAO,
                    12
                );

            db.prepare(`
                INSERT INTO admins (
                    nome,
                    email,
                    senha
                )
                VALUES (?, ?, ?)
            `).run(
                "Administrador",
                ADMIN_EMAIL_PADRAO,
                senhaHash
            );

            console.log("");
            console.log("=================================");
            console.log("ADMIN INICIAL CRIADO");
            console.log("=================================");
            console.log(
                "Email:",
                ADMIN_EMAIL_PADRAO
            );
            console.log(
                "Senha:",
                ADMIN_SENHA_PADRAO
            );
            console.log("=================================");
            console.log("");

        }

    } catch (error) {

        console.error(
            "Erro ao criar administrador inicial:",
            error
        );

    }

}


garantirAdministradorInicial();


// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// =====================================================

function exigirLogin(req, res, next) {

    if (
        !req.session ||
        !req.session.admin
    ) {

        return res.status(401).json({

            success: false,

            message:
                "Autenticação necessária."

        });

    }

    next();

}


// =====================================================
// LOGIN
// =====================================================

router.post(
    "/login",
    async (req, res) => {

        try {

            const email =
                String(
                    req.body.email || ""
                )
                .trim()
                .toLowerCase();

            const senha =
                String(
                    req.body.senha ||
                    req.body.password ||
                    ""
                );


            if (
                !email ||
                !senha
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Informe o email e a senha."

                });

            }


            const admin =
                db.prepare(`
                    SELECT
                        id,
                        nome,
                        email,
                        senha,
                        created_at
                    FROM admins
                    WHERE LOWER(email) = ?
                    LIMIT 1
                `).get(email);


            if (!admin) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Email ou senha incorretos."

                });

            }


            const senhaValida =
                await bcrypt.compare(
                    senha,
                    admin.senha
                );


            if (!senhaValida) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Email ou senha incorretos."

                });

            }


            req.session.admin = {

                id:
                    Number(admin.id),

                nome:
                    admin.nome,

                email:
                    admin.email

            };


            req.session.save(
                error => {

                    if (error) {

                        console.error(
                            "Erro ao guardar sessão:",
                            error
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Não foi possível iniciar a sessão."

                        });

                    }


                    res.json({

                        success: true,

                        message:
                            "Login realizado com sucesso.",

                        admin: {

                            id:
                                Number(admin.id),

                            nome:
                                admin.nome,

                            email:
                                admin.email

                        }

                    });

                }
            );

        } catch (error) {

            console.error(
                "Erro no login administrativo:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Erro interno do servidor."

            });

        }

    }
);


// =====================================================
// VERIFICAR ADMIN LOGADO
// =====================================================

router.get(
    "/me",
    exigirLogin,
    (req, res) => {

        res.json({

            success: true,

            admin:
                req.session.admin

        });

    }
);


// =====================================================
// LOGOUT
// =====================================================

router.post(
    "/logout",
    (req, res) => {

        req.session.destroy(
            error => {

                if (error) {

                    console.error(
                        "Erro ao terminar sessão:",
                        error
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Não foi possível terminar a sessão."

                    });

                }


                res.clearCookie(
                    "connect.sid"
                );


                res.json({

                    success: true,

                    message:
                        "Sessão terminada com sucesso."

                });

            }
        );

    }
);


// =====================================================
// DASHBOARD
// =====================================================

router.get(
    "/dashboard",
    exigirLogin,
    (req, res) => {

        try {

            const totalPedidos =
                db.prepare(`
                    SELECT COUNT(*) AS total
                    FROM pedidos
                `).get().total;


            const pedidosPendentes =
                db.prepare(`
                    SELECT COUNT(*) AS total
                    FROM pedidos
                    WHERE status_pedido IN (
                        'PENDENTE_PAGAMENTO',
                        'AGUARDANDO_PAGAMENTO'
                    )
                `).get().total;


            const pedidosPreparacao =
                db.prepare(`
                    SELECT COUNT(*) AS total
                    FROM pedidos
                    WHERE status_pedido = 'EM_PREPARACAO'
                `).get().total;


            const pedidosProntos =
                db.prepare(`
                    SELECT COUNT(*) AS total
                    FROM pedidos
                    WHERE status_pedido = 'PRONTO'
                `).get().total;


            const pedidosEntregues =
                db.prepare(`
                    SELECT COUNT(*) AS total
                    FROM pedidos
                    WHERE status_pedido = 'ENTREGUE'
                `).get().total;


            const comprovativosPendentes =
                db.prepare(`
                    SELECT COUNT(*) AS total
                    FROM pedidos
                    WHERE status_pagamento =
                        'COMPROVATIVO_ENVIADO'
                `).get().total;


            const faturamento =
                db.prepare(`
                    SELECT
                        COALESCE(
                            SUM(valor_entrada),
                            0
                        ) AS total
                    FROM pedidos
                    WHERE status_pagamento = 'CONFIRMADO'
                `).get().total;


            res.json({

                success: true,

                estatisticas: {

                    totalPedidos:
                        Number(totalPedidos),

                    pedidosPendentes:
                        Number(pedidosPendentes),

                    pedidosPreparacao:
                        Number(pedidosPreparacao),

                    pedidosProntos:
                        Number(pedidosProntos),

                    pedidosEntregues:
                        Number(pedidosEntregues),

                    comprovativosPendentes:
                        Number(comprovativosPendentes),

                    faturamento:
                        Number(faturamento)

                }

            });

        } catch (error) {

            console.error(
                "Erro no dashboard:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Não foi possível carregar o dashboard."

            });

        }

    }
);


// =====================================================
// LISTAR PEDIDOS
// =====================================================

router.get(
    "/pedidos",
    exigirLogin,
    (req, res) => {

        try {

            const pedidos =
                db.prepare(`
                    SELECT
                        id,
                        numero,
                        cliente_nome,
                        cliente_telefone,
                        tipo_entrega,
                        observacoes,
                        total,
                        valor_entrada,
                        saldo,
                        status_pagamento,
                        status_pedido,
                        comprovativo,
                        created_at,
                        updated_at
                    FROM pedidos
                    ORDER BY id DESC
                `).all();


            res.json({

                success: true,

                pedidos

            });

        } catch (error) {

            console.error(
                "Erro ao listar pedidos:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Não foi possível carregar os pedidos."

            });

        }

    }
);


// =====================================================
// DETALHES DE UM PEDIDO
// =====================================================

router.get(
    "/pedidos/:id",
    exigirLogin,
    (req, res) => {

        try {

            const id =
                Number(req.params.id);


            if (
                !Number.isInteger(id) ||
                id <= 0
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
                `).get(id);


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
                `).all(id);


            res.json({

                success: true,

                pedido,

                itens

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

    }
);


// =====================================================
// NOTIFICAÇÕES
// =====================================================

router.get(
    "/notificacoes",
    exigirLogin,
    (req, res) => {

        try {

            const ultimoPedido =
                db.prepare(`
                    SELECT
                        id,
                        numero,
                        cliente_nome,
                        total,
                        status_pedido,
                        status_pagamento,
                        created_at
                    FROM pedidos
                    ORDER BY id DESC
                    LIMIT 1
                `).get();


            const pendentes =
                db.prepare(`
                    SELECT COUNT(*) AS total
                    FROM pedidos
                    WHERE status_pedido IN (
                        'PENDENTE_PAGAMENTO',
                        'AGUARDANDO_PAGAMENTO'
                    )
                `).get().total;


            const comprovativos =
                db.prepare(`
                    SELECT COUNT(*) AS total
                    FROM pedidos
                    WHERE status_pagamento =
                        'COMPROVATIVO_ENVIADO'
                `).get().total;


            res.json({

                success: true,

                pendentes:
                    Number(pendentes),

                comprovativos:
                    Number(comprovativos),

                ultimoPedido:
                    ultimoPedido || null

            });

        } catch (error) {

            console.error(
                "Erro nas notificações:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Não foi possível carregar notificações."

            });

        }

    }
);


// =====================================================
// CONFIRMAR PAGAMENTO
// =====================================================

router.patch(
    "/pedidos/:id/confirmar-pagamento",
    exigirLogin,
    (req, res) => {

        try {

            const id =
                Number(req.params.id);


            if (
                !Number.isInteger(id) ||
                id <= 0
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
                `).get(id);


            if (!pedido) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Pedido não encontrado."

                });

            }


            if (
                !pedido.comprovativo
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Este pedido não possui comprovativo."

                });

            }


            db.prepare(`
                UPDATE pedidos
                SET
                    status_pagamento = 'CONFIRMADO',

                    status_pedido =
                        CASE
                            WHEN status_pedido IN (
                                'PENDENTE_PAGAMENTO',
                                'AGUARDANDO_PAGAMENTO'
                            )
                            THEN 'CONFIRMADO'
                            ELSE status_pedido
                        END,

                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE id = ?
            `).run(id);


            res.json({

                success: true,

                message:
                    "Pagamento confirmado com sucesso."

            });

        } catch (error) {

            console.error(
                "Erro ao confirmar pagamento:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Não foi possível confirmar o pagamento."

            });

        }

    }
);


// =====================================================
// REJEITAR PAGAMENTO
// =====================================================

router.patch(
    "/pedidos/:id/rejeitar-pagamento",
    exigirLogin,
    (req, res) => {

        try {

            const id =
                Number(req.params.id);


            if (
                !Number.isInteger(id) ||
                id <= 0
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
                `).get(id);


            if (!pedido) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Pedido não encontrado."

                });

            }


            db.prepare(`
                UPDATE pedidos
                SET
                    status_pagamento = 'REJEITADO',

                    status_pedido =
                        'PENDENTE_PAGAMENTO',

                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE id = ?
            `).run(id);


            res.json({

                success: true,

                message:
                    "Comprovativo rejeitado."

            });

        } catch (error) {

            console.error(
                "Erro ao rejeitar pagamento:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Não foi possível rejeitar o comprovativo."

            });

        }

    }
);


// =====================================================
// ALTERAR STATUS DO PEDIDO
// =====================================================

router.patch(
    "/pedidos/:id/status",
    exigirLogin,
    (req, res) => {

        try {

            const id =
                Number(req.params.id);


            const status =
                String(
                    req.body.status_pedido || ""
                ).trim();


            const estadosPermitidos = [

                "PENDENTE_PAGAMENTO",

                "AGUARDANDO_PAGAMENTO",

                "CONFIRMADO",

                "EM_PREPARACAO",

                "PRONTO",

                "ENTREGUE",

                "CANCELADO"

            ];


            if (
                !Number.isInteger(id) ||
                id <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "ID do pedido inválido."

                });

            }


            if (
                !estadosPermitidos.includes(
                    status
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Estado do pedido inválido."

                });

            }


            const pedido =
                db.prepare(`
                    SELECT id
                    FROM pedidos
                    WHERE id = ?
                `).get(id);


            if (!pedido) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Pedido não encontrado."

                });

            }


            db.prepare(`
                UPDATE pedidos
                SET
                    status_pedido = ?,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                status,
                id
            );


            res.json({

                success: true,

                message:
                    "Estado do pedido atualizado."

            });

        } catch (error) {

            console.error(
                "Erro ao alterar status:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Não foi possível alterar o estado."

            });

        }

    }
);


// =====================================================
// ALTERAR DADOS DO ADMIN
// =====================================================

router.patch(
    "/perfil",
    exigirLogin,
    async (req, res) => {

        try {

            const nome =
                String(
                    req.body.nome || ""
                ).trim();

            const email =
                String(
                    req.body.email || ""
                )
                .trim()
                .toLowerCase();


            if (
                !nome ||
                !email
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Nome e email são obrigatórios."

                });

            }


            const outroAdmin =
                db.prepare(`
                    SELECT id
                    FROM admins
                    WHERE LOWER(email) = ?
                    AND id != ?
                `).get(
                    email,
                    req.session.admin.id
                );


            if (outroAdmin) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Este email já está sendo usado."

                });

            }


            db.prepare(`
                UPDATE admins
                SET
                    nome = ?,
                    email = ?
                WHERE id = ?
            `).run(
                nome,
                email,
                req.session.admin.id
            );


            req.session.admin.nome =
                nome;

            req.session.admin.email =
                email;


            res.json({

                success: true,

                message:
                    "Perfil atualizado com sucesso.",

                admin:
                    req.session.admin

            });

        } catch (error) {

            console.error(
                "Erro ao atualizar perfil:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Não foi possível atualizar o perfil."

            });

        }

    }
);


// =====================================================
// ALTERAR SENHA
// =====================================================

router.patch(
    "/senha",
    exigirLogin,
    async (req, res) => {

        try {

            const senhaAtual =
                String(
                    req.body.senhaAtual || ""
                );

            const novaSenha =
                String(
                    req.body.novaSenha || ""
                );


            if (
                !senhaAtual ||
                !novaSenha
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Preencha a senha atual e a nova senha."

                });

            }


            if (
                novaSenha.length < 6
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "A nova senha deve ter pelo menos 6 caracteres."

                });

            }


            const admin =
                db.prepare(`
                    SELECT senha
                    FROM admins
                    WHERE id = ?
                `).get(
                    req.session.admin.id
                );


            if (!admin) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Administrador não encontrado."

                });

            }


            const correta =
                await bcrypt.compare(
                    senhaAtual,
                    admin.senha
                );


            if (!correta) {

                return res.status(401).json({

                    success: false,

                    message:
                        "A senha atual está incorreta."

                });

            }


            const novaHash =
                await bcrypt.hash(
                    novaSenha,
                    12
                );


            db.prepare(`
                UPDATE admins
                SET senha = ?
                WHERE id = ?
            `).run(
                novaHash,
                req.session.admin.id
            );


            res.json({

                success: true,

                message:
                    "Senha alterada com sucesso."

            });

        } catch (error) {

            console.error(
                "Erro ao alterar senha:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Não foi possível alterar a senha."

            });

        }

    }
);


// =====================================================
// EXPORTAR
// =====================================================

module.exports = router;