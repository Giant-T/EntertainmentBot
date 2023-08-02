import {
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  ButtonInteraction,
  Message,
} from 'discord.js';
import Movie from '../models/movie.js';
import sendDetailedMovieEmbed from './detailedMovieEmbed.js';

type Direction = 'right' | 'left';
const PAGE_SIZE = 5;

function addFields(embed: EmbedBuilder, movies: Movie[], offset: number) {
  // Ajoute les films au message
  movies.slice(offset, offset + PAGE_SIZE).forEach((movie, index) => {
    embed.addFields({
      name: `${index + 1} - ${movie.title}`,
      value: movie.formatted_overview,
    });
  });
  embed.addFields({
    name: 'Résultats',
    value: `${Math.min(offset + PAGE_SIZE, movies.length)}/${movies.length}`,
  });
}

function generateListEmbed(
  movies: Movie[],
  title: string,
  offset: number
): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle(title).setColor(Colors.DarkBlue);

  addFields(embed, movies, offset);

  return embed;
}

function generateNumbersRow(
  movies: Movie[],
  offset: number
): ActionRowBuilder<ButtonBuilder> {
  const numbers: ButtonBuilder[] = [
    new ButtonBuilder()
      .setCustomId('0')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(movies[offset] === undefined)
      .setEmoji('1️⃣'),
    new ButtonBuilder()
      .setCustomId('1')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(movies[1 + offset] === undefined)
      .setEmoji('2️⃣'),
    new ButtonBuilder()
      .setCustomId('2')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(movies[2 + offset] === undefined)
      .setEmoji('3️⃣'),
    new ButtonBuilder()
      .setCustomId('3')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(movies[3 + offset] === undefined)
      .setEmoji('4️⃣'),
    new ButtonBuilder()
      .setCustomId('4')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(movies[4 + offset] === undefined)
      .setEmoji('5️⃣'),
  ];

  return new ActionRowBuilder<ButtonBuilder>().addComponents(...numbers);
}

function generateArrowsRow(
  movies: Movie[],
  offset: number
): ActionRowBuilder<ButtonBuilder> {
  const arrows: ButtonBuilder[] = [
    new ButtonBuilder()
      .setCustomId('left')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(offset === 0)
      .setEmoji('◀️'),
    new ButtonBuilder()
      .setCustomId('right')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(offset + PAGE_SIZE >= movies.length)
      .setEmoji('▶️'),
  ];

  return new ActionRowBuilder<ButtonBuilder>().addComponents(...arrows);
}

async function sendMovieListEmbed(
  interaction: CommandInteraction,
  message: Message<boolean>,
  movies: Movie[],
  title: string
) {
  let offset: number = 0;
  const embed = generateListEmbed(movies, title, offset);

  await interaction.editReply({
    embeds: [embed],
    components: [
      generateNumbersRow(movies, offset),
      generateArrowsRow(movies, offset),
    ],
  });

  const addButtonListener = () => {
    const filter = (click: ButtonInteraction<'cached'>): boolean => {
      return click.user.id === interaction.user.id;
    };

    const collector = message.channel.createMessageComponentCollector({
      filter,
      dispose: true,
      time: 30000,
      message: message,
      max: 1,
    });

    collector.on(
      'collect',
      async (buttonInteraction: ButtonInteraction<'cached'>) => {
        await buttonInteraction.deferUpdate();
        if (!isNaN(+buttonInteraction.customId)) {
          const index: number = +buttonInteraction.customId;
          return sendDetailedMovieEmbed(interaction, movies[index + offset].id);
        }
        changeOffset(
          buttonInteraction.customId as Direction,
          buttonInteraction
        );
      }
    );
  };

  addButtonListener();

  const changeOffset = (
    direction: Direction,
    buttonInteraction: ButtonInteraction<'cached'>
  ) => {
    offset += direction === 'left' ? -PAGE_SIZE : PAGE_SIZE;
    offset = Math.min(movies.length, Math.max(0, offset));
    const embed = generateListEmbed(movies, title, offset);

    buttonInteraction.editReply({
      embeds: [embed],
      components: [
        generateNumbersRow(movies, offset),
        generateArrowsRow(movies, offset),
      ],
    });

    addButtonListener();
  };
}

export default sendMovieListEmbed;
