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
        gameId: { type: DataTypes.STRING },
        type: { type: DataTypes.STRING },
        bid: { type: DataTypes.FLOAT },
        userID: { type: DataTypes.STRING },
        userName: { type: DataTypes.STRING },
        color: { type: DataTypes.STRING },
      },
      {
        tableName: "jackpotgame",
        timestamps: true,
        sequelize,
      }
    );
  }
};
