module.exports = {
  awsRegion: null,
  envDesc: null,

  // Used to override Region and Env for testing
  setAwsRegion: function(s) { this.awsRegion = s;},
  setEnvDesc: function(s) { this.envDesc = s;},

  getAwsRegion: function() {
    if (this.awsRegion) { return this.awsRegion }
    else if (process.env.AWS_REGION) { return process.env.AWS_REGION }
    else return "us-east-1"
  },

  getEnvDesc: function() {
    if (this.envDesc) { return this.envDesc }
    else if (process.env.EnvDesc) { return process.env.EnvDesc }
    else return "int"
  },

  pathSd: '/10s/prod/v1',
  hostSd: 'http://data.nba.net',
};