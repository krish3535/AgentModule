const express = require('express');
var AgentController = require('../controllers/AgentController');

var router = express.Router();
router.get('/agents/list',AgentController.agentList);
router.post('/agents/store',AgentController.storeUser);
router.put('/client/update/:id',AgentController.updateUser);

module.exports = router;



