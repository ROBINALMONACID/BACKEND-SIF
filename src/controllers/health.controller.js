import sequelize from '../config/connect.db.js';

export class HealthController {
  // Health check
  static async check(req, res) {
    try {
      // Test DB connection
      await sequelize.authenticate();
      res.json({
        status: 'OK',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'ERROR',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}