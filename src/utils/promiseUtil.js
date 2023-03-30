module.exports = {

  execAll: function(promiseList) {
    var wrappedList = promiseList.map((p) => {
      return p
        .then(
          (result) => {
            return { status: true, result: result };
          },
          (err) => {
            return { status: false, result: err };
          })
        .catch (
          (err) => {
            return { status: false, result: err };
          }
        )

      })
    return Promise.all(wrappedList)
  },
  sleep: function(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }
};