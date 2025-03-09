const axios = require("axios");
require("dotenv").config();

// Debugging: Afficher les valeurs des variables d'environnement
console.log("Keycloak URL:", process.env.KEYCLOAK_URL);
console.log("Keycloak Realm:", process.env.KEYCLOAK_REALM);
console.log("Keycloak Admin User:", process.env.KEYCLOAK_ADMIN_USER);
console.log("Keycloak Admin Password:", process.env.KEYCLOAK_ADMIN_PASSWORD ? "*****" : "Not Set");

async function getAdminToken() {
  try {
    const response = await axios.post(
        `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      new URLSearchParams({
        client_id: "admin-cli",
        username: process.env.KEYCLOAK_ADMIN_USER,
        password: process.env.KEYCLOAK_ADMIN_PASSWORD,
        grant_type: "password",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("Erreur lors de la récupération du token :", error.response?.data || error);
    throw error;
  }
}

async function createUserInKeycloak(userData) {
  try {
    const token = await getAdminToken();

    const response = await axios.post(
      `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
      {
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        enabled: true,
        credentials: [
          {
            type: "password",
            value: userData.password,
            temporary: false,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Utilisateur créé avec succès !");
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur :", error.response?.data || error);
  }
}

module.exports = { createUserInKeycloak };
