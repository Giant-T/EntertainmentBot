import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  Message,
} from 'discord.js';
import DetailedMovie from '../models/detailedMovie.js';
import MovieRequester from '../utils/movieRequester.js';
import Consumed from '../entities/consumed.js';
import BotDataSource from '../dataSource.js';

async function sendDetailedMovieEmbed(
  interaction: CommandInteraction,
  movieId: number
) {
  const movie = new DetailedMovie(
    (await MovieRequester.get(`movie/${movieId}?language=fr-CAN`)).data
  );

  const embed = new EmbedBuilder()
    .setTitle(movie.title)
    .setColor(Colors.DarkAqua)
    .setThumbnail(movie.full_poster_path)
    .setDescription(movie.overview)
    .setFields({
      name: 'Date de sortie',
      value: movie.release_date.toLocaleDateString('fr-CA'),
    })
    .setFooter({ text: movie.formatted_genres });

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('markAsSeen')
      .setEmoji('👁️')
      .setStyle(ButtonStyle.Primary)
  );

  const message = await interaction.followUp({
    embeds: [embed],
    components: [actionRow],
    fetchReply: true,
  });

  addDetailedButtonInteractions(interaction, message, movie);
}

function addDetailedButtonInteractions(
  interaction: CommandInteraction,
  message: Message<boolean>,
  movie: DetailedMovie
) {
  const filter = (click: ButtonInteraction<'cached'>): boolean => {
    return (
      click.user.id === interaction.user.id && click.customId === 'markAsSeen'
    );
  };

  const collector = message.channel.createMessageComponentCollector({
    filter,
    dispose: true,
    message: message,
    time: 45000,
    max: 1,
  });

  collector.on(
    'collect',
    async (buttonInteraction: ButtonInteraction<'cached'>) => {
      await buttonInteraction.deferUpdate();

      const newConsumed = new Consumed();
      newConsumed.title = movie.title;
      newConsumed.consumed_id = movie.id;
      newConsumed.type = 'movie';
      newConsumed.user_id = interaction.user.id;

      let response: string = '';

      if (
        (await BotDataSource.manager.getMongoRepository(Consumed).findOne({
          where: {
            consumed_id: movie.id,
            type: 'movie',
            user_id: interaction.user.id,
          },
        })) === null
      ) {
        await BotDataSource.manager
          .getMongoRepository(Consumed)
          .insertOne(newConsumed);

        response = `Vous avez maintenant visionné ${movie.title}.`;
      } else {
        response = `Vous avez déjà visionné ${movie.title}.`;
      }

      interaction.followUp({
        content: response,
        ephemeral: true,
      });
    }
  );
}

export default sendDetailedMovieEmbed;
