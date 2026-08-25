// ==========================================
// CAFÉ CHIMOIO
// ADMIN - DASHBOARD.JS
// ==========================================


// ==========================================
// ESTADO GLOBAL
// ==========================================

let ultimoPedidoNotificado = null;
let ultimoComprovativoNotificado = null;

let pedidosAtuais = [];

let modalPedidoId = null;

let sistemaNotificacaoAtivado = false;


// ==========================================
// ELEMENTOS
// ==========================================

const orderModal =
    document.getElementById("orderModal");

const modalOrderNumber =
    document.getElementById("modalOrderNumber");

const modalOrderContent =
    document.getElementById("modalOrderContent");


// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        iniciarDashboard();

    }
);


// ==========================================
// INICIAR DASHBOARD
// ==========================================

async function iniciarDashboard() {

    try {

        const autenticado =
            await verificarSessao();

        if (!autenticado) {
            return;
        }


        configurarEventos();


        await carregarDashboard();

        await carregarPedidosRecentes();

        await carregarTodosPedidos();

        await verificarNotificacoes();


        // ======================================
        // VERIFICAR NOTIFICAÇÕES
        // A CADA 5 SEGUNDOS
        // ======================================

        setInterval(
            verificarNotificacoes,
            5000
        );


        // ======================================
        // ATUALIZAR DASHBOARD
        // A CADA 15 SEGUNDOS
        // ======================================

        setInterval(
            async () => {

                await carregarDashboard();

                await carregarPedidosRecentes();

                await carregarTodosPedidos();

            },
            15000
        );


    } catch (error) {

        console.error(
            "Erro ao iniciar dashboard:",
            error
        );

    }

}


// ==========================================
// VERIFICAR SESSÃO
// ==========================================

async function verificarSessao() {

    try {

        const resposta =
            await fetch(
                "/api/admin/me"
            );


        if (resposta.status === 401) {

            window.location.href =
                "/admin";

            return false;

        }


        const dados =
            await resposta.json();


        if (!dados.success) {

            window.location.href =
                "/admin";

            return false;

        }


        preencherDadosAdmin(
            dados.admin
        );


        return true;

    } catch (error) {

        console.error(
            "Erro ao verificar sessão:",
            error
        );

        return false;

    }

}


// ==========================================
// DADOS DO ADMIN
// ==========================================

function preencherDadosAdmin(admin) {

    if (!admin) {
        return;
    }


    const elementosNome =
        document.querySelectorAll(
            "[data-admin-name]"
        );


    elementosNome.forEach(
        elemento => {

            elemento.textContent =
                admin.nome ||
                "Administrador";

        }
    );


    const elementosEmail =
        document.querySelectorAll(
            "[data-admin-email]"
        );


    elementosEmail.forEach(
        elemento => {

            elemento.textContent =
                admin.email || "";

        }
    );

}


// ==========================================
// EVENTOS
// ==========================================

function configurarEventos() {


    // ======================================
    // ATIVAR SISTEMA DE ÁUDIO
    // ======================================

    document.addEventListener(
        "click",
        () => {

            sistemaNotificacaoAtivado = true;

        },
        {
            once: true
        }
    );


    // ======================================
    // FECHAR MODAL
    // ======================================

    const closeModal =
        document.getElementById(
            "closeOrderModal"
        );


    if (closeModal) {

        closeModal.addEventListener(
            "click",
            fecharModal
        );

    }


    document.querySelectorAll(
        ".modal-close"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                fecharModal
            );

        }
    );


    // ======================================
    // FECHAR CLICANDO FORA
    // ======================================

    if (orderModal) {

        orderModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    orderModal
                ) {

                    fecharModal();

                }

            }
        );

    }


    // ======================================
    // ESC
    // ======================================

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                fecharModal();

            }

        }
    );


    // ======================================
    // LOGOUT
    // ======================================

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            fazerLogout
        );

    }


    // ======================================
    // ATUALIZAR
    // ======================================

    const refreshButton =
        document.getElementById(
            "refreshButton"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                await atualizarTudo();

            }
        );

    }


    // ======================================
    // PESQUISA
    // ======================================

    const searchInput =
        document.getElementById(
            "searchOrders"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                filtrarPedidos(
                    searchInput.value
                );

            }
        );

    }


    // ======================================
    // NOTIFICAÇÕES
    // ======================================

    const notificationButton =
        document.getElementById(
            "notificationButton"
        );


    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            async () => {

                sistemaNotificacaoAtivado = true;

                await verificarNotificacoes();

            }
        );

    }

}


// ==========================================
// CARREGAR DASHBOARD
// ==========================================

async function carregarDashboard() {

    try {

        const resposta =
            await fetch(
                "/api/admin/dashboard"
            );


        if (resposta.status === 401) {

            window.location.href =
                "/admin";

            return;

        }


        const dados =
            await resposta.json();


        if (!dados.success) {

            console.error(
                dados.message
            );

            return;

        }


        const stats =
            dados.estatisticas || {};


        atualizarElemento(
            "totalPedidos",
            stats.totalPedidos ?? 0
        );


        atualizarElemento(
            "pedidosPendentes",
            stats.pedidosPendentes ?? 0
        );


        atualizarElemento(
            "pedidosPreparacao",
            stats.pedidosPreparacao ?? 0
        );


        atualizarElemento(
            "pedidosProntos",
            stats.pedidosProntos ?? 0
        );


        atualizarElemento(
            "pedidosEntregues",
            stats.pedidosEntregues ?? 0
        );


        atualizarElemento(
            "faturamento",
            formatMoney(
                stats.faturamento ?? 0
            )
        );


        atualizarElemento(
            "comprovativosPendentes",
            stats.comprovativosPendentes ?? 0
        );


        atualizarElemento(
            "totalFaturamento",
            formatMoney(
                stats.faturamento ?? 0
            )
        );


        atualizarElemento(
            "totalComprovativos",
            stats.comprovativosPendentes ?? 0
        );


    } catch (error) {

        console.error(
            "Erro ao carregar dashboard:",
            error
        );

    }

}


// ==========================================
// CARREGAR PEDIDOS RECENTES
// ==========================================

async function carregarPedidosRecentes() {

    try {

        const resposta =
            await fetch(
                "/api/admin/pedidos"
            );


        if (resposta.status === 401) {

            window.location.href =
                "/admin";

            return;

        }


        const dados =
            await resposta.json();


        if (!dados.success) {
            return;
        }


        pedidosAtuais =
            dados.pedidos || [];


        const recentes =
            pedidosAtuais.slice(
                0,
                10
            );


        renderizarPedidosRecentes(
            recentes
        );


    } catch (error) {

        console.error(
            "Erro ao carregar pedidos recentes:",
            error
        );

    }

}


// ==========================================
// CARREGAR TODOS OS PEDIDOS
// ==========================================

async function carregarTodosPedidos() {

    try {

        const resposta =
            await fetch(
                "/api/admin/pedidos"
            );


        if (resposta.status === 401) {

            window.location.href =
                "/admin";

            return;

        }


        const dados =
            await resposta.json();


        if (!dados.success) {
            return;
        }


        pedidosAtuais =
            dados.pedidos || [];


        renderizarTodosPedidos(
            pedidosAtuais
        );


    } catch (error) {

        console.error(
            "Erro ao carregar pedidos:",
            error
        );

    }

}


// ==========================================
// RENDERIZAR PEDIDOS RECENTES
// ==========================================

function renderizarPedidosRecentes(
    pedidos
) {

    const container =
        document.getElementById(
            "recentOrders"
        );


    if (!container) {
        return;
    }


    if (
        !pedidos ||
        pedidos.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div>
                    📦
                </div>

                <strong>
                    Nenhum pedido ainda
                </strong>

                <p>
                    Os novos pedidos aparecerão aqui.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        pedidos.map(
            pedido =>
                criarPedidoHTML(
                    pedido
                )
        ).join("");


    adicionarEventosPedidos(
        container
    );

}


// ==========================================
// RENDERIZAR TODOS OS PEDIDOS
// ==========================================

function renderizarTodosPedidos(
    pedidos
) {

    const container =
        document.getElementById(
            "ordersList"
        );


    if (!container) {
        return;
    }


    if (
        !pedidos ||
        pedidos.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div>
                    📦
                </div>

                <strong>
                    Nenhum pedido encontrado
                </strong>

            </div>

        `;

        return;

    }


    container.innerHTML =
        pedidos.map(
            pedido =>
                criarPedidoHTML(
                    pedido
                )
        ).join("");


    adicionarEventosPedidos(
        container
    );

}


// ==========================================
// HTML DO PEDIDO
// ==========================================

function criarPedidoHTML(
    pedido
) {

    const precisaPagamento =
        pedido.status_pagamento ===
        "COMPROVATIVO_ENVIADO";


    return `

        <div
            class="order-card ${
                precisaPagamento
                ? "has-payment-proof"
                : ""
            }"
            data-order-id="${pedido.id}"
            data-search="${escapeHTML(
                (
                    pedido.numero +
                    " " +
                    pedido.cliente_nome +
                    " " +
                    pedido.cliente_telefone
                ).toLowerCase()
            )}"
        >

            <div class="order-card-main">

                <div class="order-info">

                    <div class="order-number">

                        #${escapeHTML(
                            pedido.numero
                        )}

                    </div>


                    <div class="order-client">

                        ${escapeHTML(
                            pedido.cliente_nome
                        )}

                    </div>


                    <div class="order-phone">

                        ${escapeHTML(
                            pedido.cliente_telefone
                        )}

                    </div>

                </div>


                <div class="order-financial">

                    <strong>

                        ${formatMoney(
                            pedido.total
                        )}

                    </strong>


                    <span>

                        Entrada:
                        ${formatMoney(
                            pedido.valor_entrada
                        )}

                    </span>

                </div>


                <div class="order-status">

                    <span
                        class="status-badge status-${slugify(
                            pedido.status_pedido
                        )}"
                    >

                        ${statusText(
                            pedido.status_pedido
                        )}

                    </span>


                    <span
                        class="payment-badge payment-${slugify(
                            pedido.status_pagamento
                        )}"
                    >

                        ${paymentStatusText(
                            pedido.status_pagamento
                        )}

                    </span>

                </div>


                <button
                    type="button"
                    class="view-order-button"
                    data-order-id="${pedido.id}"
                >

                    Ver pedido

                </button>

            </div>


            ${
                precisaPagamento
                ?
                `
                <div class="proof-alert">

                    <span>
                        💳
                    </span>

                    <strong>
                        Comprovativo aguardando confirmação
                    </strong>

                </div>
                `
                :
                ""
            }

        </div>

    `;

}


// ==========================================
// EVENTOS DOS PEDIDOS
// ==========================================

function adicionarEventosPedidos(
    container
) {

    container
        .querySelectorAll(
            ".view-order-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        abrirPedido(
                            Number(
                                button.dataset.orderId
                            )
                        );

                    }
                );

            }
        );

}


// ==========================================
// ABRIR PEDIDO
// ==========================================

async function abrirPedido(
    id
) {

    modalPedidoId = id;


    if (!orderModal) {

        console.error(
            "Elemento #orderModal não encontrado."
        );

        return;

    }


    orderModal.classList.remove(
        "hidden"
    );


    if (modalOrderNumber) {

        modalOrderNumber.textContent =
            "Carregando...";

    }


    if (modalOrderContent) {

        modalOrderContent.innerHTML = `

            <div class="loading-cell">

                Carregando pedido...

            </div>

        `;

    }


    try {

        const resposta =
            await fetch(
                `/api/admin/pedidos/${id}`
            );


        if (resposta.status === 401) {

            window.location.href =
                "/admin";

            return;

        }


        const dados =
            await resposta.json();


        if (!dados.success) {

            mostrarErroModal(
                dados.message
            );

            return;

        }


        const pedido =
            dados.pedido;


        const itens =
            dados.itens || [];


        if (modalOrderNumber) {

            modalOrderNumber.textContent =
                `#${pedido.numero}`;

        }


        if (!modalOrderContent) {
            return;
        }


        let comprovativoHTML = "";


        if (pedido.comprovativo) {

            const comprovativoUrl =
                "/" +
                pedido.comprovativo;


            comprovativoHTML = `

                <div class="payment-proof">

                    <div class="payment-proof-header">

                        <div>

                            <h3>
                                Comprovativo de pagamento
                            </h3>

                            <p>

                                Valor da entrada:

                                <strong>

                                    ${formatMoney(
                                        pedido.valor_entrada
                                    )}

                                </strong>

                            </p>

                        </div>


                        <span
                            class="payment-status ${
                                pedido.status_pagamento ===
                                "COMPROVATIVO_ENVIADO"
                                ? "waiting"
                                : pedido.status_pagamento ===
                                "CONFIRMADO"
                                ? "confirmed"
                                : "rejected"
                            }"
                        >

                            ${paymentStatusText(
                                pedido.status_pagamento
                            )}

                        </span>

                    </div>


                    <a
                        href="${comprovativoUrl}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="proof-image-link"
                    >

                        <img
                            src="${comprovativoUrl}"
                            alt="Comprovativo do pagamento"
                            class="proof-image"
                        >

                    </a>


                    ${
                        pedido.status_pagamento ===
                        "COMPROVATIVO_ENVIADO"
                        ?
                        `

                        <div class="payment-actions">

                            <button
                                type="button"
                                class="confirm-payment-button"
                                id="confirmPaymentButton"
                            >

                                ✓ Confirmar pagamento

                            </button>


                            <button
                                type="button"
                                class="reject-payment-button"
                                id="rejectPaymentButton"
                            >

                                ✕ Rejeitar comprovativo

                            </button>

                        </div>

                        `
                        :
                        ""
                    }

                </div>

            `;

        } else {

            comprovativoHTML = `

                <div class="no-proof">

                    <div>
                        📎
                    </div>

                    <strong>
                        Nenhum comprovativo enviado
                    </strong>

                    <p>
                        O cliente ainda não enviou o comprovativo.
                    </p>

                </div>

            `;

        }


        modalOrderContent.innerHTML = `

            <div class="detail-grid">

                <div class="detail-item">

                    <span>
                        Cliente
                    </span>

                    <strong>
                        ${escapeHTML(
                            pedido.cliente_nome
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Telefone
                    </span>

                    <strong>
                        ${escapeHTML(
                            pedido.cliente_telefone
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Tipo de entrega
                    </span>

                    <strong>
                        ${escapeHTML(
                            pedido.tipo_entrega
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Total
                    </span>

                    <strong>
                        ${formatMoney(
                            pedido.total
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Entrada — 50%
                    </span>

                    <strong>
                        ${formatMoney(
                            pedido.valor_entrada
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Saldo
                    </span>

                    <strong>
                        ${formatMoney(
                            pedido.saldo
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Pagamento
                    </span>

                    <strong>
                        ${paymentStatusText(
                            pedido.status_pagamento
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Estado
                    </span>

                    <strong>
                        ${statusText(
                            pedido.status_pedido
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Criado em
                    </span>

                    <strong>
                        ${formatDate(
                            pedido.created_at
                        )}
                    </strong>

                </div>

            </div>


            <div class="items-list">

                <h3>
                    Itens do pedido
                </h3>


                ${
                    itens.length
                    ?
                    itens.map(
                        item => `

                            <div class="order-item">

                                <span>

                                    ${item.quantidade}x

                                    ${escapeHTML(
                                        item.produto_nome
                                    )}

                                </span>


                                <strong>

                                    ${formatMoney(
                                        item.subtotal
                                    )}

                                </strong>

                            </div>

                        `
                    ).join("")
                    :
                    `
                    <p>
                        Nenhum item encontrado.
                    </p>
                    `
                }

            </div>


            ${
                pedido.observacoes
                ?
                `

                <div class="items-list">

                    <h3>
                        Observações
                    </h3>

                    <p>

                        ${escapeHTML(
                            pedido.observacoes
                        )}

                    </p>

                </div>

                `
                :
                ""
            }


            ${comprovativoHTML}


            <div class="modal-status">

                <label
                    for="modalStatusSelect"
                >

                    Estado do pedido

                </label>


                <select
                    id="modalStatusSelect"
                >

                    ${criarOpcoesStatus(
                        pedido.status_pedido
                    )}

                </select>

            </div>

        `;


        // ==================================
        // CONFIRMAR PAGAMENTO
        // ==================================

        const confirmButton =
            document.getElementById(
                "confirmPaymentButton"
            );


        if (confirmButton) {

            confirmButton.addEventListener(
                "click",
                () => {

                    confirmarPagamento(
                        pedido.id
                    );

                }
            );

        }


        // ==================================
        // REJEITAR PAGAMENTO
        // ==================================

        const rejectButton =
            document.getElementById(
                "rejectPaymentButton"
            );


        if (rejectButton) {

            rejectButton.addEventListener(
                "click",
                () => {

                    rejeitarPagamento(
                        pedido.id
                    );

                }
            );

        }


        // ==================================
        // ALTERAR STATUS
        // ==================================

        const statusSelect =
            document.getElementById(
                "modalStatusSelect"
            );


        if (statusSelect) {

            statusSelect.addEventListener(
                "change",
                event => {

                    atualizarStatusPedido(
                        pedido.id,
                        event.target.value
                    );

                }
            );

        }

    } catch (error) {

        console.error(
            "Erro ao abrir pedido:",
            error
        );


        mostrarErroModal(
            "Não foi possível carregar o pedido."
        );

    }

}


// ==========================================
// CONFIRMAR PAGAMENTO
// ==========================================

async function confirmarPagamento(
    id
) {

    const confirmar =
        window.confirm(
            "Tem certeza que deseja confirmar este pagamento?"
        );


    if (!confirmar) {
        return;
    }


    try {

        const resposta =
            await fetch(
                `/api/admin/pedidos/${id}/confirmar-pagamento`,
                {
                    method: "PATCH"
                }
            );


        const dados =
            await resposta.json();


        if (!dados.success) {

            alert(
                dados.message ||
                "Não foi possível confirmar o pagamento."
            );

            return;

        }


        alert(
            "Pagamento confirmado com sucesso!"
        );


        fecharModal();


        await atualizarTudo();

    } catch (error) {

        console.error(
            "Erro ao confirmar pagamento:",
            error
        );


        alert(
            "Erro ao confirmar pagamento."
        );

    }

}


// ==========================================
// REJEITAR PAGAMENTO
// ==========================================

async function rejeitarPagamento(
    id
) {

    const confirmar =
        window.confirm(
            "Tem certeza que deseja rejeitar este comprovativo?"
        );


    if (!confirmar) {
        return;
    }


    try {

        const resposta =
            await fetch(
                `/api/admin/pedidos/${id}/rejeitar-pagamento`,
                {
                    method: "PATCH"
                }
            );


        const dados =
            await resposta.json();


        if (!dados.success) {

            alert(
                dados.message ||
                "Não foi possível rejeitar o comprovativo."
            );

            return;

        }


        alert(
            "Comprovativo rejeitado."
        );


        fecharModal();


        await atualizarTudo();

    } catch (error) {

        console.error(
            "Erro ao rejeitar pagamento:",
            error
        );


        alert(
            "Erro ao rejeitar comprovativo."
        );

    }

}


// ==========================================
// ALTERAR STATUS
// ==========================================

async function atualizarStatusPedido(
    id,
    status
) {

    try {

        const resposta =
            await fetch(
                `/api/admin/pedidos/${id}/status`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status_pedido:
                            status
                    })

                }
            );


        const dados =
            await resposta.json();


        if (!dados.success) {

            alert(
                dados.message ||
                "Não foi possível alterar o estado."
            );

            return;

        }


        await carregarDashboard();

        await carregarPedidosRecentes();

        await carregarTodosPedidos();


        if (
            modalPedidoId === id
        ) {

            await abrirPedido(id);

        }

    } catch (error) {

        console.error(
            "Erro ao atualizar status:",
            error
        );


        alert(
            "Erro ao atualizar o estado do pedido."
        );

    }

}


// ==========================================
// NOTIFICAÇÕES
// ==========================================

async function verificarNotificacoes() {

    try {

        const resposta =
            await fetch(
                "/api/admin/notificacoes"
            );


        if (resposta.status === 401) {

            window.location.href =
                "/admin";

            return;

        }


        const dados =
            await resposta.json();


        if (!dados.success) {
            return;
        }


        atualizarContadorNotificacoes(
            dados.pendentes,
            dados.comprovativos
        );


        // ======================================
        // NOVO PEDIDO
        // ======================================

        if (
            dados.ultimoPedido &&
            ultimoPedidoNotificado !== null &&
            Number(
                dados.ultimoPedido.id
            ) >
            Number(
                ultimoPedidoNotificado
            )
        ) {

            mostrarNotificacao(
    "🆕 Novo pedido!",
    `Pedido #${dados.ultimoPedido.numero} recebido.`,
    dados.ultimoPedido.id
);


            tocarSomNotificacao();

        }


        if (dados.ultimoPedido) {

            ultimoPedidoNotificado =
                Number(
                    dados.ultimoPedido.id
                );

        }


        // ======================================
        // COMPROVATIVOS
        // ======================================

        const totalComprovativos =
            Number(
                dados.comprovativos || 0
            );


        if (
            ultimoComprovativoNotificado !==
            null &&
            totalComprovativos >
            ultimoComprovativoNotificado
        ) {

            mostrarNotificacao(
                "💳 NOVO COMPROVATIVO!",
                "Um cliente enviou um comprovativo de pagamento."
            );


            tocarSomNotificacao();

        }


        ultimoComprovativoNotificado =
            totalComprovativos;


    } catch (error) {

        console.error(
            "Erro nas notificações:",
            error
        );

    }

}


// ==========================================
// CONTADOR DE NOTIFICAÇÕES
// ==========================================

function atualizarContadorNotificacoes(
    pendentes,
    comprovativos
) {

    const total =
        Number(pendentes || 0) +
        Number(comprovativos || 0);


    const contador =
        document.getElementById(
            "notificationCount"
        );


    if (contador) {

        contador.textContent =
            total;


        contador.style.display =
            total > 0
            ? "flex"
            : "none";

    }


    const proofCount =
        document.getElementById(
            "proofNotificationCount"
        );


    if (proofCount) {

        proofCount.textContent =
            comprovativos || 0;


        proofCount.style.display =
            comprovativos > 0
            ? "flex"
            : "none";

    }

}


// ==========================================
// NOTIFICAÇÃO VISUAL
// ==========================================

// ==========================================
// NOTIFICAÇÃO VISUAL PREMIUM
// ==========================================

function mostrarNotificacao(
    titulo,
    mensagem,
    pedidoId = null
) {

    let container =
        document.getElementById(
            "adminNotifications"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "adminNotifications";

        document.body.appendChild(
            container
        );

    }


    const notificacao =
        document.createElement(
            "div"
        );


    notificacao.className =
        "admin-notification";


    notificacao.innerHTML = `

        <div class="admin-notification-icon">
            🔔
        </div>

        <div class="admin-notification-content">

            <strong>
                ${escapeHTML(titulo)}
            </strong>

            <span>
                ${escapeHTML(mensagem)}
            </span>

        </div>

        <button
            type="button"
            class="admin-notification-close"
            aria-label="Fechar"
        >
            ×
        </button>

    `;


    container.appendChild(
        notificacao
    );


    // ======================================
    // ABRIR PEDIDO AO CLICAR
    // ======================================

    if (pedidoId) {

        notificacao.style.cursor =
            "pointer";


        notificacao.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        ".admin-notification-close"
                    )
                ) {

                    return;

                }


                abrirPedido(
                    Number(pedidoId)
                );


                notificacao.remove();

            }
        );

    }


    // ======================================
    // BOTÃO FECHAR
    // ======================================

    const close =
        notificacao.querySelector(
            ".admin-notification-close"
        );


    if (close) {

        close.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                notificacao.classList.add(
                    "hide"
                );


                setTimeout(
                    () => {

                        notificacao.remove();

                    },
                    400
                );

            }
        );

    }


    // ======================================
    // REMOVER AUTOMATICAMENTE
    // ======================================

    setTimeout(
        () => {

            if (
                !notificacao.isConnected
            ) {

                return;

            }


            notificacao.classList.add(
                "hide"
            );


            setTimeout(
                () => {

                    if (
                        notificacao.isConnected
                    ) {

                        notificacao.remove();

                    }

                },
                400
            );

        },
        10000
    );

}


// ==========================================
// SOM LONGO E FORTE
// ==========================================

// ==========================================
// SOM DE NOTIFICAÇÃO - ALERTA FORTE 10s
// ==========================================

// ==========================================
// CAFÉ CHIMOIO
// SOM DE NOTIFICAÇÃO PREMIUM
// DURAÇÃO: ~10 SEGUNDOS
// ==========================================

function tocarSomNotificacao() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) {
            return;
        }

        const audioContext =
            new AudioContext();


        // ======================================
        // ATIVAR AUDIO
        // ======================================

        if (audioContext.state === "suspended") {

            audioContext.resume();

        }


        const inicio =
            audioContext.currentTime;

        const duracao =
            10;


        // ======================================
        // MASTER
        // ======================================

        const master =
            audioContext.createGain();

        master.gain.setValueAtTime(
            0.0001,
            inicio
        );

        master.gain.exponentialRampToValueAtTime(
            0.65,
            inicio + 0.12
        );

        master.connect(
            audioContext.destination
        );


        // ======================================
        // FILTRO
        // ======================================

        const filter =
            audioContext.createBiquadFilter();

        filter.type =
            "lowpass";

        filter.frequency.value =
            3500;

        filter.Q.value =
            0.8;


        master.disconnect();

        master.connect(filter);

        filter.connect(
            audioContext.destination
        );


        // ======================================
        // NOTA MUSICAL
        // ======================================

        function tocarNota(
            frequencia,
            atraso,
            duracaoNota,
            volume = 0.45
        ) {

            const oscillator =
                audioContext.createOscillator();

            const gain =
                audioContext.createGain();


            // Som mais musical

            oscillator.type =
                "sine";


            oscillator.frequency.setValueAtTime(
                frequencia,
                inicio + atraso
            );


            // Pequena subida de frequência

            oscillator.frequency.exponentialRampToValueAtTime(
                frequencia * 1.015,
                inicio + atraso + duracaoNota
            );


            // Entrada suave

            gain.gain.setValueAtTime(
                0.0001,
                inicio + atraso
            );

            gain.gain.exponentialRampToValueAtTime(
                volume,
                inicio + atraso + 0.06
            );


            // Sustentação

            gain.gain.setValueAtTime(
                volume,
                inicio + atraso + duracaoNota - 0.18
            );


            // Saída suave

            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                inicio + atraso + duracaoNota
            );


            oscillator.connect(
                gain
            );

            gain.connect(
                master
            );


            oscillator.start(
                inicio + atraso
            );

            oscillator.stop(
                inicio + atraso + duracaoNota
            );

        }


        // ======================================
        // HARMONIA
        // ======================================

        function tocarAcorde(
            notas,
            atraso,
            duracaoNota
        ) {

            notas.forEach(
                (frequencia, index) => {

                    tocarNota(
                        frequencia,
                        atraso,
                        duracaoNota,
                        index === 0
                            ? 0.34
                            : 0.20
                    );

                }
            );

        }


        // ======================================
        // MELODIA PRINCIPAL
        // ======================================

        // C5

        tocarNota(
            523.25,
            0,
            0.65,
            0.48
        );


        // E5

        tocarNota(
            659.25,
            0.55,
            0.65,
            0.48
        );


        // G5

        tocarNota(
            783.99,
            1.10,
            0.75,
            0.52
        );


        // C6

        tocarNota(
            1046.50,
            1.75,
            0.90,
            0.55
        );


        // ======================================
        // SEGUNDA PARTE
        // ======================================

        tocarNota(
            783.99,
            2.85,
            0.55,
            0.48
        );


        tocarNota(
            659.25,
            3.35,
            0.55,
            0.48
        );


        tocarNota(
            783.99,
            3.85,
            0.65,
            0.50
        );


        tocarNota(
            1046.50,
            4.40,
            1.00,
            0.55
        );


        // ======================================
        // REPETIÇÃO MAIS FORTE
        // ======================================

        tocarNota(
            523.25,
            5.65,
            0.55,
            0.52
        );


        tocarNota(
            659.25,
            6.15,
            0.55,
            0.52
        );


        tocarNota(
            783.99,
            6.65,
            0.65,
            0.55
        );


        tocarNota(
            1046.50,
            7.20,
            1.10,
            0.60
        );


        // ======================================
        // ACORDE FINAL
        // ======================================

        tocarAcorde(
            [
                523.25,
                659.25,
                783.99,
                1046.50
            ],
            8.35,
            1.45
        );


        // ======================================
        // NOTA FINAL
        // ======================================

        tocarNota(
            1318.51,
            8.65,
            1.20,
            0.38
        );


        // ======================================
        // FADE OUT
        // ======================================

        master.gain.setValueAtTime(
            0.65,
            inicio + 9.2
        );

        master.gain.exponentialRampToValueAtTime(
            0.0001,
            inicio + 10
        );


        // ======================================
        // FECHAR AUDIO
        // ======================================

        setTimeout(
            () => {

                try {

                    audioContext.close();

                } catch (error) {

                    console.warn(
                        "AudioContext já estava fechado."
                    );

                }

            },
            10500
        );


    } catch (error) {

        console.error(
            "Erro ao reproduzir som:",
            error
        );

    }

}


// ==========================================
// FILTRAR PEDIDOS
// ==========================================

function filtrarPedidos(
    termo
) {

    const valor =
        String(
            termo || ""
        )
        .trim()
        .toLowerCase();


    const cards =
        document.querySelectorAll(
            ".order-card"
        );


    cards.forEach(
        card => {

            const texto =
                card.dataset.search ||
                "";


            card.style.display =
                !valor ||
                texto.includes(valor)
                ? ""
                : "none";

        }
    );

}


// ==========================================
// ATUALIZAR TUDO
// ==========================================

async function atualizarTudo() {

    const refreshButton =
        document.getElementById(
            "refreshButton"
        );


    if (refreshButton) {

        refreshButton.disabled =
            true;


        refreshButton.classList.add(
            "loading"
        );

    }


    try {

        await carregarDashboard();

        await carregarPedidosRecentes();

        await carregarTodosPedidos();

        await verificarNotificacoes();

    } finally {

        if (refreshButton) {

            refreshButton.disabled =
                false;


            refreshButton.classList.remove(
                "loading"
            );

        }

    }

}


// ==========================================
// LOGOUT
// ==========================================

async function fazerLogout() {

    const confirmar =
        window.confirm(
            "Deseja terminar a sessão?"
        );


    if (!confirmar) {
        return;
    }


    try {

        const resposta =
            await fetch(
                "/api/admin/logout",
                {
                    method: "POST"
                }
            );


        const dados =
            await resposta.json();


        if (dados.success) {

            window.location.href =
                "/admin";

            return;

        }


        alert(
            dados.message ||
            "Não foi possível terminar a sessão."
        );


    } catch (error) {

        console.error(
            "Erro no logout:",
            error
        );


        window.location.href =
            "/admin";

    }

}


// ==========================================
// FECHAR MODAL
// ==========================================

function fecharModal() {

    if (!orderModal) {
        return;
    }


    orderModal.classList.add(
        "hidden"
    );


    modalPedidoId =
        null;

}


// ==========================================
// ERRO NO MODAL
// ==========================================

function mostrarErroModal(
    mensagem
) {

    if (modalOrderContent) {

        modalOrderContent.innerHTML = `

            <div class="no-proof">

                <strong>

                    ${escapeHTML(
                        mensagem ||
                        "Erro ao carregar."
                    )}

                </strong>

            </div>

        `;

    }

}


// ==========================================
// OPÇÕES DE STATUS
// ==========================================

function criarOpcoesStatus(
    estadoAtual
) {

    const estados = [

        [
            "PENDENTE_PAGAMENTO",
            "Pendente de pagamento"
        ],

        [
            "AGUARDANDO_PAGAMENTO",
            "Aguardando confirmação do pagamento"
        ],

        [
            "CONFIRMADO",
            "Pagamento confirmado"
        ],

        [
            "EM_PREPARACAO",
            "Em preparação"
        ],

        [
            "PRONTO",
            "Pronto"
        ],

        [
            "ENTREGUE",
            "Entregue"
        ],

        [
            "CANCELADO",
            "Cancelado"
        ]

    ];


    return estados.map(
        estado => `

            <option
                value="${estado[0]}"
                ${
                    estadoAtual ===
                    estado[0]
                    ? "selected"
                    : ""
                }
            >

                ${estado[1]}

            </option>

        `
    ).join("");

}


// ==========================================
// TEXTO DO STATUS
// ==========================================

function statusText(
    status
) {

    const estados = {

        PENDENTE_PAGAMENTO:
            "Pendente de pagamento",

        AGUARDANDO_PAGAMENTO:
            "Aguardando pagamento",

        CONFIRMADO:
            "Confirmado",

        EM_PREPARACAO:
            "Em preparação",

        PRONTO:
            "Pronto",

        ENTREGUE:
            "Entregue",

        CANCELADO:
            "Cancelado"

    };


    return estados[status] ||
        status ||
        "Desconhecido";

}


// ==========================================
// TEXTO DO PAGAMENTO
// ==========================================

function paymentStatusText(
    status
) {

    const estados = {

        PENDENTE:
            "Pagamento pendente",

        COMPROVATIVO_ENVIADO:
            "Comprovativo enviado",

        CONFIRMADO:
            "Pagamento confirmado",

        REJEITADO:
            "Pagamento rejeitado"

    };


    return estados[status] ||
        status ||
        "Desconhecido";

}


// ==========================================
// FORMATAR DINHEIRO
// ==========================================

function formatMoney(
    valor
) {

    const numero =
        Number(valor) || 0;


    return numero.toLocaleString(
        "pt-MZ",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ) + " MT";

}


// ==========================================
// FORMATAR DATA
// ==========================================

function formatDate(
    data
) {

    if (!data) {
        return "—";
    }


    const date =
        new Date(
            data
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            data
        );

    }


    return date.toLocaleString(
        "pt-MZ",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );

}


// ==========================================
// SLUG
// ==========================================

function slugify(
    texto
) {

    return String(
        texto || ""
    )
    .toLowerCase()
    .normalize("NFD")
    .replace(
        /[\u0300-\u036f]/g,
        ""
    )
    .replace(
        /[^a-z0-9]+/g,
        "-"
    )
    .replace(
        /^-+|-+$/g,
        "");

}


// ==========================================
// ESCAPAR HTML
// ==========================================

function escapeHTML(
    valor
) {

    return String(
        valor ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


// ==========================================
// ATUALIZAR ELEMENTO
// ==========================================

function atualizarElemento(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.textContent =
            valor;

    }

}