const CART_KEY = "cafeChimoioCart";

let cart = JSON.parse(
    localStorage.getItem(CART_KEY)
) || [];

let currentOrder = null;


// ==========================================
// ELEMENTOS
// ==========================================

const cartItems =
    document.getElementById("cartItems");

const emptyCart =
    document.getElementById("emptyCart");

const clearCartButton =
    document.getElementById("clearCart");

const summaryQuantity =
    document.getElementById("summaryQuantity");

const summarySubtotal =
    document.getElementById("summarySubtotal");

const summaryTax =
    document.getElementById("summaryTax");

const summaryTotal =
    document.getElementById("summaryTotal");

const checkoutTotal =
    document.getElementById("checkoutTotal");

const checkoutSection =
    document.getElementById("checkoutSection");

const orderForm =
    document.getElementById("orderForm");

const submitOrder =
    document.getElementById("submitOrder");


// MODAL PAGAMENTO

const paymentModal =
    document.getElementById("paymentModal");

const closePaymentModal =
    document.getElementById(
        "closePaymentModal"
    );

const paymentOrderNumber =
    document.getElementById(
        "paymentOrderNumber"
    );

const paymentTotal =
    document.getElementById(
        "paymentTotal"
    );

const paymentRequired =
    document.getElementById(
        "paymentRequired"
    );

const paymentBalance =
    document.getElementById(
        "paymentBalance"
    );

const paymentForm =
    document.getElementById(
        "paymentForm"
    );

const paymentProof =
    document.getElementById(
        "paymentProof"
    );

const selectedFileName =
    document.getElementById(
        "selectedFileName"
    );

const sendProofButton =
    document.getElementById(
        "sendProofButton"
    );


// MODAL SUCESSO

const orderSuccess =
    document.getElementById("orderSuccess");

const successOrderNumber =
    document.getElementById(
        "successOrderNumber"
    );

const successMessage =
    document.getElementById(
        "successMessage"
    );

const closeSuccess =
    document.getElementById("closeSuccess");


// ==========================================
// GUARDAR CARRINHO
// ==========================================

function saveCart() {

    localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
    );

}


// ==========================================
// FORMATAR DINHEIRO
// ==========================================

function formatMoney(value) {

    const number = Number(value) || 0;

    return `${number.toLocaleString("pt-PT")} MT`;

}


// ==========================================
// PROTEGER TEXTO HTML
// ==========================================

function escapeHtml(text) {

    const div = document.createElement("div");

    div.textContent =
        String(text || "");

    return div.innerHTML;

}


// ==========================================
// CALCULAR TOTAIS
// ==========================================

function getTotals() {

    let quantity = 0;
    let subtotal = 0;


    cart.forEach(item => {

        const price =
            Number(item.price ?? item.preco) || 0;

        const itemQuantity =
            Number(item.quantity ?? item.quantidade) || 0;


        quantity += itemQuantity;

        subtotal +=
            price * itemQuantity;

    });


    return {

        quantity,

        subtotal,

        tax: 0,

        total: subtotal

    };

}


// ==========================================
// MOSTRAR RESUMO
// ==========================================

function updateSummary() {

    const totals =
        getTotals();


    summaryQuantity.textContent =
        `${totals.quantity} ${
            totals.quantity === 1
                ? "item"
                : "itens"
        }`;


    summarySubtotal.textContent =
        formatMoney(totals.subtotal);


    summaryTax.textContent =
        formatMoney(totals.tax);


    summaryTotal.textContent =
        formatMoney(totals.total);


    checkoutTotal.textContent =
        formatMoney(totals.total);

}


// ==========================================
// MOSTRAR CARRINHO
// ==========================================

function renderCart() {

    cartItems.innerHTML = "";


    if (cart.length === 0) {

        emptyCart.style.display = "flex";

        checkoutSection.style.display = "none";

        clearCartButton.style.display = "none";

    } else {

        emptyCart.style.display = "none";

        checkoutSection.style.display = "block";

        clearCartButton.style.display =
            "inline-flex";


        cart.forEach((item, index) => {

            const name =
                item.name ||
                item.produto_nome ||
                "Produto";


            const price =
                Number(
                    item.price ?? item.preco
                ) || 0;


            const quantity =
                Number(
                    item.quantity ??
                    item.quantidade
                ) || 0;


            const itemTotal =
                price * quantity;


            const cartItem =
                document.createElement("div");


            cartItem.className =
                "cart-item";


            cartItem.innerHTML = `

                <div class="cart-item-food">
                    🍽️
                </div>

                <div class="cart-item-info">

                    <h3>
                        ${escapeHtml(name)}
                    </h3>

                    <span>
                        ${formatMoney(price)} cada
                    </span>

                </div>


                <div class="cart-item-quantity">

                    <button
                        type="button"
                        class="quantity-btn decrease"
                        data-index="${index}"
                    >
                        −
                    </button>


                    <strong>
                        ${quantity}
                    </strong>


                    <button
                        type="button"
                        class="quantity-btn increase"
                        data-index="${index}"
                    >
                        +
                    </button>

                </div>


                <strong class="cart-item-total">
                    ${formatMoney(itemTotal)}
                </strong>


                <button
                    type="button"
                    class="remove-item"
                    data-index="${index}"
                    aria-label="Remover produto"
                >
                    ×
                </button>

            `;


            cartItems.appendChild(cartItem);

        });

    }


    updateSummary();

}


// ==========================================
// ALTERAR QUANTIDADE
// ==========================================

cartItems.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest("button");


        if (!button) {
            return;
        }


        const index =
            Number(button.dataset.index);


        if (
            !Number.isInteger(index) ||
            !cart[index]
        ) {
            return;
        }


        if (
            button.classList.contains("increase")
        ) {

            const currentQuantity =
                Number(
                    cart[index].quantity ??
                    cart[index].quantidade
                ) || 0;


            cart[index].quantity =
                currentQuantity + 1;

        }


        if (
            button.classList.contains("decrease")
        ) {

            const currentQuantity =
                Number(
                    cart[index].quantity ??
                    cart[index].quantidade
                ) || 0;


            if (currentQuantity <= 1) {

                cart.splice(index, 1);

            } else {

                cart[index].quantity =
                    currentQuantity - 1;

            }

        }


        if (
            button.classList.contains("remove-item")
        ) {

            cart.splice(index, 1);

        }


        saveCart();

        renderCart();

    }
);


// ==========================================
// LIMPAR CARRINHO
// ==========================================

clearCartButton.addEventListener(
    "click",
    () => {

        const confirmClear =
            confirm(
                "Deseja realmente remover todos os produtos do pedido?"
            );


        if (!confirmClear) {
            return;
        }


        cart = [];

        saveCart();

        renderCart();

    }
);


// ==========================================
// CRIAR PEDIDO NO BACKEND
// ==========================================

orderForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (cart.length === 0) {

            alert(
                "Adicione pelo menos um produto ao pedido."
            );

            return;

        }


        const customerName =
            document.getElementById(
                "customerName"
            ).value.trim();


        const customerPhone =
            document.getElementById(
                "customerPhone"
            ).value.trim();


        const deliveryInput =
            document.querySelector(
                'input[name="deliveryType"]:checked'
            );


        const customerNotes =
            document.getElementById(
                "customerNotes"
            ).value.trim();


        if (
            !customerName ||
            !customerPhone ||
            !deliveryInput
        ) {

            alert(
                "Preencha todos os dados obrigatórios."
            );

            return;

        }


        const itens =
            cart.map(item => {

                return {

                    produto_id:
                        item.id ||
                        item.produto_id ||
                        null,

                    produto_nome:
                        item.name ||
                        item.produto_nome ||
                        "Produto",

                    preco:
                        Number(
                            item.price ??
                            item.preco
                        ),

                    quantidade:
                        Number(
                            item.quantity ??
                            item.quantidade
                        )

                };

            });


        const originalButtonText =
            submitOrder.innerHTML;


        submitOrder.disabled = true;

        submitOrder.innerHTML =
            "A criar pedido... ⏳";


        try {

            const response =
                await fetch(
                    "/api/pedidos",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            cliente_nome:
                                customerName,

                            cliente_telefone:
                                customerPhone,

                            tipo_entrega:
                                deliveryInput.value,

                            observacoes:
                                customerNotes,

                            itens

                        })

                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Não foi possível criar o pedido."
                );

            }


            currentOrder =
                data.pedido;


            openPaymentModal(
                currentOrder
            );


        } catch (error) {

            console.error(
                "Erro ao criar pedido:",
                error
            );


            alert(
                error.message ||
                "Erro ao comunicar com o servidor."
            );

        } finally {

            submitOrder.disabled = false;

            submitOrder.innerHTML =
                originalButtonText;

        }

    }
);


// ==========================================
// ABRIR PAGAMENTO
// ==========================================

function openPaymentModal(order) {

    paymentOrderNumber.textContent =
        order.numero;


    paymentTotal.textContent =
        formatMoney(order.total);


    paymentRequired.textContent =
        formatMoney(order.valor_entrada);


    paymentBalance.textContent =
        formatMoney(order.saldo);


    paymentProof.value = "";

    selectedFileName.textContent =
        "Nenhum comprovativo selecionado.";


    paymentModal.classList.add("show");

    document.body.style.overflow = "hidden";

}


// ==========================================
// FECHAR PAGAMENTO
// ==========================================

closePaymentModal.addEventListener(
    "click",
    () => {

        paymentModal.classList.remove(
            "show"
        );

        document.body.style.overflow = "";

    }
);


// ==========================================
// SELECIONAR COMPROVATIVO
// ==========================================

paymentProof.addEventListener(
    "change",
    () => {

        const file =
            paymentProof.files[0];


        if (!file) {

            selectedFileName.textContent =
                "Nenhum comprovativo selecionado.";

            return;

        }


        const maxSize =
            5 * 1024 * 1024;


        if (file.size > maxSize) {

            alert(
                "O comprovativo não pode ter mais de 5 MB."
            );


            paymentProof.value = "";


            selectedFileName.textContent =
                "Nenhum comprovativo selecionado.";

            return;

        }


        selectedFileName.textContent =
            `📎 ${file.name}`;

    }
);


// ==========================================
// ENVIAR COMPROVATIVO
// ==========================================

paymentForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!currentOrder) {

            alert(
                "Nenhum pedido foi encontrado."
            );

            return;

        }


        const file =
            paymentProof.files[0];


        if (!file) {

            alert(
                "Selecione o comprovativo do pagamento."
            );

            return;

        }


        const allowedTypes = [

            "image/jpeg",

            "image/png",

            "image/webp"

        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            alert(
                "Envie uma imagem JPG, PNG ou WEBP."
            );

            return;

        }


        const formData =
            new FormData();


        formData.append(
            "comprovativo",
            file
        );


        const originalButtonText =
            sendProofButton.innerHTML;


        sendProofButton.disabled = true;

        sendProofButton.innerHTML =
            "A enviar... ⏳";


        try {

            const response =
                await fetch(
                    `/api/pedidos/${currentOrder.id}/comprovativo`,
                    {

                        method: "POST",

                        body: formData

                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Não foi possível enviar o comprovativo."
                );

            }


            // FECHAR PAGAMENTO
            paymentModal.classList.remove(
                "show"
            );


            document.body.style.overflow =
                "";


            // LIMPAR CARRINHO APENAS
            // DEPOIS DO COMPROVATIVO SER ENVIADO

            cart = [];

            saveCart();

            renderCart();


            // MOSTRAR SUCESSO

            successOrderNumber.textContent =
                currentOrder.numero;


            successMessage.textContent =
                "O seu comprovativo foi enviado com sucesso. O pedido está aguardando a confirmação do pagamento pelo Café Chimoio.";


            orderSuccess.classList.add(
                "show"
            );


            currentOrder = null;


        } catch (error) {

            console.error(
                "Erro ao enviar comprovativo:",
                error
            );


            alert(
                error.message ||
                "Erro ao enviar o comprovativo."
            );

        } finally {

            sendProofButton.disabled = false;

            sendProofButton.innerHTML =
                originalButtonText;

        }

    }
);


// ==========================================
// VOLTAR AO INÍCIO
// ==========================================

closeSuccess.addEventListener(
    "click",
    () => {

        window.location.href =
            "index.html";

    }
);


// ==========================================
// INICIAR
// ==========================================

renderCart();