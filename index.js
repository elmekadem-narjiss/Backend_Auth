const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const app = express();
app.use(express.json());

// URL de la clé publique de Keycloak
const keycloakCertUrl = "http://localhost:8080/realms/myrealm/protocol/openid-connect/certs";

// Middleware pour vérifier le JWT
const authenticateJWT = async (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.sendStatus(403); // Si pas de token, accès interdit

  // Extraction du token (sans le "Bearer " prefix)
  const bearerToken = token.split(" ")[1];

  try {
    // Récupérer la clé publique de Keycloak
    const response = await axios.get(keycloakCertUrl);
    const key = response.data.keys[0]; // Assure-toi d'utiliser la bonne clé (en fonction de la structure)

    // Valider le JWT avec la clé publique
    jwt.verify(bearerToken, key.x5c[0], { algorithms: ["RS256"] }, (err, user) => {
      if (err) {
        return res.sendStatus(403); // Token invalide
      }
      req.user = user; // Stocke les informations de l'utilisateur dans la requête
      next();
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la clé publique", error);
    res.sendStatus(500); // Erreur serveur
  }
};

// Route protégée par JWT
app.get('/secure-data', authenticateJWT, (req, res) => {
  res.json({ message: "Données protégées accessibles avec un JWT valide" });
});

// Démarrer le serveur
const port = 3001;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
