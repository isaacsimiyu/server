const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('database_uems', 'user_root', '', {
  host: 'localhost', 
  dialect: 'mysql',
});

module.exports = sequelize;
