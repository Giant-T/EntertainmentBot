import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const { MOVIE_TOKEN } = process.env;

// Requeteur de film pour évité la répétion de code.
const MovieRequester = axios.create({
  baseURL: 'https://api.themoviedb.org/3/',
  headers: {
    Authorization: `Bearer ${MOVIE_TOKEN}`,
  },
});

export default MovieRequester;
