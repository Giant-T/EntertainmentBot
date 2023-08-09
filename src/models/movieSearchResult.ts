import Movie from './movie.js';

export default class MovieSearchResult {
  page: number;
  total_pages: number;
  total_results: number;
  results: Movie[];

  constructor(result: any) {
    this.page = result.page;
    this.total_pages = result.total_pages;
    this.total_results = result.total_results;
    this.results = result.results.map((e) => new Movie(e));
  }
}
