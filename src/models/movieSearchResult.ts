import Movie from './movie.js';

export default interface MovieSearchResult {
  page: number;
  total_pages: number;
  total_results: number;
  results: Movie[];
}
