const { Sequelize } = require("sequelize");

module.exports = new Sequelize("db_name", "db_username", "db_passwordasd", {
  host: "db_host",
  dialect: "mysql",
});
