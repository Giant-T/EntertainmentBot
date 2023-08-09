import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../models/command.js';
import sendPager from '../embeds/pager.js';
import sendDetailedEmbed from '../embeds/detailedEmbed.js';
import EntertainmentType, {
  entertainmentTypePlural,
  getRequester,
} from '../types/entertainmentType.js';
import Requester from '../utils/requester.js';

// Permet à l'utilisateur de rechercher un film
const Search: Command = {
  data: new SlashCommandBuilder()
    .setName('recherche')
    .addStringOption((options) =>
      options
        .setName('requete')
        .setDescription('Requête de recherche')
        .setRequired(true)
    )
    .addStringOption((options) =>
      options
        .setName('type')
        .setDescription('Type de recherche')
        .addChoices(
          { name: 'Film', value: 'Movie' },
          { name: 'Jeux Vidéo', value: 'VideoGame' }
        )
        .setRequired(true)
    )
    .setDescription('Recherche de film'),
  async execute(interaction: CommandInteraction) {
    await interaction.deferReply({
      ephemeral: true,
    });
    const type: EntertainmentType =
      EntertainmentType[
        interaction.options
          .get('type', true)
          .value.toString() as keyof typeof EntertainmentType
      ];

    const query = interaction.options.get('requete').value.toString();
    const requester: Requester = getRequester(type);

    const results = await requester.search(query);

    sendPager(
      interaction,
      results,
      `Recherche de ${entertainmentTypePlural(type)} '${query}'`,
      (value, index) => ({
        name: `${index + 1} - ${value.title}`,
        value: value.formatted_overview,
      }),
      (interaction, value) =>
        sendDetailedEmbed(interaction as CommandInteraction, value)
    );
  },
};

export default Search;
