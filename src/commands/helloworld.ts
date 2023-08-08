import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../models/command.js';

// Commande Hello, World!
const Helloworld: Command = {
  data: new SlashCommandBuilder().setName('hello').setDescription('Bonjour'),
  async execute(interaction: CommandInteraction) {
    await interaction.reply('World!');
  },
};

export default Helloworld;
