import Movie from './movie.js';

export default class DetailedMovie extends Movie {
  genres: string[];

  constructor(movie: any) {
    super(movie);

    this.genres = movie.genres.map((x) => x.name);
  }

  public get formatted_genres() {
    return this.genres.join(', ');
  }
}
