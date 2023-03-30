'use strict';

const params=require('../utils/params'),
    s3Utils=require('../utils/awsS3'),
    handlerUtil=require('../utils/lambdaHandlerUtil'),
    process = require('process');


exports.handler = (event, context, callback)=> {
  var message = handlerUtil.extractParam("message", event);
  if(!message){
    message = event.body;
  }
    callback(null, handlerUtil.buildResponseObj(200, 60, {}, "you said: " + message));
  
  
};