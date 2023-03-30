var aws_sdk = require('aws-sdk');
var fs = require('fs')

module.exports = {

  app_config_file: "./app.properties",

  paramSets: {
    int: ["-int", ""],
    qa: ["-qa", ""],
    stage: ["-stage", ""],
    prod: ["-prod", ""]
  },

  setPropertyFile: function(s) { this.app_config_file = s; },

  // Function for trying to fetch params from various sources
  // Params will walk a hierarchy naming convention based on the envDesc
  // First it will look in an app.properties file if available
  // Second it will look in the process.env (Lambda environement variables)
  // third it will look in the process.env.CONFIG_OBJ
  // Finally it will try to talk to AWS SSM for any remaining params.
  fetchParams: function(paramList, envDesc, awsRegion, callback) {
    var appProp = this.loadPropertiesFile(this.app_config_file);

    var envConfigObj = ((process.env.CONFIG_OBJ) ? JSON.parse(process.env.CONFIG_OBJ) : {});

    var rv = {}

    var envSet = ((this.paramSets[envDesc.toLowerCase()]) ? this.paramSets[envDesc.toLowerCase()] : [""]);

    var neededParams = paramList.map(function(s) {
      return {
        baseParam: s,
        possibleNames: envSet.map(function(ext) { return s + ext; } )
      };
    })

    // Params to pass to SSM
    var missingParams = [];

    // Look locally for each param
    for (var i = 0, len = neededParams.length; i < len; i++)
    {
      var neededParam = neededParams[i];
      var isFound = false;

      // walk possible names
      for (var pnI = 0, pnLen = neededParam.possibleNames.length; pnI < pnLen && isFound == false; pnI++)
      {
        var pName = neededParam.possibleNames[pnI];

        if (appProp[pName]) {
          isFound = true;
          rv[neededParam.baseParam] = appProp[pName];
        } else if (process.env[pName]) {
          isFound = true;
          rv[neededParam.baseParam] = process.env[pName];
        } else if (envConfigObj[pName]) {
          isFound = true;
          rv[neededParam.baseParam] = envConfigObj[pName];
        }
        //console.log('File: params, Class: exports, Function: fetchParams, Line 64 (): ', "|-oooo-| isFound", isFound," :: pName:",pName," :: neededParam:",neededParam);
      }

      if (isFound == false)
      {
        missingParams.push(neededParam)
      }
    }
    if (missingParams.length == 0 || awsRegion == null || awsRegion == "")
    {
      callback(null, Object.assign({}, appProp, rv))
    }
    else
    {
      console.log("Requesting " + missingParams.length + " from SSM in awsRegion::",awsRegion)
        //console.log('File: params, Class: exports, Function: fetchParams, Line 78 "missingParams:",missingParams(): '
        //, "missingParams:",missingParams);
      var ssm = new aws_sdk.SSM({apiVersion: '2014-11-06', region: awsRegion});

      var awsObj = {};
      var paramsToRequest = missingParams.slice();
      try {
        //console.log('params to req:', awsObj, ssm);
        getParamFromSSM(paramsToRequest, awsObj, ssm, function(err, data)
        {
          console.log('File: params, Class: , Function: , Line 89 (): '
          , "\-0-\ \-0-\errdata",err," :: dataerr :: ",data);
          if (err)
          {
            console.log(err, err.stack);
            // Return what we can
            callback(null, Object.assign({}, appProp, rv))
          }
          else
          {
            console.log('File: params, Class: , Function: , Line 99 (): '
            , data);
            //console.log('data: ', data);
            // Look for the best fit name in the aws Obj
            for (var i = 0, len = missingParams.length; i < len; i++)
            {
              var neededParam = missingParams[i];
              var isFound = false;

              // walk possible names
              for (var pnI = 0, pnLen = neededParam.possibleNames.length; pnI < pnLen && isFound == false; pnI++)
              {
                var pName = neededParam.possibleNames[pnI];
console.log('File: params, Class: , Function: , Line 112 (): '
, pName,": ", data[pName]);
                if (data[pName]) {
                  isFound = true;
                  rv[neededParam.baseParam] = data[pName];
                }
              }
            }
            //console.log('rv: ', rv);
              console.log('File: params, Class: , Function: , Line 121 (): '
              , "appProp:",appProp," || rv:",rv);
            callback(null, Object.assign({}, appProp, rv))
          }
        });
      }
      catch (err)
      {
        callback(err)
      }
    }

    function getParamFromSSM(paramObjList, awsObj, ssm, callback) {

      if (paramObjList.length == 0)
      {
        callback(null, awsObj)
      }
      else
      {
        console.log('File: params, Class: getParamFromSSM, Function: getParamFromSSM, Line 141 "paramObjList:",paramObjList(): '
        , "paramObjList:",paramObjList);
        var param = paramObjList.pop();
console.log('File: params, Class: getParamFromSSM, Function: getParamFromSSM, Line 144 (): '
, "param:",param);
        ssm.getParameters({Names: param.possibleNames, WithDecryption: true}, function(err, data)
        {
          if (err)
          {
            console.log(err, err.stack);
            // Return what we can
            //getParamFromSSM(paramObjList, awsObj, ssm, callback)
            // Caching, so Error:
            throw(err)
          }
          else
          {
            // Build an object from the AWS response
            for (var i = 0, len = data.Parameters.length; i < len; i++)
            {
              var param = data.Parameters[i];
console.log('File: params, Class: , Function: , Line 150 (): '
, "param:",param);
              awsObj[param.Name] = param.Value;
            }

            getParamFromSSM(paramObjList, awsObj, ssm, callback)
          }
        });
      }
    }
  },

  //Return a promise containing fetchParams
  getParams: function(paramList, envDesc, awsRegion) {
    var utils = this;
    return new Promise(function(resolve, reject) {
      utils.fetchParams(paramList, envDesc, awsRegion, function(err, data) {
        if (err) {
          console.log('File: params, Class: , Function: getParams, Line 177 (): '
          , "err:",err);
          return reject(err) }
        else {
          console.log('File: params, Class: , Function: getParams, Line 181 (): '
          , "resolveed: data:",data);
          resolve(data) }
      })
    })
  },

  // Yes, this is all Sync as lambdas run that way anyway...
  loadPropertiesFile: function(fileName)
  {
    var rv = {};
    if (fs.existsSync(fileName))
    {
      var contents = fs.readFileSync(fileName, 'utf8');
      var sContents = contents.split("\n");
      for (var i = 0, len = sContents.length; i < len; i++)
      {
        if (!sContents[i].startsWith("#"))
        {
          var paramArray = sContents[i].split("=")
          if (paramArray.length == 2)
          {
            rv[paramArray[0]] = paramArray[1]
          }
        }
      }
    }
    else
    {
      console.log(fileName + " not found")
    }
    console.log('|-o-| {rv} |-o-| File: params, Class: exports, Function: loadPropertiesFile, Line 215 (): '
    , 'rv:',rv);
    return rv;
  }
};
