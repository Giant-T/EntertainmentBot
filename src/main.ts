import {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from 'discord.js';
import * as dotenv from 'dotenv';
import Commands from './commands/index.js';
import Command from './models/command.js';

import BotDataSource from './dataSource.js';

async function main(): Promise<void> {
  dotenv.config();

  const { DISCORD_TOKEN, CLIENT_ID } = process.env;

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
    ],
  });

  client.once(Events.ClientReady, (c) => {
    console.log(`Prêt! 🟢 Connecté en tant que ${c.user.tag} 🤖`);
  });

  const commands = new Map<string, Command>();
  const slashCommands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

  // Ajoute toutes les commandes contenues
  // dans le dossier commands à la liste de commandes
  for (const field in Commands) {
    const command: Command = Commands[field] as Command;
    commands.set(command.data.name, command);
    slashCommands.push(command.data.toJSON());
  }

  const rest = new REST().setToken(DISCORD_TOKEN);

  try {
    console.log(
      `Début du rafraichissement de ${slashCommands.length} commandes (/).`
    );

    const data: any[] = (await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: slashCommands,
    })) as any[];

    console.log(`Rechargement réussi de ${data.length} commandes (/).`);
  } catch (error) {
    console.error(error);
  }

  // Est lancé lorsqu'un utilisateur lance une commande
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // Recherche de la commande selon son nom dans la liste.
    const command = commands.get(interaction.commandName);

    // Envoie une erreur si la commande n'existe pas.
    if (!command) {
      console.error(
        `Aucune commande correspondant à ${interaction.commandName} n'a été trouvée.`
      );
      return;
    }

    // Execute la commande
    await command.execute(interaction).catch((err) => {
      console.error(err);
    });
  });

  client.login(DISCORD_TOKEN);
}

BotDataSource.initialize().then(async () => {
  main();
});
