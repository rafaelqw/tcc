'use strict';
var moment = require('moment');

module.exports = (sequelize, DataTypes) => {

    const Autenticacao = sequelize.define('Autenticacao', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            id_usuario: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            senha: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
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
          tableName: 'tbl_autenticacao'
    });

    Autenticacao.associate = function(models) {
        Autenticacao.belongsTo(models.Usuario, {
          foreignKey: 'id_usuario'
        });
    };

    Autenticacao.getFullData = function() {
    console.log(this, sequelize);
    }

	return Autenticacao;
};

	