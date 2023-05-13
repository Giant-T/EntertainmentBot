import * as dotenv from 'dotenv';

async function main(): Promise<void> {
  console.log('Démarrage en cours...');
  dotenv.config();

  console.log(process.env.TOKEN);

  console.log('Fin du programme.');
}

main();
