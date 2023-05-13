import {
  Colors,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import Command from '../models/command.js';

const Ping: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond avec Pong!'),
  async execute(interaction: CommandInteraction) {
    const millis = new Date().getTime() - interaction.createdTimestamp;

    const embed = new EmbedBuilder()
      .setColor(Colors.DarkAqua)
      .setTitle('Pong!')
      .setDescription(`${millis} ms`);

    const message = await interaction.reply({
      embeds: [embed],
      fetchReply: true,
    });
    message.react('🏓');
  },
};

export default Ping;
