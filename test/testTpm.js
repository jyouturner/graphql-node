const tpmInterface = require('../src/service/tpm');

const tpmService = tpmInterface.Create("https://[domain]/mobile/apps/configs/");

async function getAllSkus() {
  
    var jsonData = await tpmService.getJsonFile("dev/sales_sheets/sales_sheet_mobile_2019_0_0.json");
    for (var product of jsonData.products) {
        console.log(product.name);
    }
}


getAllSkus();