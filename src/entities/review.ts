import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn, Unique } from 'typeorm';
import truncate from '../utils/truncate.js';

@Entity({ name: 'review' })
@Unique('unique_review', ['item_id', 'user_id', 'type'])
export default class Review {
  @ObjectIdColumn()
  readonly id: ObjectId;

  @Column()
  title: string;
  @Column('int')
  item_id: number;
  @Column()
  genres: string[];

  @Column('int')
  rating?: number;
  @Column()
  review?: string;

  @Column()
  user_id: string;

  @Column()
  type: 'movie' | 'game';

  public get formatted_review(): string {
    return truncate(this.review, 1024);
  }

  public get formatted_genres(): string {
    return this.genres.join(', ');
  }
}
