import { Moment } from 'moment';

type TwitchToken = {
  access_token: string;
  expires_in: number;
  start_time: Moment;
};
export default TwitchToken;
