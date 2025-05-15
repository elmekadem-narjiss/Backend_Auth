import { DataTypes, QueryTypes } from 'sequelize';
import sequelize from '../config/db';

// Définir le modèle avec mappage explicite des champs
const Prediction = sequelize.define('predictions_lstm', {
  id: { type: DataTypes.INTEGER, primaryKey: true, field: 'id' },
  energyproduced: { type: DataTypes.DOUBLE, field: 'energyproduced' },
  temperature: { type: DataTypes.DOUBLE, field: 'temperature' },
  humidity: { type: DataTypes.DOUBLE, field: 'humidity' },
  month: { type: DataTypes.INTEGER, field: 'month' },
  week_of_year: { type: DataTypes.INTEGER, field: 'week_of_year' },
  hour: { type: DataTypes.INTEGER, field: 'hour' },
  prediction_day: { type: DataTypes.DATE, field: 'prediction_day' }, // Ajusté pour correspondre
}, { timestamps: false, tableName: 'predictions_lstm' }); // Forcer le nom de la table

// Log pour vérifier que le modèle est défini
console.log('Modèle Prediction défini pour la table predictions_lstm');

// Fonction pour récupérer toutes les prédictions
export const getPredictions = async () => {
  try {
    console.log('Début de la récupération de toutes les prédictions');
    
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    console.log('Tables dans la base de données:', tableExists);
    if (!tableExists.includes('predictions_lstm')) {
      console.warn('La table predictions_lstm n\'existe pas dans la base de données !');
    }

    const predictions = await Prediction.findAll();
    console.log('Nombre de lignes récupérées:', predictions.length);
    console.log('Données récupérées:', JSON.stringify(predictions, null, 2));
    
    return predictions;
  } catch (error) {
    console.error('Erreur lors de la récupération des prédictions:', error);
    throw new Error('Error fetching predictions');
  }
};

// Fonction pour tester une requête brute
export const getPredictionsRaw = async () => {
  try {
    console.log('Exécution d\'une requête SQL brute pour débogage');
    const predictions = await sequelize.query(
      `SELECT * FROM predictions_lstm`,
      { type: QueryTypes.SELECT }
    );
    console.log('Données brutes récupérées:', JSON.stringify(predictions, null, 2));
    return predictions;
  } catch (error) {
    console.error('Erreur lors de la requête brute:', error);
    throw error;
  }
};

export default Prediction;