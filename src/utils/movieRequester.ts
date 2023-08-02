import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const { MOVIE_TOKEN } = process.env;

const MovieRequester = axios.create({
  baseURL: 'https://api.themoviedb.org/3/',
  headers: {
    Authorization: `Bearer ${MOVIE_TOKEN}`,
  },
});

export default MovieRequester;
