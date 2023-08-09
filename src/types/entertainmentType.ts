import GameRequester from '../utils/gameRequester.js';
import MovieRequester from '../utils/movieRequester.js';
import Requester from '../utils/requester.js';

enum EntertainmentType {
  Movie = 'movie',
  VideoGame = 'video_game',
}

export default EntertainmentType;

export function entertainmentTypePlural(type: EntertainmentType): string {
  switch (type) {
    case EntertainmentType.Movie:
      return 'films';
    case EntertainmentType.VideoGame:
      return 'jeux';
  }
}

export function getRequester(type: EntertainmentType): Requester {
  switch (type) {
    case EntertainmentType.Movie:
      return MovieRequester.getInstance();
    case EntertainmentType.VideoGame:
      return GameRequester.getInstance();
  }
}
