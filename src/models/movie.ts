import { faker } from '@faker-js/faker';

export default interface Movie {
  title: string;
  description: string;
  releaseDate: Date;
}

export function randomMovie(): Movie {
  return {
    title: faker.word.words({ count: { min: 1, max: 6 } }),
    description: faker.lorem.paragraph(),
    releaseDate: faker.date.past(),
  };
}
