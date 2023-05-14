import {
  CommandInteraction,
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
} from 'discord.js';
import Command from '../models/command.js';

const Kitten: Command = {
  data: new SlashCommandBuilder()
    .setName('kitten')
    .setDescription('Petite image sympathique'),
  async execute(interaction: CommandInteraction) {
    const image = new AttachmentBuilder('assets/kitten.jpg');
    const embed = new EmbedBuilder()
      .setTitle('😻 PETIT CHAT 😻')
      .setImage('attachment://kitten.jpg');

    await interaction.reply({ embeds: [embed], files: [image] });
  },
};

export default Kitten;
