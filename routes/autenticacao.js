var express = require('express');
var router = express.Router();
var models 	= require('../models');
var Sequelize = require('sequelize');
var underscore = require("underscore");
var moment = require('moment');
var schedule = require('node-schedule'); 
var Op = Sequelize.Op;
var Autenticacao = models.Autenticacao;
var Receiver = models.Receiver;
var UserEmpreendimento = models.UserEmpreendimento;
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var config = require('../config/config');
var verificaToken = require('./verificaToken');

var timeToken = 60;

router.post('/', function(req, res, next) {
    if(Object.keys(req.body).length > 0){
        loginUsuario(res,req.body,req.headers);
    }
    else{
        res.status(400);
        res.json({'msg':"Corpo da requesição vazio"});
    }
});

async function loginUsuario(res, data, headers){
    try {
        var usuCadastrado = await Autenticacao.findOne({ where: {'email': data.email}});
        if(usuCadastrado){
            usuCadastrado = usuCadastrado.dataValues;
            if(bcrypt.compareSync(data.senha, usuCadastrado.senha)){
                var timeToken = 15 * 60;
                if(headers.device == "mobile"){
                    timeToken = 60 * 60;
                    var token = jwt.sign({ id: usuCadastrado.id }, config.jwtSecretDevice , {
                        expiresIn: timeToken // expires in 1min
                    });
                }
                else{
                    var token = jwt.sign({ id: usuCadastrado.id }, config.jwtSecret , {
                        expiresIn: timeToken // expires in 1min
                    });
                }
                

                res.status(202).json(
                    {'login':true,
                    'msg':"Logado com Sucesso!", 
                    "token": token, 
                    "id_usuario":usuCadastrado.id,
                    "id_empreendimento": await getEmpreendimento(usuCadastrado.id),
                    "notification": await getReceiver(usuCadastrado.id,data.tokenFCM)
                });

            }
            else{
                res.status(202).json({'login':false,'msg':"Senha inválida!"});
            }
        }
        else{
            res.status(202).json({'login':false, 'msg':"Email informado não cadastrado!"});
        } 
    } catch (error) {
        res.status(404);
        res.json({'msg':"Falha na requisição", 'error': error});
    }
}

async function getReceiver(id_usuario,tokenFCM){
    var receiver = await Receiver.findOne({ where: {'id_usuario': id_usuario, 'registration_id': tokenFCM}});
    var notification = false;
    (receiver == null) ? notification = true : notification = false;
    return notification;
}

async function getEmpreendimento(id_usuario){
    var empreendimento = await UserEmpreendimento.findOne({'id_usuario': id_usuario});
    return (empreendimento != null) ? empreendimento.id_empreendimento : null;
}

router.post('/refresh-token', function(req, res){
    refreshToken(res,req);
});

async function refreshToken(res,req){
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).send({ msg: 'Token não enviado na requisição', erro: 1 });

    const parts = authHeader.split(' ');

    if(!parts.length === 2)
        return res.status(401).send({ msg: 'Token inválido'});

    const [ scheme, token ] = parts;

    if(!/^Bearer$/i.test(scheme)){
        return res.status(401).send({ msg: 'Token mal formatado' });
    }

    jwt.verify(token, config.jwtSecret, function(err, decoded) {
        if (err) return res.status(401).send({ msg: 'Falha na validação do Token', erro: err });

        req.id_usuario = decoded.id;
        
        var token = jwt.sign({ id: req.id }, config.jwtSecret , {
            expiresIn: timeToken // expires in 15min
        });
    
        res.status(200).json({"token": token});
    });
}

router.post('/new', function(req, res, next) {
    if(verificaToken(req, res, next)){
        if(Object.keys(req.body).length > 0){
            createUsuario(res,req.body);   
        }
        else{
            res.status(400);
            res.json({'msg':"Corpo da requesição vazio"});
        }
    }
});

async function createUsuario(res, data){
    try {
        var usuCadastrado = await Autenticacao.findOne({ where: {'email': data.email}});
        if(!usuCadastrado){
            var autenticacao = new Autenticacao();
            autenticacao.email = data.email;
            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(data.senha, salt);
            autenticacao.senha = hash;
            await autenticacao.save();
            res.status(201).json({'msg':"Usuario criado com sucesso"});
        }
        else{
            res.status(201).json({'msg':"Email já cadastrado!"});
        } 
    } catch (error) {
        res.status(404);
        res.json({'msg':"Falha na requisição", 'error': error});
    }
}

module.exports = router;