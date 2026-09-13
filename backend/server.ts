import { crearApp } from "./src/app.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = crearApp();

app.listen(PORT, () => {
  console.log(`API de reservas de pádel escuchando en http://localhost:${PORT}`);
});
