import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  MessageReaction,
  SlashCommandBuilder,
  User,
} from 'discord.js';
import Command from '../models/command.js';
import axios from 'axios';
import MovieSearchResult from '../models/movieSearchResult.js';
import Movie from '../models/movie.js';

// Commande qui retourne un mockup de la liste des films à l'utilisateur
const SearchMovies: Command = {
  data: new SlashCommandBuilder()
    .setName('searchmovies')
    .addStringOption((options) =>
      options
        .setName('query')
        .setDescription('Requête de recherche')
        .setRequired(true)
    )
    .addStringOption((options) =>
      options
        .setName('language')
        .setDescription('Langage des informations')
        .addChoices(
          { name: 'Français', value: 'fr-CAN' },
          { name: 'English', value: 'en-CAN' }
        )
    )
    .setDescription('Recherche de film'),
  async execute(interaction: CommandInteraction) {
    const query = interaction.options.get('query').value;
    const language =
      interaction.options.get('language', false)?.value ?? 'fr-CAN';
    const { MOVIE_TOKEN } = process.env;

    const buttons: ButtonBuilder[] = [
      new ButtonBuilder()
        .setCustomId('left')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('◀️'),
      new ButtonBuilder()
        .setCustomId('right')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('▶️'),
    ];

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

    const { results } = new MovieSearchResult(
      (
        await axios.get(
          `https://api.themoviedb.org/3/search/movie?query=${query}&language${language}`,
          {
            headers: {
              Authorization: `Bearer ${MOVIE_TOKEN}`,
            },
          }
        )
      ).data
    );

    const embed = new EmbedBuilder()
      .setTitle('Liste des films')
      .setColor(Colors.DarkAqua);

    // Ajoute les films au message
    results.slice(0, 5).forEach((movie, index) => {
      embed.addFields({
        name: `${index + 1} - ${movie.title}`,
        value:
          movie.overview.length > 1024
            ? movie.overview.slice(0, 1023) + '&hellip;'
            : movie.overview,
      });
    });

    const message = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });

    // Ajoute les réactions 1, 2, 3... sous le message
    const emojiNumbers: string[] = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    message
      .react(emojiNumbers[0])
      .then(() => message.react(emojiNumbers[1]))
      .then(() => message.react(emojiNumbers[2]))
      .then(() => message.react(emojiNumbers[3]))
      .then(() => message.react(emojiNumbers[4]));

    const filter = (_reaction: MessageReaction, user: User): boolean => {
      return (
        emojiNumbers.includes(_reaction.emoji.name) &&
        user.id === interaction.user.id
      );
    };

    message.awaitReactions({ filter, max: 1 }).then((collected) => {
      const reaction = collected.first();

      const detailedEmbed = generateDetailedMovieEmbed(
        results[emojiNumbers.indexOf(reaction.emoji.name)]
      );

      message.reply({
        embeds: [detailedEmbed],
      });
    });
  },
};

function generateDetailedMovieEmbed(movie: Movie): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(movie.title)
    .setImage(movie.full_poster_path);

  return embed;
}

export default SearchMovies;
