const menuMobile = document.getElementById("menuMobile");
const nav = document.getElementById("nav");

menuMobile.addEventListener("click", () => {

    nav.classList.toggle("open");

    menuMobile.classList.toggle("active");

});


const navLinks = document.querySelectorAll(".nav a");

navLinks.forEach(link => {

    link.addEventListener("click", () => {

        nav.classList.remove("open");
        menuMobile.classList.remove("active");

    });

});


/* EFEITO DE MOVIMENTO COM O MOUSE */

const heroVisual = document.querySelector(".hero-visual");

document.addEventListener("mousemove", (event) => {

    if (window.innerWidth < 950) return;

    const x = (window.innerWidth / 2 - event.clientX) / 80;
    const y = (window.innerHeight / 2 - event.clientY) / 80;

    heroVisual.style.transform =
        `translate(${x}px, ${y}px)`;

});


/* ANIMAÇÃO AO APARECER NA TELA */

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("show");

        }

    });

}, {
    threshold: 0.15
});


document.querySelectorAll(
    ".feature-card, .section-title, .menu-call"
).forEach(element => {

    observer.observe(element);

});


/* EFEITO DE CLIQUE NOS BOTÕES */

document.querySelectorAll(".btn").forEach(button => {

    button.addEventListener("click", function () {

        this.style.transform = "scale(0.96)";

        setTimeout(() => {

            this.style.transform = "";

        }, 150);

    });

});


console.log("🍔 Café Chimoio carregado com sucesso!");
console.log("☕ Bem-vindo ao sabor de Chimoio!");