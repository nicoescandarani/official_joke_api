const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, './jokes/index.json');

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  let jokes = JSON.parse(data);

  jokes = jokes.map((joke, index) => ({
    ...joke,
    id: index + 1
  }));

  const updatedData = JSON.stringify(jokes, null, 2);

  fs.writeFile(filePath, updatedData, 'utf8', err => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('IDs added successfully to all items in index.json');
  });
});
