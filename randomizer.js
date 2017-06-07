function randomizer() {
  let randomString = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let stringLength = 6;

  function pickRandom() {
      return possible[Math.floor(Math.random() * possible.length)];
  }

  return randomString = Array.apply(null, Array(stringLength)).map(pickRandom).join('');
}

module.exports = randomizer;
