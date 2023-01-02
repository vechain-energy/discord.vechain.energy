const { SlashCommandBuilder } = require('discord.js')
const bent = require('bent')
const { db, constants: { AUTH_SERVER } } = require('./auth.connect')

const postAuth = bent('POST', AUTH_SERVER, 'json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('get information about currently connected wallet'),
  async execute (interaction) {
    try {
      await interaction.deferReply({ ephemeral: true })

      const status = await db.get(interaction.user.id)
      if (!status) {
        throw new Error('I do not know you yet, please connect first')
      }

      const userinfo = await postAuth('/oauth2/userinfo', {}, { authorization: `${status.token_type} ${status.access_token}` })
      await interaction.editReply({ content: `I know you as ${userinfo.nickname} with address ${userinfo.address}`, ephemeral: true })
    } catch (err) {
      return interaction.editReply({ content: `Profile failed: ${err.message}`, ephemeral: true })
    }
  }
}
