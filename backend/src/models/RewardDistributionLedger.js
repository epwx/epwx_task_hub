import { Model } from "sequelize";

const RewardDistributionLedger = (sequelize, DataTypes) => {
  class RewardDistributionLedgerClass extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }
  RewardDistributionLedgerClass.init(
    {
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      merchant_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      merchant_name: {
        type: DataTypes.STRING,
        allowNull: true,
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
      source_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      source_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "RewardDistributionLedger",
      tableName: "RewardDistributionLedger",
      indexes: [
        {
          unique: true,
          fields: ["source_type", "source_id"],
          name: "reward_ledger_source_unique",
        },
      ],
    }
  );
  return RewardDistributionLedgerClass;
};

export default RewardDistributionLedger;
