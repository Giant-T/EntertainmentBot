import {
  CommandInteraction,
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  Colors,
} from 'discord.js';
import Command from '../models/command.js';

// Retourne une belle image de chat à l'utilisateur
const Kitten: Command = {
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Petite image sympathique'),
  async execute(interaction: CommandInteraction) {
    const image = new AttachmentBuilder('assets/kitten.jpg');
    const embed = new EmbedBuilder()
      .setTitle('😻 PETIT CHAT 😻')
      .setColor(Colors.DarkAqua)
      .setImage('attachment://kitten.jpg');

    await interaction.reply({ embeds: [embed], files: [image] });
  },
};

export default Kitten;
