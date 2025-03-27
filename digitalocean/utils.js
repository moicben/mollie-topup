async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getGiftCardCombination(amount, values) {
  let result = [];

  for (let i = values.length - 1; i >= 0; i--) {
    while (amount >= values[i]) {
      result.push(values[i]);
      amount -= values[i];
    }
  }
  return result;
}

module.exports = { delay, getGiftCardCombination };