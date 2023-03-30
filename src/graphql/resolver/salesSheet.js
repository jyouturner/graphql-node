const mssUtils = require('mss-sead-js-utils');
const GraphQLJSON = require('graphql-type-json');

module.exports = {
    JSON: GraphQLJSON,

    Query: {
        salesSheetScreen: async (parent, args, context) => {
            var preAuthorizedEntitlements = null;
            //passed preAuthorizedEntitlements is actually a Stringified version
            if (args.preAuthorizedEntitlements) {
                preAuthorizedEntitlements = JSON.parse(args.preAuthorizedEntitlements);
            }
           
            var salesSheetPromise = context.dataSources.appConfigApi.getJson(args.salesSheetUrl);
            var normalizerPromise = context.dataSources.normalizer.normalize(preAuthorizedEntitlements);

            var entitlements = await normalizerPromise.then((data) => {
                console.log("get response from normalizer " + JSON.stringify(data));
                return data.entitlements;
            });
            //put user entitlements in the context for use later by resolvers
            context.entitlements=entitlements;
            var salesSheetJSON = await salesSheetPromise.then((data) => {
                console.log("get response from salesSheet " + JSON.stringify(data));
                return data;
            });

            return salesSheetJSON;

        }
    },

    SalesSheet: {
        products: (parent, args, context, info) => {

            var products = getAvailableProductsForPlatform(args.device, parent.products);

            return products;
        }

    },

    Products: {
        readonly: (parent, args, context) => {
            //if a user already has entitlement to this product, then we set the readonly to TRUE.
            //each product has a JSON array list of entitlements
            return isProductSubscribedByUser(parent.accessByEntitlements, context.entitlements);
        },
        purchaseButton: (parent, args, context) => {
            if(isProductSubscribedByUser(parent.accessByEntitlements, context.entitlements)){
                //so user has it, now check whether this product is "subscription" or "purchase" - the
                //subscription product has the toggle (for monthly vs yearly)
                if(parent.sku.type==='toggleable'){
                    return {
                        "label": "Subscribed",
                        "enabled": false
                    }
                }else{
                    return {
                        "label": "Purchased",
                        "enabled": false
                    }
                }
            }else if(parent.sku.type==='toggleable'){
                return {
                    "label": "Subscribe",
                    "enabled": true
                }
            }else {
                return {
                    "label": "Buy",
                    "enabled": true
                }
            }
        }
    },

    //union Skus = ToggleableCard | NonToggleableCard
    Skus: {
        __resolveType(obj, context, info) {
            console.log("resolving the type of the card whether it is toggleable " + obj);
            if (obj.type==='toggleable') {
                return 'ToggleableCard';
            } else if (obj.type==='nontoggleable') {
                return 'NonToggleableCard';
            }{
                return 'NonToggleableCard';
            }
        }
    },
    //union Toggle = TermToggle | AddOnToggle
    Toggle: {
        __resolveType(obj, context, info) {
            console.log("resolving the type of the toggle, whether it is TERM or ADD ON " + obj);
            if (obj.toggleType==='term') {
                return 'TermToggle';
            } else if (obj.toggleType==='addOn') {
                return 'AddOnToggle';
            }{
                return 'AddOnToggle';
            }
        }
    },

    SkuTemplate: {
        toggleableSkuTemplate: (parent, args, context) => {
            //the template is set to lpcf_{{term}}_{{nbatv}} in the json data. When user
            //has the NBA TV entitlement, we are removing the NBA TV toogle, therefore we
            //need to update the template by replacing the {{nbatv}} with the "off" value
            //in the template lpcf_{{term}}_{{nbatv}}
            return parent.toggleableSkuTemplate;
        }
    },

    ToggleableCard: {
        template: (parent, args, context) => {
             //the template is set to lpcf_{{term}}_{{nbatv}} in the json data. When user
            //has the NBA TV entitlement, we are removing the NBA TV toogle, therefore we
            //need to update the template by replacing the {{nbatv}} with the "off" value
            //in the template lpcf_{{term}}_{{nbatv}}
            var template = parent.template;
            var skuTemplateString = parent.template.toggleableSkuTemplate;
            for(var toggle of parent.toggles){
                //console.log("checking " + toggle.title + " type "+ toggle.toggleType);
                if(toggle.toggleType === 'addOn'){
                    if(toggle.accessByEntitlements.length > 0){
                        if(isProductSubscribedByUser(toggle.accessByEntitlements, context.entitlements)){
                          
                            console.log("and we need to set the template "+ skuTemplateString+" key {{" + toggle.skuTemplateSubstitutions.key+"}} with off value " + toggle.skuTemplateSubstitutions.toggleValue.off);
                            skuTemplateString = skuTemplateString.replace(new RegExp("{{"+toggle.skuTemplateSubstitutions.key+"}}", "g"),toggle.skuTemplateSubstitutions.toggleValue.off);
                        }
                    }
                }
            
            }
            template.toggleableSkuTemplate = skuTemplateString;
            return template;
        },
        toggles: (parent, args, context) => {
            //for a toggle-able card, there are multiple toggles, some of them are Add-On, for example, nbatv.
            //if a user already has access to add-on, then we remove that toggle SKU from the list
           
            var availableToggles = [];
            for(var toggle of parent.toggles){
                //console.log("checking " + toggle.title + " type "+ toggle.toggleType);
                if(toggle.toggleType === 'addOn'){
                    if(toggle.accessByEntitlements.length > 0){
                        if(isProductSubscribedByUser(toggle.accessByEntitlements, context.entitlements)){
                            console.log("user alread has access to the add-on, skip it");
                           
                            continue;
                        }
                    }
                }
                availableToggles.push(toggle);
            }
            return availableToggles;
        }
    },
    //union Blackout = LocalBlackout | NationalBlackout
    Blackout: {
        __resolveType(obj, context, info) {
            console.log("resolving the type of the toggle, whether it is TERM or ADD ON " + obj);
            if (obj.type==='local') {
                return 'LocalBlackout';
            } else if (obj.type==='national') {
                return 'NationalBlackout';
            }{
                return 'NationalBlackout';
            }
        }
    }
};

const getAvailableProductsForPlatform = function (device, products) {
    
    console.log("checking " + device);
    var availableProducts = [];
    for (var product of products) {
        console.log("checking " + product.name);
        if (!product.enabled) {
            console.log("product is not enabled, we need to remove it from the products list.");
            continue;
        }
        //now check whether product is supported on the given device
        var allowed = false;
        for (var allowedDevice of product.platforms) {
            if (allowedDevice == device) {
                allowed = true;
                break;
            }
        }
        if (!allowed) {
            console.log("product " + product.name + " is not allowed on " + device);
            continue;
        }
        
        availableProducts.push(product);
    };

    return availableProducts;
}

const isProductSubscribedByUser= function (accessByEntitlements, userEntitlements){      
    
    for (var accessEntitlement of accessByEntitlements) {
        console.log("this can be accessed by "+ accessEntitlement);
        var entitlements = Object.keys(userEntitlements);
        for(var entitlement of entitlements){
            
            if(entitlement == accessEntitlement && userEntitlements[entitlement].isEntitled){
                
                return true;
            }
        }
        
    };
    return false;
}