module.exports = {

  // Use headersObj to pass in headers other then access control and cache control
  buildResponseObj: function(statusCode, cacheTimeSec, headersObj, body) {
    var hdrs = {}
    hdrs["Access-Control-Allow-Origin"] = "*",
    hdrs["Cache-Control"] = "max-age=" + cacheTimeSec + ""

    return {
      statusCode: statusCode,
      headers: Object.assign(hdrs, headersObj),
      body: this.sanitizeToString(body)
    };
  },

  extractParam: function(paramName, event, defValue = null) {
    var rv = defValue
    if (null != event)
    {
      if (null != event.pathParameters && null != event.pathParameters[paramName])
      {
        rv = event.pathParameters[paramName]
      }
      else if (null != event.queryStringParameters && null != event.queryStringParameters[paramName])
      {
        rv = event.queryStringParameters[paramName]
      }
    }
    console.log('File: lambdaHandlerUtil, Class: exports, Function: extractParam, Line 29 rv(): '
    , rv);
    return rv;
  },

  sanitizeToString: function(data) {
    if (null == data) { return "" }
    else if (typeof data == 'string') { return data }
    else { return JSON.stringify(data) }
  }
};