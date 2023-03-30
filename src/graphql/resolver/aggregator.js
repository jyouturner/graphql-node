
const GraphQLJSON = require('graphql-type-json');

module.exports = {
    JSON: GraphQLJSON,

    Query: {
        aggregator: async (parent, args, {dataSources}) => {
            var getPromise = dataSources.appConfigApi.getJson(args.skeletonUrl);
            var skeletonJson = await getPromise.then((data) => {
               
                return data;
            });
            
            return{
                "meta": skeletonJson.meta,
                "response": skeletonJson.response,
                "schedule": null,
                "vodEpisodes": null
            }

        }

    },

    ContentAPIResult:{
        content: async (parent, args, {dataSources}) => {
            var pageApiUrl = args.pageApiUrl;
            var contentApiPromise = dataSources.contentApi.getPageByPath(pageApiUrl);
            var contentApiJson = await contentApiPromise.then((data) => {
               
                return data;
            });
            return contentApiJson.response.result[0].body;
            
        }
    },

    BodyContent: {
        __resolveType(obj, context, info){
            
            if(obj.type=='appBlock'){
              return 'AppBlock';
            }
      
            if(obj.type=="showsItem"){
              return 'ShowsParagrah';
            }
      
            if(obj.type=="collectionItem"){
                return 'DrupalCollection';
            }
            return null;
        }
    },

    DrupalCollection: {
        content: async (parent, args, {dataSources}) => {
            console.log("resolving the drupal collection, in the mean time, we just need video collection");
            
          console.log("featching collection "+ parent.uuid);
            var contentApiPromise = dataSources.contentApi.getCollectionById(parent.uuid);
            var contentApiJson = await contentApiPromise.then((data) => {
                //console.log("get response from contentApi " + JSON.stringify(data));
                return data;
            });

            var response = contentApiJson.response;
            if(response.count===1){
                console.log("found the collection");
                return response.result[0].content;
            }else{
                console.error("no content is found at "+ parent.uuid);
                return null;
            }

            
        }
    },

    AppDataOrShowData: {
        __resolveType(obj, context, info){
           
            if(obj.type==='shows'){
                return 'Show';
            }
            return null;
        }
    },

    Aggregator:{
        schedule: async (parent, args, {dataSources}) => {
          
            var nbarvSchedulePromise = dataSources.nbatvOnAirAggregator.getRundown(args.nbatvRundownServiceUrl);
            var nbatvScheduleJson = await nbarvSchedulePromise.then((data) => {
                
                return data;
            });
           return nbatvScheduleJson;
        },

        vodEpisodes: async (parent, args, {dataSources}) => {
         
            var getPromise = dataSources.nbatvVodView.getVODEpisodesByRadiusCollectionId(args.radiusCollectionId);
            var jsonData = await getPromise.then((data) => {
                return data;
            });

            return jsonData;
        }
    }
}