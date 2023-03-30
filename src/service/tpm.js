const mssUtils = require('mss-sead-js-utils');
const http = mssUtils.HTTP;

var dataHost = '';

const getJson = async function(dataFilePath) {
    try{
        console.log("featching "+ dataHost + dataFilePath);
        return await http.getPromise(dataHost + dataFilePath).then((data) => {
            return JSON.parse(data.body);
        });
    }
    catch (err) {
        console.log('err: ', err);
        return err;
    }
}


module.exports = {
  Create: function(dataSourceHost) {
    dataHost = dataSourceHost;
    return {
        getJson
    
    }
    
  }
};
