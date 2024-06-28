const express = require('express');
const LimitingMiddleware = require('limiting-middleware');
/**
 * Added.
 */
const { jokes, randomJoke, randomTen, randomSelect, jokeByType, jokeById } = require('./handler');

const app = express();

app.use(new LimitingMiddleware().limitByIp());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

/**
 * Added.
 * Returns a paginated array of all jokes.
 */
app.get('/jokes/all', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort; // 'asc', 'desc', or not present.

  let sortedJokes = jokes;

  // Apply sorting if specified.
  if (sort === 'asc') {
    sortedJokes = jokes.sort((a, b) => a.id - b.id);
  } else if (sort === 'desc') {
    sortedJokes = jokes.sort((a, b) => b.id - a.id);
  }

  const offset = (page - 1) * limit;
  const paginatedJokes = sortedJokes.slice(offset, offset + limit);

  res.json({
    currentPage: page,
    perPage: limit,
    totalItems: jokes.length,
    totalPages: Math.ceil(jokes.length / limit),
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
  const sort = req.query.sort; // 'asc' o 'desc'

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

/**
 * Added.
 * @returns a single joke object or undefined.
 */
app.post('/jokes', (req, res) => {
  const { type, setup, punchline } = req.body;

  // Verifica que todos los campos estén presentes
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

/**
 * Added.
 * @returns a single joke object or undefined.
 */
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

/**
 * Added.
 * @returns a single joke object or undefined.
 */
app.delete('/jokes/:id', (req, res) => {
  const { id } = req.params;
  const index = jokes.findIndex(j => j.id === parseInt(id));
  if (index === -1) {
    return res.status(404).json({ message: "Joke not found" });
  }

  jokes.splice(index, 1);
  res.status(204).send();
});

/**
 * Added.
 * @returns a single joke object or undefined.
 */
app.delete('/jokes', (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ message: "IDs must be provided in an array" });
  }

  // Filters and verifies if all IDs exist.
  const jokesToDelete = jokes.filter(joke => ids.includes(joke.id));
  if (jokesToDelete.length !== ids.length) {
    return res.status(404).json({ message: "One or more jokes not found with the provided IDs" });
  }

  // Proceed to delete the jokes.
  jokes = jokes.filter(joke => !ids.includes(joke.id));
  res.status(204).send();
});

/**
 * Added.
 */
app.use(express.json());

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    type: 'error', message: err.message
  });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
