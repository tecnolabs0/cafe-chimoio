const loginForm =
    document.getElementById("loginForm");

const loginError =
    document.getElementById("loginError");

const loginButton =
    document.getElementById("loginButton");


loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const email =
            document
                .getElementById("email")
                .value
                .trim();

        const senha =
            document
                .getElementById("senha")
                .value;


        loginError.textContent = "";

        loginButton.disabled = true;

        loginButton.textContent =
            "Entrando...";


        try {

            const resposta =
                await fetch(
                    "/api/admin/login",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email,
                            senha
                        })

                    }
                );


            const dados =
                await resposta.json();


            if (!resposta.ok || !dados.success) {

                throw new Error(
                    dados.message ||
                    "Não foi possível entrar."
                );

            }


            window.location.href =
                "/admin/dashboard.html";


        } catch (error) {

            loginError.textContent =
                error.message;

            loginButton.disabled = false;

            loginButton.textContent =
                "Entrar no painel";

        }

    }
);