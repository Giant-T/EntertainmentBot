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

async function main(): Promise<void> {
  dotenv.config();
  console.log('Démarrage en cours...');

  const token = process.env.TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, (c) => {
    console.log(`Prêt! Connecté en tant que ${c.user.tag}`);
  });

  const commands = new Map<string, Command>();
  const slashCommands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

  for (const field in Commands) {
    const command: Command = Commands[field] as Command;
    commands.set(command.data.name, command);
    slashCommands.push(command.data.toJSON());
  }

  const rest = new REST().setToken(token);

  try {
    console.log(
      `Début du rafraichissement de ${slashCommands.length} commandes (/).`
    );

    const data: any[] = (await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: slashCommands }
    )) as any[];

    console.log(`Rechargement réussi de ${data.length} commandes (/).`);
  } catch (error) {
    console.error(error);
  }

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!commands) {
      console.error(
        `Aucune commande correspondant à ${interaction.commandName} n'a été trouvée.`
      );
      return;
    }

    await command.execute(interaction).catch((err) => {
      console.error(err);
    });
  });

  client.login(token);
}

main();
