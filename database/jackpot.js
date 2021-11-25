const { DataResolver } = require("discord.js");
const { DataTypes, Model } = require("sequelize");

module.exports = class config extends Model {
  static init(sequelize) {
    return super.init(
      {
        configId: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        pool: { type: DataTypes.FLOAT },
        type: { type: DataTypes.STRING },
        users: { type: DataTypes.INTEGER },
        ended: { type: DataTypes.BOOLEAN },
        gameId: { type: DataTypes.INTEGER },
      },
      {
        tableName: "jackpot",
        timestamps: true,
        sequelize,
      }
    );
  }
};
