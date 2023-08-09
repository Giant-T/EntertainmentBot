import axios from 'axios';
import TwitchToken from '../types/twitchToken.js';
import * as dotenv from 'dotenv';
import moment from 'moment';
import Requester from './requester.js';

dotenv.config();

const { GAME_CLIENT_SECRET, GAME_CLIENT_ID } = process.env;

class GameRequester extends Requester {
  private static instance: GameRequester;
  private token: TwitchToken;

  private constructor() {
    const axiosInstance = axios.create({
      baseURL: 'https://api.igdb.com/v4/',
      headers: {
        'Client-ID': GAME_CLIENT_ID,
      },
    });

    axiosInstance.interceptors.request.use(async (config) => {
      if (
        this.token === undefined ||
        this.token.start_time
          .add(this.token.expires_in, 'seconds')
          .isBefore(moment())
      ) {
        this.token = await GameRequester.GetTwitchToken();
      }

      config.headers.Authorization = `Bearer ${this.token.access_token}`;

      console.log('REQUEST: ', JSON.stringify(config));
      return config;
    });

    super(axiosInstance);
  }

  static getInstance(): GameRequester {
    if (!GameRequester.instance) {
      GameRequester.instance = new GameRequester();
    }

    return GameRequester.instance;
  }

  private static async GetTwitchToken(): Promise<TwitchToken> {
    const response = await axios.post<any, TwitchToken>(
      `https://id.twitch.tv/oauth2/token?client_id=${GAME_CLIENT_ID}&client_secret=${GAME_CLIENT_SECRET}&grant_type=client_credentials`
    );

    response.start_time = moment();

    return response;
  }

  async search(query: string): Promise<any> {
    return await this.axios.post(
      'games',
      `search "${query}"; fields id, genres, first_release_date, cover, name, summary;`
    );
  }

  public async getById(id: number): Promise<any> {
    return await this.axios.post(
      'games',
      `fields id, genres, first_release_date, cover, name, summary; where id = ${id};`
    );
  }
}

export default GameRequester;
