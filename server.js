const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const db = require("./database");

const pedidosRoutes = require("./routes/pedidos");
const adminRoutes = require("./routes/admin");


const app = express();

const PORT = process.env.PORT || 3000;


// ==========================================
// PASTAS
// ==========================================

const uploadsDir = path.join(
    __dirname,
    "uploads",
    "comprovativos"
);

if (!fs.existsSync(uploadsDir)) {

    fs.mkdirSync(uploadsDir, {
        recursive: true
    });

}


// ==========================================
// MIDDLEWARES
// ==========================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


app.use(
    session({
        secret: process.env.SESSION_SECRET || "dev-secret-cafe-chimoio",
        resave: false,
        saveUninitialized: false,

        cookie: {
            maxAge: 1000 * 60 * 60 * 8,
            httpOnly: true
        }
    })
);


// ==========================================
// ARQUIVOS PÚBLICOS
// ==========================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.use(
    "/admin",
    express.static(
        path.join(__dirname, "admin")
    )
);


app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);


// ==========================================
// ARQUIVOS DO ADMIN
// ==========================================

app.use(
    "/admin",
    express.static(
        path.join(__dirname, "admin")
    )
);


// ==========================================
// API
// ==========================================

app.use(
    "/api/pedidos",
    pedidosRoutes
);


app.use(
    "/api/admin",
    adminRoutes
);


// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


// ==========================================
// PÁGINA ADMIN
// ==========================================

app.get("/admin", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "admin",
            "login.html"
        )
    );

});


// ==========================================
// ERRO 404 API
// ==========================================

app.use("/api", (req, res) => {

    res.status(404).json({
        success: false,
        message: "Endpoint não encontrado."
    });

});


// ==========================================
// ERROS
// ==========================================

app.use((err, req, res, next) => {

    console.error(
        "Erro:",
        err
    );

    res.status(500).json({
        success: false,
        message: "Erro interno do servidor."
    });

});


// ==========================================
// SERVIDOR
// ==========================================

app.listen(PORT, "0.0.0.0", () => {
        console.log("");
        console.log("=================================");
        console.log("☕ CAFÉ CHIMOIO");
        console.log("=================================");
        console.log(
            `Servidor: http://localhost:${PORT}`
        );
        console.log(
            `Admin:    http://localhost:${PORT}/admin`
        );
        console.log("Banco:    SQLite");
        console.log("=================================");
        console.log("");

    }
);