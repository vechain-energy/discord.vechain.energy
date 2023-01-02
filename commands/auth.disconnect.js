const { SlashCommandBuilder } = require('discord.js')
const { db } = require('./auth.connect')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('disconnect')
    .setDescription('disconnect currently connected wallet'),
  async execute (interaction) {
    try {
      await interaction.deferReply({ ephemeral: true })
      await db.delete(interaction.user.id)
      await interaction.editReply({ content: 'You are now disconnected :wave:', ephemeral: true })
    } catch (err) {
      return interaction.editReply({ content: `Disconnection failed: ${err.message}`, ephemeral: true })
    }
  }
}
