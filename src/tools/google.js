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

const androidCsvWriter = createCsvWriter({
    path: 'androidSku.csv',
    header: header
  });

function jsonToAndroidCsvFile(jsonData){
    var csvData = [];
    for (var skuObject of jsonData) {
        if(!skuObject.sku){
            continue;
        }
        csvData.push(
            {
                sku: skuObject.sku,
                publishState: "published",
                purchaseType: "managed_by_android",
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

async function writeAndroid(skus){
    var androidCsv = jsonToAndroidCsvFile(skus);
    androidCsvWriter.writeRecords(androidCsv).then(()=> console.log('The CSV file was written success'));

}


module.exports = {
    androidCsvWriter,
    header,
    jsonToAndroidCsvFile,
    writeAndroid
};