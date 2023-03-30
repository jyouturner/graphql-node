const mssUtils = require('mss-sead-js-utils');
const http = mssUtils.HTTP;

var dataHost = '';

const getRundown = async function(path) {
    try{
        console.log("featching "+ dataHost + path);
        return await http.getPromise(dataHost + path).then((data) => {
            return JSON.parse(data.body);
        });
    }
    catch (err) {
        console.log('err: ', err);
        return err;
    }
}


module.exports = {
  Create: function(host) {
    dataHost = host;
    return {
        getRundown
    
    }
    
  }
};