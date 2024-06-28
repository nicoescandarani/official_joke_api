const jokes = require('./jokes/index.json');

let lastJokeId = 0;
jokes.forEach(jk => jk.id = ++lastJokeId);

const randomJoke = () => {
  return jokes[Math.floor(Math.random() * jokes.length)];
}

/**
 * Get N random jokes from a jokeArray
 */
const randomN = (jokeArray, n) => {
  const limit = jokeArray.length < n ? jokeArray.length : n;
  const randomIndicesSet = new Set();

  while (randomIndicesSet.size < limit) {
    const randomIndex = Math.floor(Math.random() * jokeArray.length);
    if (!randomIndicesSet.has(randomIndex)) {
      randomIndicesSet.add(randomIndex);
    }
  }

  return Array.from(randomIndicesSet).map(randomIndex => {
    return jokeArray[randomIndex];
  });
};

const randomTen = () => randomN(jokes, 10);

const randomSelect = (number) => randomN(jokes, number);

const jokeByType = (type, n) => {
  return randomN(jokes.filter(joke => joke.type === type), n);
};

/** 
 * @param {Number} id - joke id
 * @returns a single joke object or undefined
 */
const jokeById = (id) => (jokes.filter(jk => jk.id === id)[0]);

module.exports = { jokes, randomJoke, randomN, randomTen, randomSelect, jokeById, jokeByType };

/**
 * Added.
 * @param {*} data 
 * @param {*} page 
 * @param {*} limit 
 * @param {*} sort 
 * @returns 
 */
const paginateAndSort = (data, page = 1, limit = 10, sort = '') => {
  // Aplicar la ordenación si es especificada
  if (sort === 'asc') {
    data = data.sort((a, b) => a.id - b.id);
  } else if (sort === 'desc') {
    data = data.sort((a, b) => b.id - a.id);
  }

  // Calcular la paginación
  const offset = (page - 1) * limit;
  const paginatedData = data.slice(offset, offset + limit);

  return {
    currentPage: page,
    perPage: limit,
    totalItems: data.length,
    totalPages: Math.ceil(data.length / limit),
    data: paginatedData
  };
};