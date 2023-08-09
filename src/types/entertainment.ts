import DetailedMovie from '../models/detailedMovie.js';
import Game from '../models/game.js';
import Movie from '../models/movie.js';
import truncate from '../utils/truncate.js';
import EntertainmentType from './entertainmentType.js';

export default class Entertainment {
  id: number;
  title: string;
  private _overview: string;
  release_date: Date;
  image_path: string;
  type: EntertainmentType;
  genres?: string[];

  constructor(game: Game);
  constructor(movie: Movie | DetailedMovie);
  constructor(item: Game | Movie | DetailedMovie) {
    this.id = item.id;

    if (item instanceof Game) {
      this.title = item.name;
      this._overview = item.summary;
      this.release_date = item.first_release_date;
      this.image_path = item.cover;
      this.type = EntertainmentType.VideoGame;
      this.genres = item.genres;
    } else {
      this.title = item.title;
      this._overview = item.overview;
      this.release_date = new Date(item.release_date);
      this.image_path = item.poster_path;
      this.type = EntertainmentType.Movie;
      this.genres = item instanceof DetailedMovie ? item.genres : null;
    }
  }

  public get formatted_genres() {
    return this.genres.join(', ');
  }

  public get full_image_path(): string {
    return `https://image.tmdb.org/t/p/original/${this.image_path}`;
  }

  public get overview(): string {
    return this._overview.length < 1 ? 'Aucune description.' : this._overview;
  }

  public get formatted_title(): string {
    return truncate(this.title, 45);
  }

  public get formatted_overview(): string {
    if (this.overview === '') {
      return 'Aucune description.';
    }

    return truncate(this.overview, 1024);
  }
}
