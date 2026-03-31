const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class RewardDistributionLedger extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }
  RewardDistributionLedger.init(
    {
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      merchant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      merchant_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      customer_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      receipt_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      epwx_amount: {
        type: DataTypes.DECIMAL(36, 18),
        allowNull: false,
      },
      fiat_value: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: true,
      },
      transaction_hash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "RewardDistributionLedger",
      tableName: "RewardDistributionLedger",
    }
  );
  return RewardDistributionLedger;
};
