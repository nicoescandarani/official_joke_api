const express = require('express');
const LimitingMiddleware = require('limiting-middleware');
const cors = require('cors');

const { jokes, randomJoke, randomTen, randomSelect, jokeByType, jokeById, sortByLikes, paginateAndSort } = require('./handler');

const app = express();

app.use(cors());

app.use(new LimitingMiddleware().limitByIp());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

app.use(express.json());

/**
 * Added.
 * Returns a paginated array of jokes, optionally filtered by searchText.
 */
app.get('/jokes', (req, res) => {
  const { searchText = '', page = 1, limit = 10, sort = '' } = req.query;
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const offset = (pageInt - 1) * limitInt;

  let filteredJokes = jokes.slice();

  if (searchText) {
    filteredJokes = filteredJokes.filter(joke =>
      joke.setup.toLowerCase().includes(searchText.toLowerCase()) ||
      joke.punchline.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  if (sort === 'id_asc' || sort === 'id_desc') {
    filteredJokes = filteredJokes.sort((a, b) => a.id - b.id);
    if (sort === 'id_desc') {
      filteredJokes.reverse();
    }
  } else if (sort && sort.startsWith('likes')) {
    const order = sort.split('_')[1]; // 'asc' or 'desc'
    filteredJokes = sortByLikes(filteredJokes, order);
  }

  const paginatedJokes = filteredJokes.slice(offset, offset + limitInt);

  res.json({
    currentPage: pageInt,
    perPage: limitInt,
    totalItems: filteredJokes.length,
    totalPages: Math.ceil(filteredJokes.length / limitInt),
    data: paginatedJokes
  });
});

app.get('/', (req, res) => {
  res.send('Try /random_joke, /random_ten, /jokes/random, or /jokes/ten');
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.get('/random_joke', (req, res) => {
  const joke = randomJoke();
  res.json({
    currentPage: 1,
    perPage: 1,
    totalItems: 1,
    totalPages: 1,
    data: [joke] // Encapsulated in an array to maintain consistency.
  });
});

app.get('/random_ten', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort; // 'id_asc' or 'id_desc'

  const result = paginateAndSort(jokes, page, limit, sort);
  res.json(result);
});

app.get('/jokes/random', (req, res) => {
  const joke = randomJoke();
  res.json({
    currentPage: 1,
    perPage: 1,
    totalItems: 1,
    totalPages: 1,
    data: [joke] // Encapsulated in an array to maintain consistency.
  });
});

// TODO: Needs fixing
app.get("/jokes/random(/*)?", (req, res) => {
  let num;

  try {
    num = parseInt(req.path.substring(14, req.path.length));
  } catch (err) {
    res.send("The passed path is not a number.");
  } finally {
    const count = Object.keys(jokes).length;

    if (num > Object.keys(jokes).length) {
      res.send(`The passed path exceeds the number of jokes (${count}).`);
    } else {
      res.json(randomSelect(num));
    }
  }
});

app.get('/jokes/ten', (req, res) => {
  const jokes = randomTen();
  res.json({
    currentPage: 1,
    perPage: 10,
    totalItems: jokes.length,
    totalPages: 1,
    data: jokes
  });
});

app.get('/jokes/:type/random', (req, res) => {
  const type = req.params.type;
  const filteredJokes = jokes.filter(j => j.type === type);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort;

  const result = paginateAndSort(filteredJokes, page, limit, sort);
  res.json(result);
});

app.get('/jokes/:type/ten', (req, res) => {
  const type = req.params.type;
  const jokesByType = jokeByType(type, 10);
  res.json({
    currentPage: 1,
    perPage: 10,
    totalItems: jokesByType.length,
    totalPages: 1,
    data: jokesByType
  });
});

app.get('/jokes/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const joke = jokeById(+id);
    if (!joke) return next({ statusCode: 404, message: 'joke not found' });
    return res.json(joke);
  } catch (e) {
    return next(e);
  }
});

app.post('/jokes', (req, res) => {
  const { type, setup, punchline } = req.body;

  if (!type) {
    return res.status(400).json({ message: "Type is required" });
  }
  if (!setup) {
    return res.status(400).json({ message: "Setup is required" });
  }
  if (!punchline) {
    return res.status(400).json({ message: "Punchline is required" });
  }

  const newJoke = { id: ++lastJokeId, type, setup, punchline };
  jokes.push(newJoke);
  res.status(201).json(newJoke);
});

app.put('/jokes/:id', (req, res) => {
  const { id } = req.params;
  const { type, setup, punchline } = req.body;
  const joke = jokes.find(j => j.id === parseInt(id));
  if (!joke) {
    return res.status(404).json({ message: "Joke not found" });
  }

  joke.type = type || joke.type;
  joke.setup = setup || joke.setup;
  joke.punchline = punchline || joke.punchline;

  res.json(joke);
});

app.post('/jokes/:id/like', (req, res) => {
  const { id } = req.params;
  const joke = jokes.find(j => j.id === parseInt(id));

  if (!joke) {
    return res.status(404).json({ message: "Joke not found" });
  }

  if (joke.likes === null || joke.likes === undefined) {
    joke.likes = 1;
  } else {
    joke.likes += 1;
  }

  res.json(joke);
});

app.post('/jokes/:id/dislike', (req, res) => {
  const { id } = req.params;
  const joke = jokes.find(j => j.id === parseInt(id));

  if (!joke) {
    return res.status(404).json({ message: "Joke not found" });
  }

  if (joke.likes === null || joke.likes === undefined) {
    joke.likes = -1;
  } else {
    joke.likes -= 1;
  }

  res.json(joke);
});

app.delete('/jokes/:id', (req, res) => {
  const { id } = req.params;
  const index = jokes.findIndex(j => j.id === parseInt(id));
  if (index === -1) {
    return res.status(404).json({ message: "Joke not found" });
  }

  jokes.splice(index, 1);
  res.status(204).send();
});

app.delete('/jokes', (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ message: "IDs must be provided in an array" });
  }

  const jokesToDelete = jokes.filter(joke => ids.includes(joke.id));
  if (jokesToDelete.length !== ids.length) {
    return res.status(404).json({ message: "One or more jokes not found with the provided IDs" });
  }

  jokes = jokes.filter(joke => !ids.includes(joke.id));
  res.status(204).send();
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    type: 'error', message: err.message
  });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
