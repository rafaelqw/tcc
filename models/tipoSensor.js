'use strict';
var moment = require('moment');

module.exports = (sequelize, DataTypes) => {

    const TipoSensor = sequelize.define('TipoSensor', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            tipo_sensor:{
                type: DataTypes.STRING,
                allowNull: true,
            },
            createdAt: {
                type: DataTypes.DATE
            },
            deletedAt: {
                type: DataTypes.DATE
            },
            updatedAt:{
                type: DataTypes.DATE
            }
        }, {
          paranoid: true,
          tableName: 'tbl_tipo_sensor'
    });

    TipoSensor.getFullData = function() {
    console.log(this, sequelize);
    }

	return TipoSensor;
};

	