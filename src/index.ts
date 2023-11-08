import { SlashCommandBuilder, REST, Routes, Client, Events, GatewayIntentBits, Collection, ActivityType, User } from "discord.js"
import "dotenv/config"
import { green, reset, yellow } from "kleur"
import mongoose from "mongoose";
import { checkProfile, getProfile, getRandomInt, getTopProfiles } from "./utils/functions";
import Profile from "./models/Profile";

const { Canvas, loadFont, loadImage } = require('canvas-constructor/cairo')

const TOKEN = process.env.TOKEN
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages] })

mongoose.connect(process.env.MONGO_URI!!, { // @ts-ignore 
  autoIndex: false,
  family: 4 
})

const expCooldowns = new Collection()

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return
  if (message.webhookId) return
  await checkProfile(message.author.id, client)
  const profile = await Profile.findOne({
    user: message.author.id
  }).exec()
  if (!expCooldowns.has(message.author.id)) {
    const exp = getRandomInt(5, 15)
    profile.exp += exp
    profile.totalExp += exp
    profile.save()

    expCooldowns.set(message.author.id, new Collection())
    setTimeout(() => {
      expCooldowns.delete(message.author.id)
    }, 30000)
  }
  if (profile.exp >= (100 * Math.pow(1.5, (profile.level + 1)))) {
    profile.exp -= (100 * Math.pow(1.5, (profile.level + 1)))
    profile.level++
    message.channel.send(`Congratulations <@!${message.author.id}>! You've leveled up to **Level ${profile.level}**! :D\nHeadpats for you <:pi_headpats:1106417340977004664:> <:pi_headpats:1106417340977004664:> <:pi_headpats:1106417340977004664:>`)
  }
})

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return
  if (interaction.commandName.toLowerCase() == 'rank') {
    let user = interaction.options.getUser('user') || interaction.member.user
    const avatarURL = (user as User).avatarURL({ extension: 'png' })
    let profile = await getProfile(user.id)
    if (!profile) {
      await interaction.reply({ content: `This user has not gained EXP.`, ephemeral: true })
      return
    }
    let level = profile.level || 0
    let nextLevel = (100 * Math.pow(1.5, (profile.level + 1))) || 100
    let points = profile.exp || 0
    let topProfiles = (await getTopProfiles())
    let position = topProfiles.findIndex((p) => p.user == profile.user) + 1
    const progBar = Math.floor(Math.max((points / nextLevel) * 550, 10))
    let rankCardColor = '#ffc2dc'
    const canvas = new Canvas(600, 300)
    await loadFont('./src/resources/fonts/Georgia-Bold.ttf', {
      family: 'Default Bold'
    })
    await loadFont('./src/resources/fonts/Georgia.ttf', {
      family: 'Default'
    })
    const bg = await loadImage('https://cdn.discordapp.com/attachments/678711114183344170/1171940081888673833/ghost_bg5.png?ex=655e8141&is=654c0c41&hm=6d930989dba32c15882d573f8ff1501a59aac516c69c4c92578f0e2f10aac5da&')
    const avatar = await loadImage(avatarURL)
    
    if (user.discriminator == '0') {
      if (user.username.length > 10) {
        canvas
          .printImage(bg, 0, 0, 600, 300)
          .setShadowColor('#db4664')
          .setShadowBlur(15)
          .setShadowOffsetY(5)
          .printCircle(60, 90, 48)
          .restore() 
          .printCircularImage(avatar, 60, 90, 48)
          .setColor('#ffff')
          .setTextFont('24pt Default Bold')
          .printText(user.username, 115, 105)
          .setTextFont('18pt Default Bold')
          .setColor('#cfd1d0')
          .setColor('#ffff')
          .setTextFont('32pt Default Bold')
          .printText(`#${position}`, 510, 110)
      } else {
        canvas
          .printImage(bg, 0, 0, 600, 300)
          .setShadowColor('#db4664')
          .setShadowBlur(15)
          .setShadowOffsetY(5)
          .printCircle(80, 90, 48)
          .restore() 
          .printCircularImage(avatar, 80, 90, 48)
          .setColor('#ffff')
          .setTextFont('36pt Default Bold')
          .printText(user.username, 140, 105)
          .setTextFont('18pt Default Bold')
          .setColor('#cfd1d0')
          .setColor('#ffff')
          .setTextFont('48pt Default Bold')
          .printText(`#${position}`, 485, 110)
      }
    } else {
      canvas
        .setTextFont('36pt Default')
        .printText(user.username, 140, 94)
        .setTextFont('18pt Default Bold')
        .setColor('#cfd1d0')
        .printText(`#${user.discriminator}`, 140, 128)
        .setColor('#ffff')
    }

    canvas
      .setTextFont('24pt Default Bold')
      .setStroke('#fff')
      .setTextFont('25pt Default Bold')
      .resetShadows()
      .setShadowColor('#db4664')
      .setShadowBlur(15)
      .setShadowOffsetY(5) 
      .printText(`Level ${level}`, 35, 216)
      .printText(`${points} / ${nextLevel}`, 420, 216)
      .resetShadows()
      .printRoundedRectangle(25, 230, 550, 24, 32)
      .restore() 
      .setColor('#db4664')
      .printRoundedRectangle(31, 234, progBar, 16, 20)
      .clip()
    await interaction.reply({ files: [{ attachment: canvas.toBuffer(), name: 'card.png' }] })
  }
})

client.once(Events.ClientReady, async c => {
  let commands = [
    new SlashCommandBuilder()
      .setName('rank')
      .setDescription('View your leveling rank')
      .addUserOption(user => 
        user
          .setName('user')
          .setDescription('User to view leveling rank')
          .setRequired(false)  
      ).toJSON(),
  ]
  console.log(green("✓"), reset(`Ready! Successfully logged in as ${c.user.tag}!`));
  c.user.setActivity('I\'m in your walls.', { type: ActivityType.Custom })
  console.log(yellow("..."), reset("Attempting to send slash commands to Discord..."));
  try {
    const data = await rest.put(
			Routes.applicationGuildCommands('1171649028086317056', '766726525520838666'),
			{ body: commands },
		); // @ts-ignore
    console.log(green("✓"), reset(`Successfully reloaded ${data.length} application (/) commands.`));
  } catch (error) {
    console.error(error)
  }
})

const rest = new REST()
rest.setToken(TOKEN);

client.login(TOKEN)