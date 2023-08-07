import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn, Unique } from 'typeorm';

@Entity({ name: 'review' })
@Unique(['item_id', 'user_id', 'type'])
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
  rating: number;
  @Column()
  review: string;

  @Column()
  user_id: string;

  @Column()
  type: 'movie' | 'game';
}
