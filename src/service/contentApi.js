const http = require('../utils/http');


var dataHost = '';

const getPageByPath = async function(pagePath) {
    //call the content API page endpoint with path like "0/league/page/d01b5a90-0462-48ba-8ab3-9855c230cbe4"
    try{
        console.log("featching "+ dataHost + pagePath);
        return await http.getUrl(dataHost + pagePath+"?accessToken=internal|bb88df6b4c2244e78822812cecf1ee1b").then((data) => {
            return JSON.parse(data.body);
        });
    }
    catch (err) {
        console.log('err: ', err);
        return err;
    }
}

const getCollectionById = async function(uuid) {
    //call the content API  endpoint with path like "0/league/league/d01b5a90-0462-48ba-8ab3-9855c230cbe4"
    try{
        console.log("featching "+ dataHost + "0/league/collection/"+uuid);
        return await http.getPromise(dataHost + "0/league/collection/"+uuid+"?accessToken=internal|bb88df6b4c2244e78822812cecf1ee1b").then((data) => {
            return JSON.parse(data.body);
        });
    }
    catch (err) {
        console.log('err: ', err);
        return err;
    }
}


module.exports = {
  Create: function(contentApiHost) {
    dataHost = contentApiHost;
    return {
        getPageByPath,
        getCollectionById
    }
    
  }
};