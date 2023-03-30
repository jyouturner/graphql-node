
const { ApolloServer, gql } = require('apollo-server-lambda');
const graphqlTools = require("graphql-tools");
const entitlementNormalizerInterface = require('../service/entitlementNormalizer');
const tpmInterface = require('../service/tpm');
const nbatvVodServiceInterface = require('../service/nbatvView');
const contentApiServiceInterface = require('../service/contentApi');
const nbatvOnAirAggregatorServiceInterface = require('../service/rundownService.js');
const path = require('path');
const { fileLoader, mergeTypes } = require('merge-graphql-schemas');

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

const server = new ApolloServer({
  schema,
  dataSources: () => {
    return {
      normalizer: entitlementNormalizer,
      appConfigApi: tpm,
      nbatvVodView: nbatvVodView,
      contentApi: contentApi,
      nbatvOnAirAggregator: nbatvOnAirAggregator
    }
  }
  });
  
exports.graphqlHandler = server.createHandler();