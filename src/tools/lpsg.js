const daltonMobileProductsClient = require("./daltonMobileProductsClient");


if(process.argv.length==2){
    console.log("to upload, \n node src/tools/singleGame.js username password upload singleGameMapping.json storeKey QA/PROD true/false outputFile");
    console.log("to check, \n node src/tools/singleGame.js username password check QA/PROD sku [store]");
    console.log("\n example node src/tools/dalton2019.js username password check PROD lp.monthly.nonba apple")
    return;
}

if(process.argv[4]=='upload'){
    mappingFile = process.argv[5];
    storeKey = process.argv[6];
    env = process.argv[7];
    forReal = process.argv[8]=='true';
    outputFile = process.argv[9];
    console.log("processing " + mappingFile  +" to "+ storeKey+ " on " + env +" "+forReal);
    daltonMobileProductsClient.uploaSingleGamesDirectlyToDaltonAllStores(process.argv[2], process.argv[3], mappingFile, storeKey, env, forReal, outputFile);
}else if(process.argv[4]=='check'){
    env = process.argv[5];
    sku = process.argv[6];

    console.log("checking " + sku  +" on " + env);
    daltonMobileProductsClient.signInAndCheckProductInAllStores(process.argv[2], process.argv[3], env, sku);
}else{
    console.log("unrecognized command");
}