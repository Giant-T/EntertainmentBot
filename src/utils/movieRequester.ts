import axios from 'axios';
import * as dotenv from 'dotenv';
import Requester from './requester.js';
import Entertainment from '../models/entertainment.js';
import DetailedMovie from '../models/detailedMovie.js';
import Movie from '../models/movie.js';

dotenv.config();

const { MOVIE_TOKEN } = process.env;

class MovieRequester extends Requester {
  private static instance: MovieRequester;

  private constructor() {
    const axiosInstance = axios.create({
      baseURL: 'https://api.themoviedb.org/3/',
      headers: {
        Authorization: `Bearer ${MOVIE_TOKEN}`,
      },
    });

    axiosInstance.interceptors.request.use((config) => {
      console.log('REQUEST: ', JSON.stringify(config));
      return config;
    });

    super(axiosInstance);
  }

  /**
   * Retourne la valeur de l'instance actuelle du singleton
   * @returns L'instance du singleton
   */
  static getInstance(): MovieRequester {
    if (!MovieRequester.instance) {
      MovieRequester.instance = new MovieRequester();
    }

    return MovieRequester.instance;
  }

  async search(query: string): Promise<Entertainment[]> {
    const { results } = (
      await this.axios.get(`search/movie?query=${query}&language=fr-CAN`)
    ).data;

    return results.map((x: Movie) => new Entertainment(x));
  }

  public async getById(id: number): Promise<Entertainment> {
    const result = new DetailedMovie(
      (await this.axios.get(`movie/${id}?language=fr-CAN`)).data
    );

    return new Entertainment(result);
  }
}

export default MovieRequester;
