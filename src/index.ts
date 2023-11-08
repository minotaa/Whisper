import { SlashCommandBuilder, REST, Routes, Client, Events, GatewayIntentBits, Collection, ActivityType, User } from "discord.js"
import "dotenv/config"
import { green, reset, yellow } from "kleur"
import mongoose from "mongoose";
import { checkProfile, getProfile, getRandomInt } from "./utils/functions";
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
  if (!expCooldowns.has(message.author.id)) {
    const exp = getRandomInt(5, 15)
    await checkProfile(message.author.id, client)
    const profile = await Profile.findOne({
      user: message.author.id
    }).exec()
    profile.exp += exp
    profile.totalExp += exp
    if (profile.exp >= (100 * Math.pow(1.5, (profile.level + 1)))) {
      profile.exp -= (100 * Math.pow(1.5, (profile.level + 1)))
      profile.level++
      message.channel.send(`Congratulations <@!${message.author.id}>! You've leveled up to **Level ${profile.level}**! :D\nHeadpats for you <:pi_headpats:1106417340977004664:> <:pi_headpats:1106417340977004664:> <:pi_headpats:1106417340977004664:>`)
    }
    profile.save()

    expCooldowns.set(message.author.id, new Collection())
    setTimeout(() => {
      expCooldowns.delete(message.author.id)
    }, 30000)
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
    let nextLevel = profile.expNeeded || 100
    let points = profile.exp || 0
    const progBar = Math.floor(Math.max((points / nextLevel) * 550, 10))
    let rankCardColor = '#ffc2dc'
    const canvas = new Canvas(600, 300)
    await loadFont('./src/resources/fonts/Inter-ExtraBold.ttf', {
      family: 'Default Bold'
    })
    await loadFont('./src/resources/fonts/Inter-Medium.ttf', {
      family: 'Default'
    })
    const bg = await loadImage('https://cdn.discordapp.com/attachments/766726525520838670/1171663658472976414/wooper.jpg?ex=655d7fd0&is=654b0ad0&hm=779176f972eadce03f7fc50cd96155ee1a50b806c4bba514df679c8ca0128507&')
    const avatar = await loadImage(avatarURL)
    canvas
      .printImage(bg, 0, 0, 600, 300)
      .setShadowColor('#44474d')
      .setShadowBlur(10)
      .setShadowOffsetY(5)
      .printCircle(80, 90, 48)
      .restore()
      .printCircularImage(avatar, 80, 90, 48)
      .setColor('#ffff')
    
    if (user.discriminator == '0') {
      canvas
        .setTextFont('48pt Default')
        .printText(user.username, 140, 110)
        .setTextFont('18pt Default Bold')
        .setColor('#cfd1d0')
        .setColor('#ffff')
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
      .printText(`Level ${level}`, 35, 216)
      .printText(`${points} / ${nextLevel}`, 420, 216)
      .resetShadows()
      .printRoundedRectangle(25, 230, 550, 24, 32)
      .restore() 
      .setColor(rankCardColor)
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