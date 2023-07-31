import { faker } from '@faker-js/faker';

export default interface Movie {
  title: string;
  overview: string;
  release_date: Date;
  vote_average: number;
}

export function randomMovie(): Movie {
  return {
    title: faker.word.words({ count: { min: 1, max: 6 } }),
    overview: faker.lorem.paragraph(),
    release_date: faker.date.past(),
    vote_average: faker.number.float({ min: 70, max: 100 }),
  };
}
