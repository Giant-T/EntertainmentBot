import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn, Unique } from 'typeorm';

@Entity({ name: 'consumed' })
@Unique(['consumed_id', 'user_id', 'type'])
export default class Consumed {
  @ObjectIdColumn()
  readonly id: ObjectId;

  @Column()
  title: string;
  @Column({ type: 'int' })
  consumed_id: number;

  @Column()
  user_id: string;

  @Column()
  type: 'movie' | 'game';
}
