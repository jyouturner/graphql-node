var AWS = require('aws-sdk');

module.exports = {

  /* params = {Bucket: bucket, Key: file}; */
  loads3File: function(params) {
      var s3 = new AWS.S3();
      return new Promise(function(resolve, reject) {
          s3.getObject(params, function(err, data) {
              if (err)
              {
                  if (err.statusCode == 404) {
                      resolve('');
                  }
                  else {
                      console.log(err);
                      reject(err);
                  }
              }
              else
              {
                  resolve(JSON.parse(data.Body.toString()));
              }
          })
      });
  }
};