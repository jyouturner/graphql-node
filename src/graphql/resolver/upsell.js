
const GraphQLJSON = require('graphql-type-json');

module.exports = {
    JSON: GraphQLJSON,

    Query: {
        postSignInScreen: async (parent, args, {dataSources}) => {
            console.log("postSignInScreen args"+ args);
            //passed preAuthorizedEntitlements is actually a Stringified version
            var preAuthorizedEntitlements = JSON.parse(args.preAuthorizedEntitlements);
            console.log("preAuthorizedEntitlements "+ preAuthorizedEntitlements);
          
            //TODO need to change schema to use path instead of full url
            var upsellPromise = dataSources.appConfigApi.getJson(args.upsellUrl);
            var normalizerPromise = dataSources.normalizer.normalize(preAuthorizedEntitlements);
            var accessProducts = await normalizerPromise.then((data) => {
                console.log("get response from normalizer " + JSON.stringify(data));
                //we really only care the 'products' part
                return data.products;
            });

            var upsell = await upsellPromise.then((data) => {
                console.log("get response from upsell " + JSON.stringify(data));
                return data;
            });

            return {
                "products": accessProducts,
                "upsellOptions": upsell
            };

        }
    },

    SubscriptionsAndUpsell: {
        products: (parent) => {
            console.log("resoling products:" + JSON.stringify(parent));
            return parent.products;
        },
        upsell: (parent, args, context, info) => {
            console.log("resolving upsell:" + JSON.stringify(parent));
            var playStream = args.playStream;
            var device = args.device;
            var allUpsellOptions = parent.upsellOptions;
            //var upsell = tpm.getUpSellForStreamType(args.platform, args.playStream, parent.products, parent.upsellOptions);
            var userHasAccess = false;
            for (var product of parent.products) {
            
                if (product.name == playStream) {
                    
                    userHasAccess = true;
                }
            };
            if(userHasAccess){
                console.log("user has access to the "+ playStream+" no need to upsell");
                upsell = null;
            }else{
                console.log("user does not have access to stream type "+ playStream+" now look up upsell info of "+ playStream+ " on device " + device);
                upsell = allUpsellOptions[playStream][device];
            }
            

            console.log("and upsell:" + upsell);
            return upsell;
        }
    }

}