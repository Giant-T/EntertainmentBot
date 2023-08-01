export default class Movie {
  id: number;
  title: string;
  overview: string;
  release_date: Date;
  vote_average: number;
  poster_path: string;

  constructor(movie: any) {
    this.id = movie.id;
    this.title = movie.title;
    this.overview = movie.overview;
    this.release_date = movie.release_date;
    this.vote_average = movie.vote_average;
    this.poster_path = movie.poster_path;
  }

  public get full_poster_path(): string {
    return `https://image.tmdb.org/t/p/original/${this.poster_path}`;
  }
}
