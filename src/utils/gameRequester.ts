import axios from 'axios';
import TwitchToken from '../types/twitchToken';
import * as dotenv from 'dotenv';
import moment from 'moment';

dotenv.config();

const { GAME_CLIENT_SECRET, GAME_CLIENT_ID } = process.env;

let token: TwitchToken;

async function getTwitchToken(): Promise<TwitchToken> {
  const response = await axios.post<any, TwitchToken>(
    `https://id.twitch.tv/oauth2/token?client_id=${GAME_CLIENT_ID}&client_secret=${GAME_CLIENT_SECRET}&grant_type=client_credentials`
  );

  response.start_time = moment();

  return response;
}

const GameRequester = axios.create({
  baseURL: 'https://api.igdb.com/v4/',
  headers: {
    'Client-ID': GAME_CLIENT_ID,
  },
});

GameRequester.interceptors.request.use(async (config) => {
  if (
    token === undefined ||
    token.start_time.add(token.expires_in, 'seconds').isBefore(moment())
  ) {
    token = await getTwitchToken();
  }

  config.headers.Authorization = `Bearer ${token.access_token}`;
  return config;
});

export default GameRequester;
