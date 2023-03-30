'use strict';

const params=require('../utils/params'),
    s3Utils=require('../utils/awsS3'),
    handlerUtil=require('../utils/lambdaHandlerUtil'),
    process = require('process');
const daltonSkuTool = require('../tools/daltonMobileProductsClient');
const querystring = require('querystring');

exports.handler = (event, context, callback)=> {
   
    try{
        /*
        var qaOrProd = handlerUtil.extractParam("env", event);
        var sku = handlerUtil.extractParam("sku", event);
        var store = handlerUtil.extractParam("store", event);
        var username = JSON.parse(event.body).username;
        var password = JSON.parse(event.body).password;
        */
       const params = querystring.parse(event.body);
       var qaOrProd = params['env'];
       var sku = params['sku'];
       var store = params['store'];
       var username = params['username'];
       var password = params['password'];
       
        daltonSkuTool.signInAndCheckProductInAllStores(username, password, qaOrProd, sku, store).then((data)=> {
            
             callback(null, handlerUtil.buildResponseObj(200, 60, {},  data));
        });
        

    }catch(err){
      
        callback(null, handlerUtil.buildResponseObj(500, 0, {}, {"status": "error", "message": err}));
    }
     
    
    
  };

