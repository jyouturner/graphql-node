const http = require('../utils/http');
var savedEntitlementServiceHost = '';
var savedEntitlementServicePath = '';

var postHeader = {
  "Content-Type": "application/json"
};

const normalize = async function(entitlementSetJSON) {
  var payload = {
    'preAuthorizedEntitlements': entitlementSetJSON
  }
  try {
    const normalizedEntitlements = await http.postPromise(savedEntitlementServiceHost + savedEntitlementServicePath, postHeader, JSON.stringify(payload));
    var normalizedEntitlementsJSON = {};
    if (normalizedEntitlements && normalizedEntitlements.body) {
      normalizedEntitlementsJSON = JSON.parse(normalizedEntitlements.body);
    }
    return normalizedEntitlementsJSON;
  }
  catch (err) {
    console.log('err: ', err);
    return err;
  }
}

module.exports = {
  Create: function(entitlementServiceHost, entitlementServicePath) {
    savedEntitlementServicePath = entitlementServicePath;
    savedEntitlementServiceHost = entitlementServiceHost;
    return {
      normalize
    }
  }
};
