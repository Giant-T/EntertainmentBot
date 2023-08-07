import { DataSource } from 'typeorm';
import Consumed from './entities/consumed.js';
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import Review from './entities/review.js';

dotenv.config();

const { HOST, PORT, DB_USERNAME, DB_PASSWORD, DATABASE } = process.env;

const BotDataSource = new DataSource({
  type: 'mongodb',
  host: HOST,
  port: +PORT,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DATABASE,
  synchronize: true,
  entities: [Consumed, Review],
});

export default BotDataSource;
