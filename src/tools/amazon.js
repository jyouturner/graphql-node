var createCsvWriter = require('csv-writer').createObjectCsvWriter;

const header = [
    {id: 'sku', title: 'Product ID'},
    {id: 'parentSku', title: 'Parent SKU'},
    {id: 'longDescription', title: 'Locale; Title; Description'},
    {id: 'isAutoFillPrice', title: 'Auto Fill Prices'},
    {id: 'price', title: 'Price'},
    {id: 'isConsumableOrEntitlement', title: 'IAP Type'},
  ];

const amazonCsvWriter = createCsvWriter({
    path: 'amazonSku.csv',
    header: header
  });

function jsonToAmazonCsvFile(jsonData){
    var csvData = [];
    for (var skuObject of jsonData) {
        if(!skuObject.sku){
            continue;
        }
        csvData.push(
            {
                sku: skuObject.sku,
                parentSku: skuObject.sku+".parent",
                longDescription: "en_US;"+skuObject.description+";Watch NBA Games Live",
                isAutoFillPrice: "TRUE",
                price: "USD;"+skuObject.priceAmount*1000000,
                isConsumableOrEntitlement: (skuObject.billingInterval?"Consumable":"Entitlement")
               
            }
        )
    }
    //TV, 
    for (var skuObject of jsonData) {
        if(!skuObject.sku){
            continue;
        }
        csvData.push(
            {
                sku: skuObject.sku+"_tv",
                parentSku: skuObject.sku+"_tv.parent",
                longDescription: "en_US;"+skuObject.description+";Watch NBA Games Live",
                isAutoFillPrice: "TRUE",
                price: "USD;"+skuObject.priceAmount*1000000,
                isConsumableOrEntitlement: (skuObject.billingInterval?"Consumable":"Entitlement")
               
            }
        )
    }
    return csvData;
}

async function writeAmazon(skus){
    var amazonCsv = jsonToAmazonCsvFile(skus);
    amazonCsvWriter.writeRecords(amazonCsv).then(()=> console.log('The CSV file was written success'));

}


module.exports = {
    header,
    amazonCsvWriter,
    jsonToAmazonCsvFile,
    writeAmazon
};