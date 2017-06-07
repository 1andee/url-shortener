function randomizer() {
  randomString = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const stringLength = 6;

  function pickRandom() {
      return possible[Math.floor(Math.random() * possible.length)];
  }

  return randomString = Array.apply(null, Array(stringLength)).map(pickRandom).join('');
}

module.exports = randomizer;
