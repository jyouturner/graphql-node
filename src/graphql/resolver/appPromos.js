
const GraphQLJSON = require('graphql-type-json');

module.exports = {
    JSON: GraphQLJSON,
    Query: {
        appPromos: async (parent, args, context) => {
            var preAuthorizedEntitlements = null;
            //passed preAuthorizedEntitlements is actually a Stringified version
            if (args.preAuthorizedEntitlements) {
                preAuthorizedEntitlements = JSON.parse(args.preAuthorizedEntitlements);
                //console.log("preAuthorizedEntitlements " + preAuthorizedEntitlements);
            }
           
            //TODO need to change schema to use path instead of full url
            var promosJsonPromise = context.dataSources.appConfigApi.getJson(args.promoJsonUrl);
            var normalizerPromise = context.dataSources.normalizer.normalize(preAuthorizedEntitlements);

            var entitlements = await normalizerPromise.then((data) => {
                //console.log("get response from normalizer " + JSON.stringify(data));
                return data.entitlements;
            });

            var promosJSON = await promosJsonPromise.then((data) => {
                //console.log("get response from app promos " + JSON.stringify(data));
                return data;
            });
            //put user entitlements in the context for use later by resolvers
            context.entitlements=entitlements;
            return promosJSON;
            

        }
    },
    PromoUnit: {
        enabled: (parent, args, context, info) => {
            
            //use the 'filter in' and 'filter out' to decide whether to enable this promotion
            if(!parent.filterOutEntitlements){
                return true; //always
            }
            var entitlements = context.entitlements;
            var filterOut=false;
            for(var filterOutEntitlment of parent.filterOutEntitlements){
                //check whether user has it, if user has it, then we filter this promotion OUT
                Object.keys(entitlements).forEach(function (key) {
                    if (key == filterOutEntitlment && entitlements[key].isEntitled) {
                        //console.log("yes user has " + filterOutEntitlment);
                        filterOut = true;
                    }
                });
            }
            return !filterOut;
        },
        "backgroundImage": (parent, args) => {
            //check whether there is arguement, and additional data "backgroundImage_by_device", if so use 
            //the device specifc image, otherwise, just return the "backgroundImage"
            if(args.device){
                //console.log("passed the device type for the imaage " + args.device);
                if(parent.backgroundImage_by_device){
                    if(parent.backgroundImage_by_device[args.device]){
                        return parent.backgroundImage_by_device[args.device];
                    }
                }
            }
            return parent.backgroundImage;
        }
    }

}