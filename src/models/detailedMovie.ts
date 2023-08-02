import Movie from './movie.js';

export default class DetailedMovie extends Movie {
  genres: MovieGenre[];

  constructor(movie: any) {
    super(movie);

    this.genres = movie.genres;
  }

  public get formatted_genres() {
    return this.genres.map((x) => x.name).join(', ');
  }
}

interface MovieGenre {
  name: string;
}
