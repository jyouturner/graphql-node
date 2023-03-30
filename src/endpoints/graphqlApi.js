
const { graphql, buildSchema, execute, validate } = require('graphql');
const graphqlTools = require("graphql-tools");

const entitlementNormalizerInterface = require('../service/entitlementNormalizer');
const tpmInterface = require('../service/tpm');
const nbatvVodServiceInterface = require('../service/nbatvView');
const contentApiServiceInterface = require('../service/contentApi');
const nbatvOnAirAggregatorServiceInterface = require('../service/rundownService.js');

const path = require('path');
const { fileLoader, mergeTypes } = require('merge-graphql-schemas');
const fs = require('fs');
const handlerUtil = require('../utils/lambdaHandlerUtil');

//load the schema from the ./schema folder
const typesArray = fileLoader(path.join(__dirname, '../graphql/schema'));
const typeDefs = mergeTypes(typesArray, { all: true })
//graphql resolvers are in resolver.js. 
const resolvers = require('../graphql/resolvers');

const schema = graphqlTools.makeExecutableSchema({
    typeDefs,
    resolvers
  });

const entitlementNormalizer = entitlementNormalizerInterface.Create("https://[domain]/entitlement-int/", "normalizer");
const tpm = tpmInterface.Create("https://[domain]/mobile/apps/configs/dev/");
const nbatvVodView = nbatvVodServiceInterface.Create("https://strappii-view-int.nonprod.nbad.io/streams/view/0/");
const contentApi = contentApiServiceInterface.Create("https://api.qa.nba.net/");
const nbatvOnAirAggregator = nbatvOnAirAggregatorServiceInterface.Create("https://[domain]/onair-agg-qa/");


function getGraphQlQueryAndVariables(queryId, queryStringParameters, requestBody){
    var queryTextFile = "src/queries/" + queryId+".txt";
    var queryVairableFile = "src/queries/" + queryId+"_variables.json";
    var queryText= fs.readFileSync(queryTextFile, "UTF-8");
    var queryVariableJsonText= fs.readFileSync(queryVairableFile, "UTF-8");
    var persistendQueryVariableJson = JSON.parse(queryVariableJsonText);
   
    //if there is variable needed for the query, then, we assume the variable value is set from
    //the request query string or body. Typically this is used to provide the "preAuthorizedEntitlements"
    //and device type etc.
    if(persistendQueryVariableJson){
        for(var key in queryStringParameters){
            if(persistendQueryVariableJson.hasOwnProperty(key)){
                persistendQueryVariableJson[key] = queryStringParameters[key];
            }
        }
        if(requestBody){
            var body = JSON.parse(requestBody);
            Object.keys(body).forEach((key)=> {
                if(persistendQueryVariableJson.hasOwnProperty(key)){
                    persistendQueryVariableJson[key] = JSON.stringify(body[key]);
                }
            });
        }
    }
    console.log("finally the query is " + queryText +"  and variable is " +JSON.stringify(persistendQueryVariableJson));
    
    //the query and variable will be sent to Apollo as one JSON string
    var queryJson = {
        "query": queryText,
        "variables": persistendQueryVariableJson
    }
    return queryJson;
}

var serviceContext = {
  "dataSources": {
    'normalizer': entitlementNormalizer,
    'appConfigApi': tpm,
    "nbatvVodView": nbatvVodView,
    "contentApi": contentApi,
    "nbatvOnAirAggregator": nbatvOnAirAggregator
  }
  
};

exports.handler = (event, context, callback)=> {
    
    var queryId = handlerUtil.extractParam("queryId", event);
    var queryJson = getGraphQlQueryAndVariables(queryId, event.queryStringParameters, event.body);
    var queryText = queryJson.query;
    var variableValues = queryJson.variables;
    console.log("finally the query is " + queryText + "\nvariables "+ JSON.stringify(variableValues));

  var servicePromise = graphql(schema, queryText, resolvers, serviceContext, variableValues).then((response) => {
    console.log(response);
    return response;
    
  });

  servicePromise.then((response) => {
    queryRes = response;
    if(event.queryStringParameters['root']){
      console.log("from graphql \n"+response);
      console.log("want to return json starting from child of data node at "+ event.queryStringParameters['root']);
      queryRes = response['data'][event.queryStringParameters['root']];
  }
    callback(null, handlerUtil.buildResponseObj(200, 0, {}, queryRes));
  }).catch((err) => {
    callback(null, handlerUtil.buildResponseObj(500, 0, {}, err));
  });

}