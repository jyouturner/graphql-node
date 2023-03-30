const daltonMobileProductsClient = require("./daltonMobileProductsClient");

var createCsvWriter = require('csv-writer').createObjectCsvWriter;

const header = [
    {id: 'sku', title: 'SKU'},
    {id: 'productId', title: 'Product ID'},
    {id: 'referenceName', title: 'Reference Name'},
    {id: 'type', title: 'Type'},
    {id: 'clearedForSale', title: 'Cleared For Sale'},
    {id: 'wholeSalePriceTier', title: 'Wholesale Price Tier'},
    {id: 'displayName', title: 'Displayed Name'},
    {id: 'description', title: 'Description'},
    {id: 'screenshotPath', title: 'Screenshot Path'},
    {id: 'effectiveDate', title: 'Effective Date'},
    {id: 'endDate', title: 'End Date'}
  ];

const iosCsvWriter = createCsvWriter({
    path: 'ios.csv',
    header: header
  });

const fs = require('fs');
async function createAppleStoreConnectFile(daltonMappingJsonFile){
    var daltonJsonText= fs.readFileSync(daltonMappingJsonFile, "UTF-8");
    var daltonMappingJson = JSON.parse(daltonJsonText);
    console.log(daltonMappingJson);
    //get the itune node
    const products = daltonMappingJson['itune'].products;
    //iterate through the products, particularily expand the teams
    var newTeams = await daltonMobileProductsClient.getMoreTeamProducts(products).then((data)=>{
        return data;
    });
        
    if(newTeams.length>0){
        
            for(var team of newTeams){
                //console.log("adding " + JSON.stringify(team, null, 4));
                products.push(team);
            }
    }  

    var csvData = [];
    for (var skuObject of products) {
        if(!skuObject.sku){
            continue;
        }
        csvData.push(
            {
                sku: skuObject.sku,
                productId: skuObject.sku,
                referenceName: "NBA Team Pass ORL Monthly",
                type: "Renewable",
                clearedForSale: "FALSE",
                wholeSalePriceTier: "1",
                displayName: "NBA Team Pass ORL Monthly",
                description: "Monthly Subscription to your favorite team",
                screenshotPath: "",
                effectiveDate:"",
                endDate:""
            }
        )
    }
    iosCsvWriter.writeRecords(csvData).then(()=> console.log('The CSV file was written success'));

}

function jsonToIosCsvFile(jsonData){
    var csvData = [];
    for (var skuObject of jsonData) {
        if(!skuObject.sku){
            continue;
        }
        csvData.push(
            {
                sku: skuObject.sku,
                productId: "com.turner.nba."+skuObject.universalProductId,
                referenceName: "",
                type: "",
                clearedForSale: "FALSE",
                wholeSalePriceTier: "",
                displayName: "",
                description: "",
                screenshotPath: "",
                effectiveDate:"",
                endDate:""
            }
        )
    }
    return csvData;
}

async function writeIos(skus){
    var iosCsv = jsonToIosCsvFile(skus);
    iosCsvWriter.writeRecords(iosCsv).then(()=> console.log('The CSV file was written success'));

}


module.exports = {
    iosCsvWriter,
    header,
    jsonToIosCsvFile,
    writeIos
};

createAppleStoreConnectFile("daltonMapping2019.json");