const fs = require('fs');
const path = require('path');
const jokes = require('./jokes/index.json');

let lastJokeId = 0;

const initializeLastJokeId = () => {
  jokes.forEach(jk => {
    if (jk.id > lastJokeId) {
      lastJokeId = jk.id;
    }
  });
};

const getLastJokeId = () => lastJokeId;

const updateLastJokeId = () => {
  lastJokeId++;
};

const randomJoke = () => {
  return jokes[Math.floor(Math.random() * jokes.length)];
};

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

  return Array.from(randomIndicesSet).map(randomIndex => jokeArray[randomIndex]);
};

const randomSelect = (number) => randomN(jokes, number);

const jokeByType = (type, n) => {
  return randomN(jokes.filter(joke => joke.type === type), n);
};

/** 
 * @param {Number} id - joke id
 * @returns a single joke object or undefined
 */
const jokeById = (id) => (jokes.filter(jk => jk.id === id)[0]);

/**
 * Added.
 * @param {*} jokes 
 * @param {*} order
 */
const sortByLikes = (jokes, order = 'asc') => {
  return jokes.sort((a, b) => {
    const likesA = a.likes === null || a.likes === undefined ? -1 : a.likes;
    const likesB = b.likes === null || b.likes === undefined ? -1 : b.likes;
    if (order === 'asc') {
      return likesA - likesB;
    } else {
      return likesB - likesA;
    }
  });
};

/**
 * Added.
 * @param {*} data 
 * @param {*} page 
 * @param {*} limit 
 * @param {*} sort
 */
const paginateAndSort = (data, page = 1, limit = 10, sort = '') => {
  if (sort === 'asc') {
    data = data.sort((a, b) => a.id - b.id);
  } else if (sort === 'desc') {
    data = data.sort((a, b) => b.id - a.id);
  }

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

const saveJokes = () => {
  fs.writeFileSync(path.resolve(__dirname, './jokes/index.json'), JSON.stringify(jokes, null, 2), 'utf-8');
};

module.exports = { jokes, randomJoke, randomN, randomSelect, jokeById, jokeByType, sortByLikes, paginateAndSort, initializeLastJokeId, updateLastJokeId, getLastJokeId, saveJokes };
