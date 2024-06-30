const fs = require('fs');
const path = require('path');

// Ruta al archivo index.json
const filePath = path.resolve(__dirname, './jokes/index.json');

// Leer el archivo index.json
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Parsear el contenido del archivo a un objeto JSON
  let jokes = JSON.parse(data);

  // Agregar IDs a cada elemento
  jokes = jokes.map((joke, index) => ({
    ...joke,
    id: index + 1 // Los IDs empiezan desde 1
  }));

  // Convertir el objeto JSON de vuelta a una cadena
  const updatedData = JSON.stringify(jokes, null, 2);

  // Escribir los datos actualizados de vuelta en el archivo index.json
  fs.writeFile(filePath, updatedData, 'utf8', err => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('IDs added successfully to all items in index.json');
  });
});
