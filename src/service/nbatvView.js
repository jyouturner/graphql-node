const mssUtils = require('mss-sead-js-utils');
const http = mssUtils.HTTP;

var dataHost = '';

const getVODEpisodesByRadiusCollectionId = async function(radiusCollectionId) {
    try{
        console.log("featching "+ dataHost + "nbatv-vod/"+ radiusCollectionId);
        return await http.getPromise(dataHost +"nbatv-vod/"+radiusCollectionId).then((data) => {
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
        getVODEpisodesByRadiusCollectionId
    
    }
    
  }
};