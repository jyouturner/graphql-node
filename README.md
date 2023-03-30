# POC and Tools

## What is in the repo

Lambda functions by Node.JS

1. Demo

   This is a simply testing lambda to demonstrate the coding and serverless receipts etc.
2. GraphQL

   This is the Apollo GraphQL server deployed as Lambda.

3. Data Gateway API

   This is a API gateway (lambda) infront of the GraphQL lambda. In reality, the clients don't interact with the GraphQL directly, instead, they call the Data Gateway API by passing necessary parameters (for example query name, device type and whatever needed)

   More information of the GraphQL usage is below.

## Serverless

We use the serverless framework (<https://serverless.com/>) to manage the infrastrcutre at AWS, for example Lambda functions, API gateways, S3 buckets etc. See "serverless.yml" for details.

## Local Testing

We can leverage the serverless "offline" plugin to simulate the Lambda (and API) at local by "sls offline".

## Build and Deploy

For personal use, the serverless framework is enough. For example you can just do "sls deploy" to create the infrastructure provided you have the AWS credentials set up locally. For example, put the "aws_access_key" and "aws_secret_access_key" in the ~/.aws/credentils

In reality, we need to set up the infrastructure at our AWS account, and this is done through the AWS Code Pipeline. In short, there are two files that we use here:

* buildspec.yml

* deployspec.yml

And there is another repo where we have the cloudformation stuff to set the code pipeline at AWS,

## Setup Local Dev Environment

1. first install node.js at local <https://nodejs.org/en/download/>

2. then install the serverless framework <https://serverless.com/> and couple of plugins

```sh
npm install serverless -g
npm install -g serverless-offline --save-dev
npm install -g serverless-domain-manager --save-dev
```

4. run the echo API locally

```sh
export EnvDesc=dev
export AWS_REGION=us-east-1
sls offline
```

then

```
http://localhost:3000/v0/echo/hello
```

(the setting EnvDesc and AWS_REGION are not really necessary )

5. Known Issues

I have experienced permission problems when install node.js modules on my laptopm and used below commands to fix the problem

```sh
sudo chown -R $USER ~/.npm
sudo chown -R $USER /usr/lib/node_modules
sudo chown -R $USER /usr/local/bin
```

# Deploy to AWS

create stack [org]-node-app-pipeline-nonprod-stack
<https://s3.amazonaws.com/[org>]-infra-iac-nonprod-757332422324-us-east-1/v1/7-nodePipeline.yaml

# GraphQL

## Why GraphQL?

Actually ... why not?

Here is a good article that explains the problems and various solutions so far
[https://medium.com/@__xuorig__/where-we-come-from-an-honest-introduction-to-graphql-4a2ef6124488]

## What do we want to achieve with GraphQL (or what problems that we want to solve)

GraphQL does not solve all our problems, actually, it likely only solve the "easy" problems. However, introducing GraphQL into our architecture does give us an opportunity to re-think our data strategy and the relationsip between in-house engineering team and partners around the world.

1. We want to give our clients what they need, not what we have. Instead of giving them a huge load of data and ask them to "go-figure", we need to think from outside in: starting from products, rather beginginng from our own positions. If we do it right, we can collectively improve our turn around time and reduce overral cost.
2. In our case, there is another opportunity that we can explore. My team is uniquely positioned between the mobile dev teams and the backend engineering teams. By leveraging the declarable GraphQL schema and quries, my team can partner with service and front end teams, and mange some of the complesities due to business requirements on various platforms. Techincally this can be done with existing Restful API, but GraphQL play nicely into this vision.
3. Further, we also want to achieve certain level of operation freedom. our products are extremely complicated, and so are the systems behind the scene. During the products development, we constantly need to switch between different environments of the data source, for example, to test SCTE-35 trigger, it'd be easier to use the testing loop stream, however, for digital ads, it makes more sense to use the production stream. If we can leverage the GraphQL query variables, we can manage those testing environments must easier, without requiring service team to update their configuration and re-deploy the systems.

## the architecture

```sh
clients <------> Data Gateway <-----> GraphQL  <----->  data sources
                      |                  |
       |                  |
       |                  |
                    queries       schemas, resolvers

```

A simple user case is that we need to display a game title. On mobile apps, we may need to display tri-code like "TOR @ GSW", while on desktop, we can do longer names like "Toronto Raptors @ Golden State Warriors". In our schema, we have team tricode and team full names, and we can have two persisted quries in JSON files

* gameTile_mobile.json which list the "tricode" in the query
* gameTile_desktop.json, which include the "fullName"

the API endpoint could be /query?id=gameTime&device=mobile or /query?id=gameTime&device=desktop
The API will figure out the right query and send to GraphQL service and pass data back to clients.

### Quries

How do we want to manage GraphQL queries?

1. Stored out side of the GraphQL service, for example S3 bucket, managed by Github for source control.

2. follow certain name pattern or directory structure.

3. queries can be updated from time to time, without requiring API code change or re-deployment. And API can load the latest query. (for example S3 update may trigger the API to refresh queries?)

### GraphQL Service (or Server)

The GraphQL service will be straightforward. In this POC project, we are using the Apollo GraphQL package, and deploy it to AWS Lambda. It could be on ECS, but we choose Lambda for its simplicity.

The GraphQL service just load the schema and resolvers and serve.

### Schema

This one is interesting.

1. We would want to store the schema outside of the JS code as well if possible. I guess we really want to seperate the declarable code and JS code.

2. consider that we have different types of data sources, it'd make lots of sense to modulize the schemas. There have been several solutions, for example:
   * schema stiching <https://www.apollographql.com/docs/graphql-tools/schema-stitching/>
   * which is being replaced by federation <https://www.apollographql.com/docs/apollo-server/federation/introduction/>
   * and <https://blog.apollographql.com/modularizing-your-graphql-schema-code-d7f71d5ed5f2>

3. Typically we create Schema from existing Restufl API, and there are tools that can help to create schema from JSON data, which we can use as the initial version. For example <https://github.com/walmartlabs/json-to-simple-graphql-schema>

4. Most time our data sources can be existing API, and data feeds, we often also need to mix them with JSON data maintained by TPM team. Those TPM managed JSON data are specifically designed for use cases and platforms, thus we just need to return a chunk of JSON data. In these cases, we can leverage the GraphQL-JSON type, without listing each and every fields.

5. while designing the Schema, we'd leverage the argument, which can provide flexibity through query variables.

### Resolvers

Resolvers have the real code, and it is likely inevitablet that we put business logic code in them, but the less code the better.

### Data Sources

our data sources are existing APIs, or data feeds or TPM managed JSON files.

* data feeds and TPM data are usually long term valid (we are not doing score at least for now)

* Some of the APIs are entitlement driven, thus hard to cache.

We will have "services" for each data sources. Because of the "aggregation" style of GraphQL, we need to consider:

   1. Make sure to handle the failure of upstream gracefully. Most time, stale dat is better than bad data.

   2. Caching.

### Caching

Caching is a huge topic in any discussion of GraphQL, due to common impression that GraphQL is hard to cache. Here is an article that explains better

<https://blog.apollographql.com/graphql-caching-the-elephant-in-the-room-11a3df0c23ad>

Besides to implement cacheing correclly (there are on going efforts at various level to improve caching with GraphQL), it is also helpful for us to understand the expected user volume case by case. For example, we may be using GraphQL to power the "[org].com sign-in confirmation", which is only presented to users after they sign in [org].com, which likely don't have huge load.

## GraphQL services

Here are the list of POC graphql service:

### Post [org] Sign In Confirmation

Requirements:

Given user's entitlements, return to user two piece of information:

1. what type of subscription that user has?

2. based on what user try to watch, return the upsell options if user does not have the appropriate access.

3. And mobile apps may have different type of upsell options from connected devices.

So, the user request will have 3 types of input:

   1. user's entitlements

   2. the stream type that user intends to play

   3. device typles (ios vs android, or mobile vs connected)

And we will use two data sources:

1. Entitlement Normalizer which translate the incoming entitlements to more strctured products data, for example, multiple entitlements

2. upsell.json managed by my team, where upsell options are listed for each platforms, at <https://[domain>]/mobile/apps/configs/dev/sales_sheets/post[org]SignIn.json

Right now (07/01/2019), we have all the schemas in a single file "src/graphql/schema.graphql", before we implement the modulizing schemas.

First we define some enums for stream types and platforms

```sh
enum PlayStream{
    leaguepass
    [org]tv
    alternateGateway
}

enum UpSellPlatform{
  mobile
  connected
  roku
}
```

and we only need some data from the Entitlements Normalizer, specially the "products" array.

```sh
type Product {
    name: String
    qualifier: [String]
}

type SubscriptionsAndUpsell {
    # the list of subscriptions that user has purchased per entitlements
    products: [Product]!
    # the upsell of the specified 'stream type' (ie, leaguepass, [org]tv)
    upsell(playStream:PlayStream, platform:UpSellPlatform): JSON
}
```

Note we are using two arguments for the upsell - one is the stream to play, and the other is platform.

Note in above schema, we simply define the whole "upsell" as one single JSON piece, as our upsell JSON data is already highly customized for each platforms, thus all we need is to ask the chunk of JSON for the specified "platform" and "stream".

And here is the Query type

```sh
type Query{
       postSignInScreen(normalizerUrl:String, preAuthorizedEntitlements:String,upsellUrl:String):SubscriptionsAndUpsell
}
```

Note in above query type, we even pass the URL to the source data (entitlement normalizer and upsell JSON). This is for the benefit of flexibility, for example if we want to use a different environments of normalizer, or different version of upsell JSON, we can just change the URL in the query. With this approach, we will then need to design the "service" to still leverage caching.

The resolver(s) are in the src/graphql/resolver.js - something like this (really un-sophisticated version)

```sh
module.exports = {
    JSON: GraphQLJSON,

    Query: {
        postSignInScreen: async (parent, args) => {
            //passed preAuthorizedEntitlements is actually a Stringified version
            var preAuthorizedEntitlements = JSON.parse(args.preAuthorizedEntitlements);
            var normalizerUrl = args.normalizerUrl;
            const upsellUrl = args.upsellUrl;

            const plist = await mssUtils.PROMISE_UTILS.execAll([entitlementsService.normalizerCall(normalizerUrl, preAuthorizedEntitlements),
            tpm.upsellCall(upsellUrl)]);
            
            var accessProducts = JSON.parse(plist[0].result).products;
        
            return {
                "products": accessProducts,
                "upsellOptions": JSON.parse(plist[1].result)
            };

        }
 },

 SubscriptionsAndUpsell: {
        
        upsell: (parent, args, context, info) => {
            
     for (var product of parent.products) {
            
            if (product.name == args.platform) {
                console.log("user has access to the "+ args.platform+" no need to upsell");
                return null;
            }
        };
        console.log("user does not have access to stream type "+ args.platform+" now look up upsell info of "+ args.playStream+ " on platform " + args.platform);
        
       return allUpsellOptions[args.playStream][args.platform];
    
          
        }
    }


```

### Sales Sheet

### [org] TV Aggregator
