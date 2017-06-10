// Checks if the user-defined link includes a valid protocol
// Links without a valid protocol are modified to use HTTP and returned
// Regex form of if statement: url.startsWith(/http(s)?:\/\//)

function protocolChecker(url) {
  if (((url.substring(0,7)) === 'http://')
    || ((url.substring(0,8)) === 'https://')) {
    return url;
  } else {
    let correctedURL = (`http://${url}`);
    return correctedURL;
  }
};

module.exports = protocolChecker;
