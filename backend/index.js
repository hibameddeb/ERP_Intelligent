const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
require("dotenv").config();
const demandeRoutes = require("./routes/demandeRoutes");
const authRoutes = require("./routes/authRoutes");
const usersRouter = require("./routes/userRoutes");
const demandes = require("./routes/demandes");
const produitsRouter = require("./routes/produitRoutes");
const commandeRoutes = require("./routes/commandeRoutes");
const factureRoutes = require("./routes/factureRoutes");
const produitFournisseurRoutes = require("./routes/Produitfournisseurroutes");
const commandeAchatRoutes = require("./routes/commandeAchatRoutes");
const produitRoutes = require("./routes/produitRoutes");
const facturesAchatRoutes = require('./routes/facturesAchatRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes);
app.use("/api/demande", demandeRoutes);
app.use("/api/users", usersRouter);
app.use("/api/demandes", demandes);
app.use("/api/produits", produitsRouter);
app.use("/api/commandes", commandeRoutes);
app.use("/api/factures", factureRoutes);
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/produits-fournisseur", produitFournisseurRoutes);
app.use("/api/commandes-achat", commandeAchatRoutes);
app.use("/api/produits-entreprise", produitRoutes);
app.use("/api/factures-achat", facturesAchatRoutes);
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.stack);
  res.status(500).json({ error: "Erreur serveur globale." });
});
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Connecté à PostgreSQL !", time: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erreur de connexion à la base de données");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur ERP lancé sur le port ${PORT}`);
});
