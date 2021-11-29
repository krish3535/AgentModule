const express = require('express');
var { check,validationResult } = require('express-validator');
//const { check } = require("express-validator");
var Agent = require('../models/agent');
var Client = require('../models/client');
const mongoose = require('mongoose');

function clientData(data){
    this.id = data._id;
    this.name = data.name;
    this.agent_id = data.agent_id;
    this.email = data.email;
    this.mobile = data.mobile;
    this.total_bill = data.total_bill;
    this.createdAt = data.createdAt;
}

module.exports.agentList = [(req,res) =>{
    try {
        Agent.aggregate([
            {
                $lookup : {
                    from : 'clients',
                    localField : '_id',
                    foreignField : 'agent_id',
                    as : 'clientData'
                }
            },
            { 
                $addFields: {
                    client_count: {$size: "$clientData"},
                    maximum_bill : {$max : "$clientData.total_bill"},
                    total_bill : {$sum : "$clientData.total_bill"},
                    agent_name : '$name',
                    client_name : "$clientData"
                }
            },
            {
                $project : {
                    _id : 0,
                    agent_name : 1,
                    client_name:1,
                    maximum_bill : 1,
                    total_bill : 1
                }
            },
            {
                $sort : {
                    maximum_bill : -1,
                    client_count  : -1
                }
            },
            {
                $limit : 1
            }
        ]).then((data) =>{
            res.status(200).json({status:1,success : true,'message': 'Agent Details','data' : data});
        });
    } catch(error) {
        return res.status(500).json({status:0,success:false,'Error' : error});
    };
}];

module.exports.storeUser = [
    check('name', "Name must not be empty!").isLength({ min: 3 }).trim(),
    check('user_type', "User Type Must not be empty!").not().isEmpty().trim(),
    check('address1', "Address must not be empty!").trim().custom((value,{req}) => {
        var type = req.body.user_type || 0;
        if(type == 1 && value == ''){
            return Promise.reject("Address 1 is required!");
        }
        return Promise.resolve();
    }),
    check('state', "State must not be empty").trim().custom((value,{req}) => {
        var type = req.body.user_type || 0;
        if(type == 1 && value == ''){
            return Promise.reject("State is required!");
        }
        return Promise.resolve();
    }),
    check('city', "City must not be empty").trim().custom((value,{req}) => {
        var type = req.body.user_type || 0;
        if(type == 1 && value == ''){
            return Promise.reject("City is required!");
        }
        return Promise.resolve();
    }), 
    check('mobile', "Mobile must not be empty")
        .not().isEmpty()
        .isLength({ min: 10, max :10 })
        .withMessage('Mobile length should be 10 digits!')
        .trim()
        .custom(async(value, {req,res}) =>{
        var type = req.body.user_type || 0;
        if(type == 1){
             return Agent.findOne({mobile : value}).then((data) =>{
                if(data){
                    return Promise.reject("Mobile is already exist for another Agency!");
                } else {
                    return Promise.resolve();
                }
             });
        } else if(type == 2){
            return Client.findOne({mobile : value}).then((data) =>{
                if(data){
                    return Promise.reject("Mobile is already exist for another Client!");
                } else{
                    return Promise.resolve();
                }
             });
        } else {
            return Promise.reject("Type should be either 1 or 2!");
        }
    }),
     check('agent_id', "Agent Id must not be empty!").trim().custom((value,{req}) => {
        var type = req.body.user_type || 0;
        if(type == 2){
            if(value == ''){
                return Promise.reject("Agent Id is required!");
            } else if(!mongoose.Types.ObjectId.isValid(req.body.agent_id)){
                return Promise.reject("Invalid Agent Id!");
            } else {
                return Agent.findOne({'_id':value}).then((data) =>{
                    if(!data){
                        return Promise.reject("Agency is not exist!");
                    } else {
                        return Promise.resolve();
                    }
                 });
            }
        }else {
            return Promise.resolve();
        }
    }),
    check('email', "Email must not be empty!!").trim().custom((value,{req}) => {
        var type = req.body.user_type || 0;
        if(type == 2){
            if(value !== ''){
                const emailToValidate = value;
                const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
                if(emailRegexp.test(emailToValidate) == false){
                    return Promise.reject("Invalid Email!");
                } else {
                    return Client.findOne({'email':value}).then((data) =>{
                        if(data){
                            return Promise.reject("Email is already exist!");
                        }
                    });
                }
            } else {
                return Promise.reject("Email is required!");
            }
        } else {
            return Promise.resolve();
        }
    }),
    check('total_bill', "Total Bill must not be empty.").trim().custom((value,{req}) => {
        var type = req.body.user_type || 0;
        if(type == 2){
            if(value == ''){
                return Promise.reject("Total Bill is required!");
            } else if(isNaN(value) == true || value == 0){
                return Promise.reject("Total Bill is must be a number and it should be minimun 1!.");
            } else{
                return Promise.resolve();
            }
        }else {
            return Promise.resolve();
        }
    }), 
    (req,res) =>{
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                var tot = errors.errors;
                var result = [];
                tot.forEach((err) => {
                    result.push(err.msg);
                });
                return res.status(400).json({status:0,success:false,'Error':result});
			} else {
                var type = req.body.user_type;
                if(type == 1){
                    var agent = new Agent({
                        name : req.body.name,
                        address1 : req.body.address1,
                        address2 : req.body.address2,
                        state : req.body.state,
                        city : req.body.city,
                        mobile : req.body.mobile
                    });
                    agent.save((error,result) => {
                        if (error) { 
                            return res.status(500).json({status:0,success:false,'Error':error});
                        }
                        return res.status(200).json({status:1,success:true,'message':'Agent Details Saved Successfully!',data:result});
                    });
                } else if(type == 2){
                    var client = new Client({
                        name : req.body.name,
                        email : req.body.email,
                        mobile : req.body.mobile,
                        total_bill : req.body.total_bill,
                        agent_id :  req.body.agent_id
                    });

                    client.save((error,result) => {
                        if (error) { 
                            return res.status(500).json({status:0,success:false,'Error':error});
                        }
                        return res.status(200).json({status:1,success : true, 'message':'Client Details Saved Successfully!',data:result});
                    }); 
                }else {
                    return res.status(400).json({status:0,success:false,'Error':'Invalid User Type!'});
                }
            }
            
        } catch(error){
            return res.status(500).json({status:0,success:false,'Error':error});
        }
}];


module.exports.updateUser = [
    check('name', "Name must not be empty").isLength({ min: 3 }).trim(),
    check('mobile', "Mobile must not be empty")
        .not().isEmpty()
        .isLength({ min: 10, max :10 })
        .withMessage('Mobile length should be 10 digits')
        .trim()
        .custom(async(value, {req,res}) =>{
             return Client.findOne({mobile : value, _id : {"$ne": req.body.client_id}}).then((data) =>{
                if(data){
                    return Promise.reject("Mobile is already exist for another Client");
                } else {
                    return Promise.resolve();
                }
             });
    }),
     check('id', "Client Id must not be empty").trim().custom((value,{req}) => {
        if(value == ''){
            return Promise.reject("Client Id is required!");
        } else if(!mongoose.Types.ObjectId.isValid(req.params.id)){
            return Promise.reject("Invalid Client Id.");
        } else {
            return Client.findOne({'_id':value}).then((data) =>{
                if(!data){
                    return Promise.reject("Client is not exist!");
                } else {
                    return Promise.resolve();
                }
            });
        }
    }),
    check('agent_id', "Agent Id must not be empty").trim().custom((value,{req}) => {
        if(value == ''){
            return Promise.reject("Agent Id is required!");
        } else if(!mongoose.Types.ObjectId.isValid(req.body.agent_id)){
            return Promise.reject("Invalid Agent Id.");
        } else {
            return Agent.findOne({'_id':value}).then((data) =>{
                if(!data){
                    return Promise.reject("Agency is not exist!");
                } else {
                    return Promise.resolve();
                }
            });
        }
    }),
    check('email', "Email must not be empty!!").trim().custom((value,{req}) => {
        if(value !== ''){
            const emailToValidate = value;
            const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            if(emailRegexp.test(emailToValidate) == false){
                return Promise.reject("Invalid Email!");
            } else {
                return Client.findOne({'email':value, _id: { "$ne": req.params.id }}).then((data) =>{
                    if(data){
                        return Promise.reject("Email is already exist For another client!");
                    }
                });
            }
        } else {
            return Promise.reject("Email is required!");
        }
    }),
    check('total_bill', "Total Bill must not be empty.").trim().custom((value,{req}) => {
        if(value == ''){
            return Promise.reject("Total Bill is required!");
        } else if(isNaN(value) == true || value == 0){
            return Promise.reject("Total Bill is must be a number and it should be minimun 1!.");
        } else{
            return Promise.resolve();
        }
    }), 
    
    (req,res) => {
    try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                var tot = errors.errors;
                var result = [];
                tot.forEach((err) => {
                    result.push(err.msg);
                });
                return res.status(400).json({status:0,success:false,'Error':result});
			} else {
                var client_id = req.params.id;
                var client = 
                    {
                        name : req.body.name,
                        email : req.body.email,
                        mobile : req.body.mobile,
                        total_bill : req.body.total_bill,
                        agent_id :  req.body.agent_id
                    };
                Client.findByIdAndUpdate({'_id' : client_id}, client,{},(err) => {
                    if(err){
                        return res.status(500).json({status:0,success:false, 'Error':err});
                    } else {
                        let clientdata = new clientData(client);
                        return res.status(200).json({status:1,success:true,'message' : 'Client Details Updated!','data' : clientdata});
                    }
                });
            }
    } catch(error){
        return res.status(500).json({status:0,success:false,'Error' : error});
    }
}];