function getMultipleRandom(arr, num) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());

  return shuffled.slice(0, num);
}

function ucFirst(str) {
  if (!str) return str;

  return str[0].toUpperCase() + str.slice(1);
}

const uniqueArray = (array) => {
  const onlyUniqueArray = (value, index, self) => {
    return self.indexOf(value) === index;
  };
  return array.filter(onlyUniqueArray);
};

module.exports = {
  uniqueArray,
  getMultipleRandom,
  ucFirst,
};
