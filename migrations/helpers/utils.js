const { logTransaction } = require("./logger.js");

const BigNumber = require("bignumber.js");

function toBN(number) {
  return new BigNumber(number);
}

module.exports = {
  toBN,
};
