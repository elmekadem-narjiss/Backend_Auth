const express = require("express");
const session = require("express-session");
const Keycloak = require("keycloak-connect");

const app = express();

// Configuration de la session
const memoryStore = new session.MemoryStore();
app.use(
  session({
    secret: "some-secret",
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
  })
);

// Configuration Keycloak
const keycloak = new Keycloak({ store: memoryStore }, {
  realm: "myrealm",
  "auth-server-url": "http://localhost:8080",
  "ssl-required": "none",
  resource: "my-nodejs-client",
  "public-client": false,
  "confidential-port": 0,
  credentials: {
    secret: "1kDtv3s3SO6O2xXwAjjR8KJE9CKyBg5r", // Remplace avec ton client secret
  },
});

app.use(keycloak.middleware());

// Route protégée
app.get("/protected", keycloak.protect(), (req, res) => {
  res.send("✅ Accès autorisé !");
});

// Route publique
app.get("/", (req, res) => {
  res.send("🏠 Accueil : accès libre");
});

// Lancer le serveur
app.listen(3000, () => {
  console.log("🚀 Serveur Node.js démarré sur http://localhost:3000");
});
