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
        userName: { type: DataTypes.STRING },
        userID: { type: DataTypes.STRING },
        money: { type: DataTypes.FLOAT, defaultValue: 10 },
        pln: { type: DataTypes.FLOAT, defaultValue: 0 },

        jps: { type: DataTypes.DOUBLE, defaultValue: 0 },
        jpwins: { type: DataTypes.DOUBLE, defaultValue: 0 },
        jpwinssum: { type: DataTypes.DOUBLE, defaultValue: 0 },
        jpdep: { type: DataTypes.DOUBLE, defaultValue: 0 },
        jpbiggestwinpercent: { type: DataTypes.FLOAT, defaultValue: 0 },
        jpbiggestwinsum: { type: DataTypes.FLOAT, defaultValue: 0 },
        jpluckiestwinpercent: { type: DataTypes.DOUBLE, defaultValue: 0 },
        jpluckiestwinsum: { type: DataTypes.DOUBLE, defaultValue: 0 },

        lottos: { type: DataTypes.DOUBLE, defaultValue: 0 },
        lottowins: { type: DataTypes.DOUBLE, defaultValue: 0 },
        lottoprofit: { type: DataTypes.DOUBLE, defaultValue: 0 },
        lottobiggestwinsum: { type: DataTypes.DOUBLE, defaultValue: 0 },
        lottobiggestwinnums: { type: DataTypes.STRING, defaultValue: "" },

        coinsgames: { type: DataTypes.DOUBLE, defaultValue: 0 },
        coinsdep: { type: DataTypes.DOUBLE, defaultValue: 0 },
        coinsprofit: { type: DataTypes.DOUBLE, defaultValue: 0 },
        coinswin: { type: DataTypes.DOUBLE, defaultValue: 0 },
        coinbiggestwin: { type: DataTypes.DOUBLE, defaultValue: 0 },
        coinbiggestloose: { type: DataTypes.DOUBLE, defaultValue: 0 },

        hacks: { type: DataTypes.DOUBLE, defaultValue: 0 },
        hackwins: { type: DataTypes.DOUBLE, defaultValue: 0 },
        hackprofit: { type: DataTypes.DOUBLE, defaultValue: 0 },

        freerecived: { type: DataTypes.DOUBLE, defaultValue: 0 },

        level: { type: DataTypes.DOUBLE, defaultValue: 1 },
        xp: { type: DataTypes.DOUBLE, defaultValue: 0 },
      },
      {
        tableName: "users",
        timestamps: true,
        sequelize,
      }
    );
  }
};
