const mongoose = require('mongoose');

var Schema = mongoose.Schema;
var agentModel = new Schema(
    {
        name : { type : String, required : true}, 
        address1 : { type : String, required : true},
        address2 : { type : String},
        state : { type : String, required : true},
        city : { type : String, required : true},
        mobile : { type : String, required : true},
    }, {
        timestamps : true
    }
);


var agent_model = mongoose.model('Agent',agentModel);
module.exports = agent_model;