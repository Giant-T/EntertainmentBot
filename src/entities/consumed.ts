import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'consumed' })
export default class Consumed {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  user_id: number;

  @Column()
  user_name: string;
}
