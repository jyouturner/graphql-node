var createCsvWriter = require('csv-writer').createObjectCsvWriter;
const header = [
    {id: 'sku', title: 'Product ID'},
    {id: 'publishState', title: 'Published State'},
    {id: 'purchaseType', title: 'Purchase Type'},
    {id: 'autoTranslate', title: 'Auto Translate'},
    {id: 'longDescription', title: 'Locale; Title; Description'},
    {id: 'isAutoFillPrice', title: 'Auto Fill Prices'},
    {id: 'price', title: 'Price'},
    {id: 'priceTemplateId', title: 'Pricing Template ID'},
  ];

const rokuCsvWriter = createCsvWriter({
    path: 'rokuSku.csv',
    header: header
  });

function jsonToRokuCsvFile(jsonData){
    var csvData = [];
    for (var skuObject of jsonData) {
        if(!skuObject.sku){
            continue;
        }
        csvData.push(
            {
                sku: skuObject.sku,
                publishState: "published",
                purchaseType: "managed_by_Roku",
                autoTranslate: "FALSE",
                longDescription: "en_US;"+skuObject.description+";Watch NBA Games Live",
                isAutoFillPrice: "TRUE",
                price: skuObject.priceAmount*1000000,
                priceTemplateId: ""
                //isConsumableOrEntitlement: (skuObject.billingInterval?"Consumable":"Entitlement")
               
            }
        )
    }
    return csvData;
}

async function writeRoku(skus){
    var rokuCsv = jsonToRokuCsvFile(skus);
    rokuCsvWriter.writeRecords(rokuCsv).then(()=> console.log('The CSV file was written success'));

}


module.exports = {
    rokuCsvWriter,
    header,
    jsonToRokuCsvFile,
    writeRoku
};