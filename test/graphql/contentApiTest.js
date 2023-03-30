const {describe} = require('mocha');

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
// Then either:
var expect = chai.expect;
// or:
var assert = chai.assert;
// or:
chai.should();
/*
const ContentApi = require('../../src/graphql/dataSources/ContentApi.js');
describe('graphql data sources content API', function(){
    describe('get collection', function(){
        it('should get the collection 309aa29d-5565-42aa-a975-db039bcbb16b', function(){
            var apiClient = new ContentApi();
            apiClient.initialize();
            //return apiClient.getCollection("309aa29d-5565-42aa-a975-db039bcbb16b").should.eventually.be.not.null;
        })
       
    })
    
});
*/