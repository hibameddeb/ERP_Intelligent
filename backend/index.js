const express = require("express");
const cors = require("cors");
const http = require("http"); // Requis pour Socket.io
const { Server } = require("socket.io"); // Requis pour le temps réel
const pool = require("./config/db");
require("dotenv").config();

// Imports des Routes existantes
const authRoutes = require("./routes/authRoutes");
const demandeRoutes = require("./routes/demandeRoutes");
const usersRouter = require("./routes/userRoutes");
const demandes = require("./routes/demandes");
const produitsRouter = require("./routes/produitRoutes");
const commandeRoutes = require("./routes/commandeRoutes");
const factureRoutes = require("./routes/factureRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const produitFournisseurRoutes = require("./routes/Produitfournisseurroutes");
const commandeAchatRoutes = require("./routes/commandeAchatRoutes");
const facturesAchatRoutes = require('./routes/facturesAchatRoutes');

// NOUVELLES ROUTES : Support (Chat & Réclamations)
const supportRoutes = require("./routes/supportRoutes");

const app = express();
const server = http.createServer(app); // On crée le serveur HTTP
const io = new Server(server, {
  cors: {
    origin: "*", // À restreindre en production
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Déclaration des API
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRouter);
app.use("/api/demande", demandeRoutes);
app.use("/api/demandes", demandes);
app.use("/api/produits", produitsRouter);
app.use("/api/commandes", commandeRoutes);
app.use("/api/factures", factureRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/produits-fournisseur", produitFournisseurRoutes);
app.use("/api/commandes-achat", commandeAchatRoutes);
app.use("/api/factures-achat", facturesAchatRoutes);

// Utilisation des nouvelles routes de support
app.use("/api/support", supportRoutes);

// Configuration Socket.io (Temps Réel pour le Chat)
io.on("connection", (socket) => {
  console.log("Nouvelle connexion socket :", socket.id);

  socket.on("join_room", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Utilisateur ${userId} a rejoint sa room.`);
  });

  socket.on("send_message", (data) => {
    // data contient { id_destinataire, contenu, id_expediteur }
    io.to(`user_${data.id_destinataire}`).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("Utilisateur déconnecté");
  });
});

// Test de connexion DB
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Connecté à PostgreSQL !", time: result.rows[0] });
  } catch (err) {
    console.error("DB Connection Error:", err.message);
    res.status(500).send("Erreur de connexion à la base de données");
  }
});

// Gestion d'erreur globale
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.stack);
  res.status(500).json({ error: "Erreur serveur globale." });
});

const PORT = process.env.PORT || 5000;
// Note : On utilise 'server.listen' au lieu de 'app.listen' pour Socket.io
server.listen(PORT, () => {
  console.log(`Serveur ERP OrderFlow Pro lancé sur le port ${PORT}`);
});