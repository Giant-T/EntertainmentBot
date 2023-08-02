import Movie from './movie.js';

export default class DetailedMovie extends Movie {
  genres: MovieGenre[];

  constructor(movie: any) {
    super(movie);

    this.genres = movie.genres;
  }
}

interface MovieGenre {
  name: string;
}
