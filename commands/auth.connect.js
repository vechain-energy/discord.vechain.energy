const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const bent = require('bent')
const wait = require('node:timers/promises').setTimeout
const Keyv = require('keyv')

const TIMEOUT_SECONDS = 90
const INTERVAL_WAIT_SECONDS = 1
const AUTH_SERVER = 'https://auth.api.vechain.energy'
const AUTH_SCOPE = 'identity profile'

const db = new Keyv()

const postAuth = bent('POST', AUTH_SERVER, 'json')
const getAuth = bent('GET', AUTH_SERVER, 'json')

module.exports = {
  db,
  constants: { AUTH_SERVER, AUTH_SCOPE },
  data: new SlashCommandBuilder()
    .setName('connect')
    .setDescription('connect VeChain wallet'),
  async execute (interaction) {
    try {
      const { embed: authEmbed, sessionId } = await initSession()
      await interaction.reply({ embeds: [authEmbed], ephemeral: true })

      const status = await waitForUserAuth(sessionId)

      // welcome if a auth was successful
      if (status?.access_token) {
        const userinfo = await postAuth('/oauth2/userinfo', {}, { authorization: `${status.token_type} ${status.access_token}` })
        await db.set(interaction.user.id, status)
        return interaction.editReply({ embeds: [], content: `Welcome ${userinfo.nickname || userinfo.address}!`, ephemeral: true })
      } else if (status?.error) {
        throw new Error(status.error)
      }
    } catch (err) {
      console.error(err)
      return interaction.editReply({ embeds: [], content: `Authentification failed: ${err.message}`, ephemeral: true })
    }
  }
}

async function initSession () {
  const sessionId = Math.random().toString(36).slice(2)
  const state = Math.random().toString(36).slice(2)

  await postAuth(`/session/${sessionId}`, { state })
  const redirectUri = `${AUTH_SERVER}/session/${sessionId}`
  const userAuthUrl = `${AUTH_SERVER}/oauth2/authorize?state=${state}&scope=${encodeURIComponent(AUTH_SCOPE)}&redirect_uri=${encodeURIComponent(redirectUri)}`

  const embed = new EmbedBuilder().setDescription(`[Please click here to identify yourself.](${userAuthUrl})`)

  return { embed, sessionId }
}

async function waitForUserAuth (sessionId) {
  let timeout = TIMEOUT_SECONDS
  do {
    await wait(INTERVAL_WAIT_SECONDS * 1000)

    // check on session status while user is authenticating
    const status = await getAuth(`/session/${sessionId}`)

    // welcome if a auth was successful
    if (status?.access_token || status?.error) {
      return status
    }
  } while (--timeout > 0)

  throw new Error('timeout')
}
