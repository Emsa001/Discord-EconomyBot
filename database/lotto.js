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
        type: { type: DataTypes.STRING },
        price: { type: DataTypes.DOUBLE },
        num1: { type: DataTypes.INTEGER },
        num2: { type: DataTypes.INTEGER },
        num3: { type: DataTypes.INTEGER },
        num4: { type: DataTypes.INTEGER },
        num5: { type: DataTypes.INTEGER },
        num6: { type: DataTypes.INTEGER },
        userID: { type: DataTypes.STRING },
        userName: { type: DataTypes.STRING },
        color: { type: DataTypes.STRING },
        ended: { type: DataTypes.STRING },
      },
      {
        tableName: "lotto",
        timestamps: true,
        sequelize,
      }
    );
  }
};
