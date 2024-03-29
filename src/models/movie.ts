import truncate from '../utils/truncate.js';

export default class Movie {
  id: number;
  title: string;
  private _overview: string;
  release_date: Date;
  vote_average: number;
  poster_path: string;

  constructor(movie: any) {
    this.id = movie.id;
    this.title = movie.title;
    this._overview = movie.overview;
    this.release_date = new Date(movie.release_date);
    this.vote_average = movie.vote_average;
    this.poster_path = movie.poster_path;
  }

  public get full_poster_path(): string {
    return `https://image.tmdb.org/t/p/original/${this.poster_path}`;
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
