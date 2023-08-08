import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn, Unique } from 'typeorm';

@Entity({ name: 'consumed' })
@Unique(['item_id', 'user_id', 'type'])
export default class Consumed {
  @ObjectIdColumn()
  readonly id: ObjectId;

  @Column()
  title: string;
  @Column('int')
  item_id: number;

  @Column()
  user_id: string;

  @Column()
  scheduled_date?: Date;

  @Column()
  type: 'movie' | 'game';
}
