var express = require('express');
var router = express.Router();
var models 	= require('../models');
var Sequelize = require('sequelize');
var underscore = require("underscore");
var moment = require('moment');
var schedule = require('node-schedule'); 
var Op = Sequelize.Op;
var Cliente = models.Cliente;
var PessoaFisica = models.PessoaFisica;
var PessoaJuridica = models.PessoaJuridica;
var Telefone = models.Telefone;
var Estado = models.Estado;
var Municipio = models.Municipio;
var verificaToken = require('./verificaToken');

router.use(verificaToken);

// POST Create Cliente
router.post('/', function(req, res, next) {
    if(Object.keys(req.body).length > 0){
        createCliente(res, req.body);
    }
    else{
        res.status(400);
        res.json({'msg':"Corpo da requesição vazio"});
    }
});

// Function POST Create Cliente
async function createCliente(res, cliente){
    try{
        var clienteData = cliente;
        var cliente = new Cliente();
        cliente.email = clienteData.email;
        cliente.cep = clienteData.cep;
        cliente.logradouro = clienteData.logradouro;
        cliente.numero = clienteData.numero;
        cliente.bairro = clienteData.bairro;
        cliente.complemento = clienteData.complemento;
        cliente.id_estado = clienteData.id_estado;
        cliente.id_municipio = clienteData.id_municipio;
        var clienteSave = await cliente.save();
        if(clienteData.tipo_cadastro == "pf"){
            var pessoaFisica = new PessoaFisica();
            pessoaFisica.id_cliente = clienteSave.id;
            pessoaFisica.nome = clienteData.nome;
            pessoaFisica.cpf = clienteData.cpf;
            pessoaFisica.rg = clienteData.rg;
            pessoaFisica.data_nascimento = clienteData.data_nascimento;
            pessoaFisica.sexo = clienteData.sexo;
            await pessoaFisica.save();
        }
        else if(clienteData.tipo_cadastro == "pj"){
            var pessoaJuridica = new PessoaJuridica();
            pessoaJuridica.id_cliente = clienteSave.id;
            pessoaJuridica.nome_fantasia = clienteData.nome_fantasia;
            pessoaJuridica.razao_social = clienteData.razao_social;
            pessoaJuridica.cnpj = clienteData.cnpj;
            pessoaJuridica.inscricao_estadual = clienteData.inscricao_estadual;
            await pessoaJuridica.save();
        }

        for (let i = 0; i < clienteData.telefones.length; i++) {
            var telefone = new Telefone();
            const telefoneData = clienteData.telefones[i];
            telefone.id_cliente = clienteSave.id;
            telefone.id_tipo = telefoneData.id_tipo;
            telefone.ddd = telefoneData.ddd;
            telefone.numero_tel = telefoneData.numero_tel;
            await telefone.save();
        }
        res.status(201)
        res.json({'msg':"Cliente criado com sucesso"});
    }
    catch (error) {
        res.status(404);
        res.json({'msg':"Falha na requisição", 'error': error});
    }
}

// PUT Cliente by id_cliente
router.put('/', function(req, res, next) {
    if(Object.keys(req.body).length > 0){
        AtualizarCliente(res, req.body);
    }
    else{
        res.status(400);
        res.json({'msg':"Corpo da requesição vazio"});
    }
});

// Function PUT Cliente by id_cliente
async function AtualizarCliente(res, data){
    try {
        var cliente = await Cliente.findOne({ where:{ "id": data.id } });

        var sqlQuery =  "SELECT * FROM tbl_pessoa_fisica ";
            sqlQuery += "WHERE id_cliente = " + data.id + " ;";

        var pessoaFisica = await models.sequelize.query(sqlQuery, { type: models.sequelize.QueryTypes.SELECT});

        var sqlQuery =  "SELECT * FROM tbl_pessoa_juridica ";
            sqlQuery += "WHERE id_cliente = " + data.id + " ;";

        var pessoaJuridica = await models.sequelize.query(sqlQuery, { type: models.sequelize.QueryTypes.SELECT});

        await cliente.update({
            "email": data.email,
            "cep": data.cep,
            "logradouro": data.logradouro,
            "numero": data.numero,
            "bairro": data.bairro,
            "complemento": data.complemento,
            "id_estado": data.id_estado,
            "id_municipio": data.id_municipio,
        });
        
        if(pessoaFisica.length > 0){
            PessoaFisica.destroy({where: {id_cliente: data.id}});
        }
        
        if(pessoaJuridica.length > 0){
            PessoaJuridica.destroy({where: {id_cliente: data.id}});
        }

        if(data.tipo_cadastro == "pf"){
            var pessoaFisica = new PessoaFisica();
            pessoaFisica.id_cliente = data.id;
            pessoaFisica.nome = data.nome;
            pessoaFisica.cpf = data.cpf;
            pessoaFisica.rg = data.rg;
            pessoaFisica.data_nascimento = data.data_nascimento;
            pessoaFisica.sexo = data.sexo;
            await pessoaFisica.save();
        }
        else if(data.tipo_cadastro == "pj"){
            var pessoaJuridica = new PessoaJuridica();
            pessoaJuridica.id_cliente = data.id;
            pessoaJuridica.nome_fantasia = data.nome_fantasia;
            pessoaJuridica.razao_social = data.razao_social;
            pessoaJuridica.cnpj = data.cnpj;
            pessoaJuridica.inscricao_estadual = data.inscricao_estadual;
            await pessoaJuridica.save();
        }

        Telefone.destroy({where: {id_cliente: data.id}});

        for (let i = 0; i < data.telefones.length; i++) {
            var telefone = new Telefone();
            const telefoneData = data.telefones[i];
            telefone.id_cliente = data.id;
            telefone.id_tipo = telefoneData.id_tipo;
            telefone.ddd = telefoneData.ddd;
            telefone.numero_tel = telefoneData.numero_tel;
            await telefone.save();
        }

        res.status(200);
        res.json(cliente);
    } catch (error) {
        res.status(404);
        res.json({'msg':"Falha na requisição", 'error': error});
    }
}


// GET Clientes
router.get('/', function(req, res, next) {
    getClientes(res);
});

// Fuction GET Clientes
async function getClientes(res){
    try {
        var clientes = await Cliente.findAll({
            include: [
                {
                    model: models.PessoaJuridica,
                    required: false
                },{
                    model: models.PessoaFisica,
                    required: false
                },{
                    model: models.Telefone,
                    required: false
                },{
                    model: models.Estado,
                    require: true
                },{
                    model: models.Municipio,
                    require: true
                }
            ]
        });

        /*var retorno = [];
        for(var i = 0; i < clientes.length; i++) {
            var estado = await Estado.findById(clientes[i].id_estado)
            var municipio = await Municipio.findById(clientes[i].id_municipio)
            var item = clientes[i].dataValues;
            item.estado = estado.dataValues;
            item.municipio = municipio.dataValues;
            retorno.push(item);
        }*/

        if(clientes.length > 0) {
            res.status(200);
            res.json(clientes);
        }
        else {
            res.status(404);
            res.json({'msg':"Nenhum registro encotrado"});
        }
    } catch (error) {
        res.status(404);
        res.json({'msg':"Falha na requisição", 'error': error});
    }
}

// DELETE Cliente
router.delete('/:id',function(req, res, next) {
    deleteClientesById(res, req.params.id);
});

// Function DELETE Cliente
async function deleteClientesById(res, id){
    try {
        var cliente = await Cliente.findById(id);
        if(cliente){
            if(cliente.destroy({where: {id: cliente.id}})){
                res.status(204);
                res.json({'msg':"Registro deletado com sucesso"});
            }
            else{
                res.status(404);
                res.json({'msg':"Falha ao deletar registro"});
            }
        }
        else{
            res.status(406);
            res.json({'msg':"Cliente não encontrado"}); 
        }
    } catch (error) {
        res.status(404);
        res.json({'msg':"Falha na requisição", 'error': error});
    }
}

module.exports = router;