import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../models/command.js';

const Ping: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond avec Pong!'),
  async execute(interaction: CommandInteraction) {
    await interaction.reply('Pong!');
  },
};

export default Ping;
