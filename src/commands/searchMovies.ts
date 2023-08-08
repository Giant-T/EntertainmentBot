import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../models/command.js';
import MovieSearchResult from '../models/movieSearchResult.js';
import MovieRequester from '../utils/movieRequester.js';
import sendPager from '../embeds/pager.js';
import sendDetailedMovieEmbed from '../embeds/detailedMovieEmbed.js';

// Permet à l'utilisateur de rechercher un film
const SearchMovies: Command = {
  data: new SlashCommandBuilder()
    .setName('recherchefilm')
    .addStringOption((options) =>
      options
        .setName('requete')
        .setDescription('Requête de recherche')
        .setRequired(true)
    )
    .setDescription('Recherche de film'),
  async execute(interaction: CommandInteraction) {
    await interaction.deferReply({
      ephemeral: true,
    });

    const query = interaction.options.get('requete').value.toString();

    const { results } = new MovieSearchResult(
      (
        await MovieRequester.get(`search/movie?query=${query}&language=fr-CAN`)
      ).data
    );

    sendPager(
      interaction,
      results,
      `Recherche de films '${query}'`,
      (value, index) => ({
        name: `${index + 1} - ${value.title}`,
        value: value.formatted_overview,
      }),
      (interaction, value) =>
        sendDetailedMovieEmbed(interaction as CommandInteraction, value.id)
    );
  },
};

export default SearchMovies;
