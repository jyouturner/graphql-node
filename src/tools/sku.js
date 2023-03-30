//this script is to provide below functions
//1, read the https://[domain]/mobile/apps/configs/dev/sales_sheets/sales_sheet_mobile_2019_0_0.json, where we will maintain all the sales cards 
//through the whole season (I HOPE!!!!), and print out the SKU that LP Ops can use to upload to store

const mssUtils = require('mss-sead-js-utils');
const http = mssUtils.HTTP;
const amazon = require("../tools/amazon");
const android = require("../tools/google");
const ios = require("../tools/ios");


async function getJsonFile(dataSourceHost, dataFilePath) {
    return await http.getPromise(dataSourceHost + dataFilePath).then((data) => {
        return Promise.resolve(JSON.parse(data.body));
    });
}

async function getTeamFeed() {
    return await http.getPromise("http://data.nba.net/prod/v1/2019/teams.json").then((data) => {
        return Promise.resolve(JSON.parse(data.body));
    })
}


function findPriceOfSkuFromMap(resolvedSku, toggleableSkuPriceMap, teams) {
    var price = "NA";

    if (resolvedSku.startsWith("tp")) {
        //note, for team pass, we have the real sku like tp_atl_monthly, but in the lookup table
        //we have tp_{{lowercaseTricode}}_.... 
        for (var team of teams) {
            resolvedSku = resolvedSku.replace(new RegExp(team, "g"), "{{lowercaseTricode}}");
        }
    }
    for (var skuObject of toggleableSkuPriceMap) {
        if (skuObject.sku == resolvedSku) {
            price = skuObject.price;
            break;
        }

    }
    return price;
}

function findAllSkusBasedOnTemplate(template, options) {
    var skus = [];
    var stack = [];
    stack.push(template);
    while (stack.length > 0) {
        var skuTemplate = stack.pop();
        //find the {{stuff}} bball_{{term}}
        var start = skuTemplate.indexOf("{{");
        if (start == -1) {
            //good, all variables are resolved at this point.
            skus.push(skuTemplate);
        } else {
            //replace it
            var end = skuTemplate.indexOf("}}");
            var v = skuTemplate.substring(start + 2, end);

            if (options[v] != undefined && options[v].length > 0) {
                for (var optionValue of options[v]) {
                    var newThing = skuTemplate.replace(new RegExp("{{" + v + "}}", "g"), optionValue);
                    //put it back to stack
                    replaced = true;
                    stack.push(newThing);
                }
            } else {
                //odd, there is variable but there is NO option values!!!
                //report the error, and get out otherwise it is deadloop
                skus.push("ERROR: no value is found for variable");
                break;
            }
        }
    }
    return skus;
}

async function getAllSkus() {
    var options = [];
    var teamData = await getTeamFeed();
    var teams = [];
    for (var team of teamData.league.standard) {
        if (team.isNBAFranchise) {
            teams.push(team.tricode.toLowerCase());
        }
    }
    options["lowercaseTricode"] = teams;

    var jsonData = await getJsonFile("https://[domain]/mobile/apps/configs/", "dev/sales_sheets/sales_sheet_mobile_2019_0_0.json");

    var skuValues = [];
    for (var product of jsonData.products) {
        console.log(product.name);
        //iterate all the SKUs of the product
        var sku = product.sku;
        if (sku.type === 'toggleable') {
            var template = sku.template.toggleableSkuTemplate;
            //now check each possible value of the toggle, and replace the variable in the template

            for (var toggle of sku.toggles) {
                if (toggle.toggleType === 'term') {
                    options[toggle.skuTemplateSubstitutions.key] = [toggle.skuTemplateSubstitutions.toggleValue.monthly, toggle.skuTemplateSubstitutions.toggleValue.yearly];

                } else if (toggle.toggleType === 'addOn') {

                    options[toggle.skuTemplateSubstitutions.key] = [toggle.skuTemplateSubstitutions.toggleValue.on, toggle.skuTemplateSubstitutions.toggleValue.off];
                }
            }
            var resolvedSkus = findAllSkusBasedOnTemplate(template, options);
            for (var resolvedSku of resolvedSkus) {
                if (resolvedSku.startsWith("ERROR")) {
                    //this is not resolved...
                    skuValues.push(
                        {
                            "type": product.type,
                            "sku": resolvedSku,
                            "price": "NA"
                        }
                    );
                } else {
                    var price = findPriceOfSkuFromMap(resolvedSku, sku.template.toggleableSkuPriceMap, teams);
                    if (price === "NA") {
                        //error, there is such a SKU based on template but we don't have it in our price lookup table
                        skuValues.push(
                            {
                                "type": product.type,
                                "sku": "no " + resolvedSku + " is found in the price map",
                                "price": "NA"
                            }
                        );
                    } else {
                        //so all are good, need to check duplicate
                        var found=false;
                        for(var skuValue of skuValues){
                            if(skuValue.sku===resolvedSku){
                                found=true;
                            }
                        }
                        if(found){
                            continue;
                        }
                        skuValues.push(
                            {
                                "type": getProductType(product.type),
                                "template": sku.template.toggleableSkuTemplate,
                                "sub": "subscription",
                                "sku": resolvedSku,
                                "price": price,
                                "priceAmount": (price.startsWith("$")?parseFloat(price.substring(1)):parseFloat(price)), 
                                "billingInterval": getBillingIntervalFromSku(resolvedSku),
                                "description": getDescriptionFromSku(resolvedSku),
                                "universalProductId": getUniversalProductIdFromSku(resolvedSku),
                                "entitlements": getEntitkementsFromSku(resolvedSku).entitlements
                            }
                        );
                    };
                }
            }

        } else if (sku.type === 'nontoggleable') {
            skuValues.push(
                {
                    "type": getProductType(product.type),
                    "template": "",
                    "sub": "purchase",
                    "sku": sku.sku,
                    "price": sku.price,
                    "priceAmount": (price.startsWith("$")?parseFloat(price.substring(1)):parseFloat(price)), 
                    "billingInterval": getBillingIntervalFromSku(sku.sku),
                    "description": getDescriptionFromSku(sku.sku),
                    "universalProductId": getUniversalProductIdFromSku(sku.sku),
                    "entitlements": getEntitkementsFromSku(sku.sku).entitlements
                }
            );
        } else {
            console.error("unexpected " + sku.type);

        }

    }

    return skuValues;
}

function getEntitkementsFromSku(sku){
    var entitlements = [];
  
    if(sku.startsWith("lpcf")){
        entitlements.push("lpcf");
        entitlements.push("lprdo");
        if(sku.indexOf("withnba")>-1){
            entitlements.push("nbatvd2c");
        }
    }
    else if(sku.startsWith("lp")){
        entitlements.push("lpbp");
        entitlements.push("lprdo");
        if(sku.indexOf("withnba")>-1){
            entitlements.push("nbatvd2c");
        }
        
    }else if(sku.startsWith("tp")){
        //get team example tp.ind.
        var teamTriCode = sku.substring("tp.".length, "tp.atl".length);
        
        entitlements.push("lpbc"+"("+teamTriCode.toUpperCase()+")");
        if(sku.indexOf("withnba")>-1){
            entitlements.push("nbatvd2c");
        }
        
        

    }else if(sku.startsWith("nba")){
        entitlements.push("nbatvd2c");
    }else if(sku.startsWith("nextvr")){
        entitlements.push("lpnextvr");
    }else if(sku.startsWith("audio")){
        entitlements.push("lprdo");
    }else{
        
    }
    return {
        "entitlements": entitlements.toString().replace(/,/g,"_")
    }
}
function getProductType(typeFromSalesCard){
    if(typeFromSalesCard.startsWith("commercialfree")){
        return "lp premium";
    }else if(typeFromSalesCard.startsWith("premium")){
        return "lp";
    }else if(typeFromSalesCard.startsWith("team")){
        return "team";
    }else if(typeFromSalesCard.startsWith("nbatv")){
        return "nbatv";
    }else if(typeFromSalesCard.startsWith("vr")){
        return "NextVR Only";
    }else if(typeFromSalesCard.startsWith("audio")){
        return "Audio Only";
    }else if(typeFromSalesCard.startsWith("game")){
        return "Single Game"
    }else{
        return "NA";
    }
}
function getBillingIntervalFromSku(sku){
    //console.log("trying to figure out billing interval from sku "+ sku);
    if(sku.indexOf("monthly")>-1){
        return "monthly";
    }else if(sku.indexOf("annual")>-1){
        return "annual";
    }
    return "";
}

function getDescriptionFromSku(sku){
    console.log("trying to figure out description from sku "+ sku);
    var desc = "";
    if(sku.startsWith("lpcf")){
        desc = desc + "NBA League Pass Premium";
        if(sku.indexOf("withnba")>-1){
            desc = desc + " with NBA TV ";
        }
    }
    else if(sku.startsWith("lp")){
        desc = desc + "NBA League Pass";
        if(sku.indexOf("withnba")>-1){
            desc = desc + " with NBA TV ";
        }
        if(sku.indexOf("nextvr")>-1){
            desc = desc + " NextVR ";
            
        }
        if(sku.indexOf("audio")>-1){
            desc = desc + "NBA League Pass Audio ";
            
        }
        if(sku.indexOf("20")>-1){
            //one time purchase
            desc = desc + " "+ sku.substring(sku.indexOf("20"));
        }
        
    }else if(sku.startsWith("tp")){
        desc = desc + "NBA Team Pass";
        
        //get team example tp.ind.
        var teamTriCode = sku.substring("tp.".length, "tp.atl".length);
        desc = desc + " "+ teamTriCode.toUpperCase();
        if(sku.indexOf("withnba")>-1){
            desc = desc + " with NBA TV ";
        }

    }else if(sku.startsWith("nba")){
        desc = desc + "NBA TV";
    }else if(sku.startsWith("nextvr")){
        desc = desc + "Next VR";
    }else if(sku.startsWith("audio")){
        desc = desc + "NBA League Pass Audio";
    }else{
        desc = desc + "NA-";
    }
    var billingInterval = "";
    if(sku.indexOf("monthly")>-1){
        billingInterval = "Monthly";
    }else if(sku.indexOf("annual")>-1){
        billingInterval = "Annual";
    }
   
    if(billingInterval){
        desc = desc + " " + billingInterval;
    }
    return desc;
}

function getUniversalProductIdFromSku(sku){
    console.log("trying to figure out universal product id from sku "+ sku);
    /**
     * 
     * tp:gsw:annual
       tp:bos:monthly
       lp:annual
       lp:monthly
       lpprem:annual
       lpprem:monthly
       bball:annual
       bball:monthly
       tp:gsw:bbll:annual
        tp:bos:bbll:monthly
        lp:bbll:annual
        lp:bbll:monthly
        lpprem:bbll:annual
        lpprem:bbll:monthly
        lp:2019
        lp:audio:2019
        lp:nextvr:2019
     */
    
    var pid = "";
    if(sku.startsWith("lpcf")){
        pid = pid + "lpprem";
        if(sku.indexOf("withnba")>-1){
            pid = pid + ":nba";
        }
    }else if(sku.startsWith("lp")){
        var pid = pid + "lp";
        if(sku.indexOf("withnba")>-1){
            pid = pid + ":nba";
        }
        
        if(sku.indexOf("20")>-1){
            //one time purchase
            pid = pid + ":"+sku.substring(sku.indexOf("20"));
        }
        
    }else if(sku.indexOf("nextvr")>-1){
        pid = pid + "nextvr";
        if(sku.indexOf("20")>-1){
            //one time purchase
            pid = pid + ":"+sku.substring(sku.indexOf("20"));
        }
    }
    else if(sku.indexOf("audio")>-1){
        pid = pid + "audio";
        if(sku.indexOf("20")>-1){
            //one time purchase
            pid = pid + ":"+sku.substring(sku.indexOf("20"));
        }
        
    }else if(sku.startsWith("tp")){
        pid = pid + "tp";
        
        //get team example tp.ind.
        var teamTriCode = sku.substring("tp.".length, "tp.atl".length);
        pid = pid + ":"+ teamTriCode.toLowerCase();
        if(sku.indexOf("withnba")>-1){
            pid = pid + ":nba";
        }
        if(sku.indexOf("20")>-1){
            //one time purchase
            pid = pid + ":"+sku.substring(sku.indexOf("20"));
        }

    }else if(sku.startsWith("nba")){
        pid = pid + "nba";
        if(sku.indexOf("20")>-1){
            //one time purchase
            pid = pid + ":"+sku.substring(sku.indexOf("20"));
        }
    }else{
        pid = pid + "NA";
    }
    var billingInterval = getBillingIntervalFromSku(sku);
    if(billingInterval){
        pid = pid + ":" + billingInterval;
    }
    return pid;
}


function jsonToConfluenceTable(jsonData) {
    var table = "";
    var currentDate = new Date();
    
    table = table.concat("<p>automatically generated content, last updated at "+  currentDate + "</p>");
    table =  table.concat("<table class=\"confluenceTable\">");
    table = table.concat("<tbody>");
    table = table.concat("<tr>");
    table = table.concat("<th class=\"confluenceTh\">type</th>");
    //table = table.concat("<th class=\"confluenceTh\">template</th>");
    table = table.concat("<th class=\"confluenceTh\">billing</th>");
    table = table.concat("<th class=\"confluenceTh\">sku</th>");
    table = table.concat("<th class=\"confluenceTh\">price</th>");
    table = table.concat("<th class=\"confluenceTh\">billing interval</th>");
    table = table.concat("<th class=\"confluenceTh\">description</th>");
    table = table.concat("<th class=\"confluenceTh\">universal product id</th>");
    table = table.concat("<th class=\"confluenceTh\">entitlements</th>")
    table = table.concat("</tr>");
    for (var skuObject of jsonData) {
        if(!skuObject.sku){
            continue;
        }
        table =  table.concat("<tr>");
        table = table.concat("<td  class=\"confluenceTd\">" + skuObject.type + "</td>");
        //table = table.concat("<td  class=\"confluenceTd\">" + skuObject.template + "</td>");
        table = table.concat("<td  class=\"confluenceTd\">" + skuObject.sub + "</td>");
        table = table.concat("<td  class=\"confluenceTd\">" + skuObject.sku + "</td>");
        table = table.concat("<td  class=\"confluenceTd\">" + skuObject.price + "</td>");
        table = table.concat("<td  class=\"confluenceTd\">" + skuObject.billingInterval + "</td>");
        table = table.concat("<td  class=\"confluenceTd\">" + skuObject.description + "</td>");
        table = table.concat("<td  class=\"confluenceTd\">" + skuObject.universalProductId + "</td>");
        table = table.concat("<td  class=\"confluenceTd\">" + skuObject.entitlements + "</td>")
        table = table.concat("</tr>");
    }
    table = table.concat("</tbody>");
    table = table.concat("</table>");
    return table;
}

function csvDataToConfluenceTable(header, csvData){
    //console.log('csv data:\n'+csvData);
    var table = "";
    var currentDate = new Date();
    table = table.concat("<p>automatically generated content, last updated at "+ currentDate+ "</p>");
    table =  table.concat("<table class=\"confluenceTable\">");
    table = table.concat("<tbody>");
    table = table.concat("<tr>");
    //iterate the csv writer header
    for(var col of header){
        table = table.concat("<th class=\"confluenceTh\">"+ col.title+"</th>");
    }
    
    table = table.concat("</tr>");
    for (var row of csvData) {
       
        table =  table.concat("<tr>");
        for(var col of header){
            table = table.concat("<td class=\"confluenceTd\">"+ row[col.id]+"</td>");
        };
        table = table.concat("</tr>");
    }
    table = table.concat("</tbody>");
    table = table.concat("</table>");
    return table;
}

const fs = require('fs');

async function outputData(updateConfluence) {
    var skus = await getAllSkus();
    //console.log(skus);

    //var daltonCsv = dalton.jsonToDaltonCsvFile(skus);
    /*the uploading to dalton is handled by the daton2019.js and dalton2018.js now
    var daltonMappingData = dalton.getDaltonMappingJson(skus);
    console.log(daltonMappingData);
    fs.writeFile("daltonMapping.json", JSON.stringify(daltonMappingData, null, 4), function(err) {
        if(err) {
            return console.log(err);
        }
    
        console.log("The file was saved!");
    });
    */
    //the uploading to dalton is handled by the daton2019.js and dalton2018.js now
    //if(uploadToDalton){
        //upload to dalton QA
        //dalton.uploadToDaltonAllStores("https://audience.qa.nba.com", daltonMappingData);
//}
    
    //dalton.daltonCsvWriter.writeRecords(daltonCsv).then(()=> console.log('The CSV file was written success'));
    //var daltonConfluenceTable = csvDataToConfluenceTable(dalton.header, daltonCsv);
    //console.log(daltonConfluenceTable);

    var androidCsv =  android.jsonToAndroidCsvFile(skus);
    android.androidCsvWriter.writeRecords(androidCsv).then(()=> console.log('The CSV file was written success'));
    var androidConfluenceTable = csvDataToConfluenceTable(android.header, androidCsv);
    //console.log(androidConfluenceTable);

    var amazonCsv = amazon.jsonToAmazonCsvFile(skus);
    amazon.amazonCsvWriter.writeRecords(amazonCsv).then(()=> console.log('The CSV file was written success'));
    var amazonConfluenceTable = csvDataToConfluenceTable(amazon.header, amazonCsv);
    //console.log(amazonConfluenceTable);

    var iosCsv = ios.jsonToIosCsvFile(skus);
    ios.iosCsvWriter.writeRecords(iosCsv).then(() => console.log('the csv file has been created'));
    var iosConfluenceTable = csvDataToConfluenceTable(ios.header, iosCsv);
    //console.log(iosConfluenceTable);

    var confluenceTable = jsonToConfluenceTable(skus);
    //make POST request to the TPM confluence API
    //console.log(confluenceTable);
    if(!updateConfluence){
        return;
    }
    
    //https://service-apis-us-east-1.nonprod.nbad.io/tpm-lambda-qa/confluence/N2S/921305384/{{divId}}
    await http.postPromise("https://service-apis-us-east-1.nonprod.nbad.io/tpm-lambda-qa/confluence/N2S/921305384/skuTable", null, confluenceTable).then((data) => {
        console.log("sku table \n"+data);
        return Promise.resolve(JSON.parse(data.body));
    });
 
    console.log("about to update the google store data table...");
    await http.postPromise("https://service-apis-us-east-1.nonprod.nbad.io/tpm-lambda-qa/confluence/N2S/921305384/googleStoreFile", null, androidConfluenceTable).then((data) => {
        console.log("google table \n"+data);
        return Promise.resolve(JSON.parse(data.body));
    });

    console.log("about to update the amazon store data table...");
    await http.postPromise("https://service-apis-us-east-1.nonprod.nbad.io/tpm-lambda-qa/confluence/N2S/921305384/amazonStoreFile", null, amazonConfluenceTable).then((data) => {
        console.log("amazon table \n"+data);
        return Promise.resolve(JSON.parse(data.body));
    });
    console.log("about to update the itune store data table...");
    await http.postPromise("https://service-apis-us-east-1.nonprod.nbad.io/tpm-lambda-qa/confluence/N2S/921305384/iosStoreFile", null, iosConfluenceTable).then((data) => {
       console.log("itune table \n"+data);
        return Promise.resolve(JSON.parse(data.body));
    });

}

outputData(true);

