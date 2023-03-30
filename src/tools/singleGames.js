const daltonMobileProductsClient = require("./daltonMobileProductsClient");



function customizeForStoreFuntion(storeKey, skuData, configData){
    var storeProducts = [];
    if(storeKey==='itune'){
        
        //make a copy
        var prodJson = JSON.parse(JSON.stringify(skuData));
        return prodJson;
   }else if(storeKey==='android1'){
        if(!configData.androidClient1){
            console.warn("no android client id is set,skip android");
           
            return storeProducts;
        }
        
            //make a copy
            var prodJson = JSON.parse(JSON.stringify(skuData));
            prodJson.clientId = configData.androidClient1;
            return prodJson;
        
    }else if(storeKey==='android2'){
        if(!configData.androidClient2){
            console.warn("no android client id is set,skip android");
           
            return storeProducts;
        }
     
            //make a copy
            var prodJson = JSON.parse(JSON.stringify(skuData));
            prodJson.clientId = configData.androidClient2;
            return prodJson;
        
    }else if(storeKey==='amazonFireTab'){
       
            //make a copy
            var prodJson = JSON.parse(JSON.stringify(skuData));
            return prodJson;
        
    }else if(storeKey==='amazonFireTv'){
         //make a copy
         var prodJson = JSON.parse(JSON.stringify(skuData));
         return prodJson;
    }else if(storeKey==='roku'){
        
         //make a copy
         var prodJson = JSON.parse(JSON.stringify(skuData));
         return prodJson;
    }else{
        return "unknown "+ storeKey;
    }
   
}


if(process.argv.length==2){
    console.log("to upload, \n node src/tools/singleGame.js username password upload daltonMappingSingleGame2019.json 2919 QA/PROD true/false");
    console.log("to check, \n node src/tools/singleGame.js username password check QA/PROD sku [store]");
    console.log("\n example node src/tools/dalton2019.js username password check PROD lp.monthly.nonba apple")
    return;
}

if(process.argv[4]=='upload'){
    mappingFile = process.argv[5];
    seasonYear = process.argv[6];
    env = process.argv[7];
    forReal = process.argv[8]=='true';
    console.log("processing " + mappingFile  +" on " + env +" "+forReal);
    daltonMobileProductsClient.uploaSingleGamesToDaltonAllStores(process.argv[2], process.argv[3], mappingFile, seasonYear, customizeForStoreFuntion, env, forReal);
}else if(process.argv[4]=='check'){
    env = process.argv[5];
    sku = process.argv[6];
    store = process.argv.length>=8? process.argv[7]:null;
    console.log("checking " + sku +" at store " + store +" on " + env);
    daltonMobileProductsClient.signInAndCheckProductInAllStores(process.argv[2], process.argv[3], env, sku, store);
}else{
    console.log("unrecognized command");
}



//daltonMobileProductsClient.uploadMappingFileToDaltonAllStores("daltonMapping2019.json", "daltonMapping2019PRODRes.json", buildStoreDataFromStandardSet, 'PROD', false);
//daltonMobileProductsClient.signInAndcheckMobileProduct("https://audience.nba.com", "apple", "lp.annual.nonba", null);
//signInAndcheckMobileProduct("https://audience.qa.nba.com", "android", "lpcf.annual.nonba", "331155551631-8t6e33koltsdu7gtcd7stpic5ve33vf9.apps.googleusercontent.com");