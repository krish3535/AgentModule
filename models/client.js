const mongoose = require('mongoose');

var Schema = mongoose.Schema;
var clientModel = new Schema(
    {
        agent_id : {type: Schema.Types.ObjectId, ref: 'Agent', required : true},
        name : { type : String, required : true}, 
        email : { type : String, required : true},
        mobile : { type : String, required : true},
        total_bill : { type : Number, required : true}
    }, {
        timestamps : true
    }
);


var client_model = mongoose.model('Client',clientModel);
module.exports = client_model;