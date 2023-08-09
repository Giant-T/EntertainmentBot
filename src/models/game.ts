import moment from 'moment';

export default class Game {
  id: number;
  genres: string[];
  first_release_date: Date;
  name: string;
  cover: string;
  summary: string;

  constructor(game: any) {
    this.id = game.id;
    this.genres = game.genres?.map((x) => x.name) ?? [];
    this.first_release_date = moment.unix(game.first_release_date).toDate();
    this.name = game.name;
    this.cover = game.cover?.image_id ?? '';
    this.summary = game.summary;
  }
}
