const mssUtils = require('js-utils');
const http = mssUtils.HTTP;

var normalizerUrl = "https://[domain]/entitlement-int/normalizer";
const preAuthorizedEntitlements = {
    preAuthorizedEntitlements:[]
};
async function normalizerCall(normalizerUrl, preAuthorizedEntitlements){
    return http.postPromise(normalizerUrl, '', preAuthorizedEntitlements).then((response) => {
        if (response.statusCode != 200) {
            return Promise.reject(new Error(response.body));
        }
        else {
            return Promise.resolve(JSON.parse(response.body));
        }
    }).catch(function (err) {
        console.log('Failed to get normalizer: ', err);
        return Promise.reject('Failed to get normalizer: ', err);
    });
}

async function getNormalizedProducts(normalizerUrl, preAuthorizedEntitlements){
    const products = await normalizerCall(normalizerUrl, preAuthorizedEntitlements).then((res) => {
        console.log('normalizer response received: '+ JSON.stringify(res.products));
        return res.products;
    });
    console.log(products);
    return products;
}

console.log("starting...");
var getProducts = function(){
    return http.postPromise(normalizerUrl, '', preAuthorizedEntitlements).then((response) => {
    if (response.statusCode != 200) {
        return Promise.reject(new Error(response.body));
    }
    else {
        console.log(response);
        return Promise.resolve(JSON.parse(response.body));
    }
}).then((res)=>{
    console.log("get "+res);
    return res.products;
});
}

// Call start
/*
not supported syntax
(async() => {
    console.log('before start');
  
    let products = await getProducts();
    
    console.log('after start');
  })();
*/
console.log("end");