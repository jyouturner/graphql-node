
const GraphQLJSON = require('graphql-type-json');

module.exports = {
    JSON: GraphQLJSON,

    Query: {
        //vodEpisodes(radiusCollectionIds:String): [JSON]!
        vodEpisodes: async (parent, args, {dataSources}) => {
            var episodeCollections = [];
            console.log("getting vod of radius collections "+ args.radiusCollectionId);
            var vodViewPromise = dataSources.nbatvVodView.getVODEpisodesByRadiusCollectionId(args.radiusCollectionId);
            //return a JSON array, for multiple radius collections
            var nbatvEpisodesOfRadiusCollection = await vodViewPromise.then((data) => {
                
                return data;
            });
            episodeCollections.push(nbatvEpisodesOfRadiusCollection);
            return episodeCollections;

        }
    }
}