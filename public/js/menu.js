const categoryButtons = document.querySelectorAll(".category-btn");
const menuCategories = document.querySelectorAll(".menu-category");

categoryButtons.forEach(button => {

    button.addEventListener("click", () => {

        const category = button.dataset.category;

        categoryButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");


        menuCategories.forEach(menuCategory => {

            if (
                category === "todos" ||
                menuCategory.dataset.category === category
            ) {

                menuCategory.style.display = "block";

            } else {

                menuCategory.style.display = "none";

            }

        });


        window.scrollTo({
            top: document.querySelector(".menu-section").offsetTop - 90,
            behavior: "smooth"
        });

    });

});


/* ==========================
   CARRINHO TEMPORÁRIO
========================== */

let cart = JSON.parse(localStorage.getItem("cafeChimoioCart")) || [];

const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");

const addButtons = document.querySelectorAll(".add-product");


function updateCart() {

    let totalQuantity = 0;
    let totalPrice = 0;

    cart.forEach(item => {

        totalQuantity += item.quantity;
        totalPrice += item.price * item.quantity;

    });

    cartCount.textContent = totalQuantity;
    cartTotal.textContent = `${totalPrice} MT`;

    localStorage.setItem(
        "cafeChimoioCart",
        JSON.stringify(cart)
    );

}


addButtons.forEach(button => {

    button.addEventListener("click", () => {

        const name = button.dataset.name;
        const price = Number(button.dataset.price);

        const existingProduct = cart.find(
            item => item.name === name
        );


        if (existingProduct) {

            existingProduct.quantity++;

        } else {

            cart.push({
                name: name,
                price: price,
                quantity: 1
            });

        }


        updateCart();


        button.textContent = "✓";
        button.style.background = "#28a745";


        setTimeout(() => {

            button.textContent = "+";
            button.style.background = "";

        }, 900);


        const productCard = button.closest(".product-card");

        productCard.animate(
            [
                {
                    transform: "scale(1)"
                },
                {
                    transform: "scale(1.03)"
                },
                {
                    transform: "scale(1)"
                }
            ],
            {
                duration: 350
            }
        );

    });

});


updateCart();


console.log("🍔 Menu Café Chimoio carregado!");