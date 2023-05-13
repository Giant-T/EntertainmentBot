$commandsPath = "src/commands/"
$newCommandName = $args[0]

if (!$newCommandName) { 
    Write-Error "Le nom de commande doit être spécifié."
    exit
}

$newCommandName = $newCommandName.ToString().ToLower()

if ($newCommandName -eq "index") {
    Write-Error "Le nom de commande ne peut être «index»."
    exit
}

$commands = Get-ChildItem -Path $commandsPath -Name -Exclude index.ts -Filter *.ts

foreach ($command in $commands) {
    if ("$newCommandName.ts" -eq $command) {
        Write-Error "La commande existe déjà."
        exit
    }
}

New-Item -Path $commandsPath -Name "$newCommandName.ts"

$firstLetter = $newCommandName.Substring(0, 1).ToUpper()
$rest = $newCommandName.Substring(1)
$capitalizedCommand = $firstLetter + $rest

Out-File -FilePath "$commandsPath/$newCommandName.ts" -InputObject "import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../models/command.js';

const ${capitalizedCommand}: Command = {
  data: new SlashCommandBuilder()
    .setName('${newCommandName}')
    .setDescription('Nouvelle commande.'),
  async execute(interaction: CommandInteraction) {
    await interaction.reply('Nouvelle commande');
  },
};

export default ${capitalizedCommand};"

$indexContent = Get-Content -Encoding utf8 -Raw -Path $commandsPath/index.ts

$indexContent = $indexContent.Insert(0, "import $capitalizedCommand from './$newCommandName.js';`n")

$indexCurlyBracket = $indexContent.IndexOf('{')

$indexContent = $indexContent.Insert($indexCurlyBracket + 1, "`n  $capitalizedCommand,")

Set-Content -Path $commandsPath/index.ts -Value $indexContent -NoNewline

yarn fmt