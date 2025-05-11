import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

import { createContainer } from "./core/container.js";
import { createRoutes } from "./core/router.js";

// Configurações do diretório
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, "../public");
const dataPath = path.join(__dirname, "../data");

// Inicializa o container com dependências
const container = createContainer();

// Configura o app Express
const app = express();
const PORT = 3000;

// Armazena caminhos
app.locals.publicPath = publicPath;
app.locals.dataPath = dataPath;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(publicPath));

// Rotas
app.use(createRoutes(container));
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// Inicializa o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
