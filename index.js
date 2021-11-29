const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
var app = express();
var agentRouter = require('./routes/agents');

app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

const MONGODB = 'mongodb://localhost:27017/library';
const PORT = process.env.PORT || 8080;

mongoose.connect(process.env.MONGODB_URI || MONGODB,{ useUnifiedTopology : true, useNewUrlParser : true}).then(() =>{
	console.log('connected');
}).catch(err =>{
	console.log(err);
}); 

app.get('/',(req,res)=>{
	res.send('Welcome To Agency Reports!');
});

app.use('/api',agentRouter);
app.listen(PORT);




