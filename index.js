const Discord = require(`discord.js`);
const client = new Discord.Client();
const config = require(`./config.json`);
const fs = require(`fs`);
const ms = require(`ms`);
const { blacklist } = require(`./config.json`);
const path = require(`path`);
const { getCommands } = require(`./utils/index.js`);

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();

client.commands = new Discord.Collection();

const commandFolders = fs.readdirSync('./commands');

for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		client.commands.set(command.name, command);
	}
}

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client));
	} else {
		client.on(event.name, (...args) => event.execute(...args, client));
	}
}

client.on(`ready`, () => {
  console.log(`${client.user.username} is in ${client.guilds.cache.size} houses installed!\nMy prefix is: ${config.prefix}\nMy main server is: ${config.ss}\nMy logs channel: ${config.botlogs}\nMy owner: ${config.owner}`)
})

client.on(`guildCreate`, guild => {
    console.log(`${client.user.tag} was setup in the house: ${guild.name}`);
    const ss = client.guilds.cache.get(config.ss);
    const botlogs = client.channels.cache.get(config.botlogs)
    const embed = new Discord.MessageEmbed()
    .setTitle(`House update!`)
    .setAuthor(guild)
    .setDescription(client.user.username + ` is now installed in: ` + guild.name)
    .addField(`Current amount of houses:`, client.guilds.cache.size + ` houses`)
    .setColor(`#00ff27`);
    botlogs.send(embed);
});

client.on(`guildDelete`, guild => {
  console.log(`${client.user.tag} was removed from the house: ${guild.name}`);
  const ss = client.guilds.cache.get(config.ss);
  const botlogs = client.channels.cache.get(config.botlogs)
  const embed = new Discord.MessageEmbed()
  .setTitle(`House update!`)
  .setAuthor(guild)
  .setDescription(client.user.username + ` is now removed from: ` + guild.name + ` :/`)
  .addField(`Current amount of houses:`, client.guilds.cache.size + ` houses`)
  .setColor(`RED`);
  botlogs.send(embed);
});

client.on('message', message => {
	if(!message.content.toLowerCase().startsWith(config.prefix) || message.author.bot) return;
  if (blacklist.includes(message.author.id)) return;

	const args = message.content.slice(config.prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) return;

	if (command.guildOnly && message.channel.type === 'dm') {
		return message.reply('I can\'t execute that command inside DMs!');
	}

  // For beta role
  const supportGuild = message.client.guilds.cache.get(config.support_server)
  const member = supportGuild.members.cache.get(message.author.id)
  const hasBeta = member ? member.roles.cache.some(role => role.id === config.roles.ss_support || role.id === config.roles.ss_beta) : false
  if (command.beta && !hasBeta){
    return message.channel.send(`You need the Beta Testers role for this command!`);
  }
  // staff role
  const hasStaff = member ? memberz.roles.cache.some(role => role.id === config.roles.ss_support) : false
  if (command.staff && !hasStaff){
    return message.channel.send(`You need a staff role for this command!`);
  }

	if (command.permissions) {
		const authorPerms = message.channel.permissionsFor(message.author);
		if (!authorPerms || !authorPerms.has(command.permissions)) {
			return message.reply('You can not do this!');
		}
	}

	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments, ${message.author}!`;

		if (command.usage) {
			reply += `\nThe proper usage would be: \`${config.prefix}${command.name} ${command.usage}\``;
		}

		return message.channel.send(reply);
	}

	try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
      const ErrorChannel = client.channels.cache.get(config.errorChannel);
      ErrorChannel.send(`An error has occurred while trying to execute '${command.name}' by "${message.author.username}" aka "${message.author.id}"\n\nError:\n\`\`\`${error}\`\`\``)
      message.reply('there was an error trying to execute that command!');
	}
});

client.on('message', (message) => {
  if (blacklist.includes(message.author.id)) return;
    if(message.author.bot) return;
  
    if(message.content === `${config.prefix}` || message.content === `${config.prefix} help` || message.content === `<@${message.client.user.id}>`){
      let name = JSON.parse(fs.readFileSync("./names.json", "utf8"));
      if(!name[message.author.id]) return message.channel.send(`Hello **${message.author.username}**, What can i do for you?\n\nUse \`${config.prefix} commands\` or visit our site  ${config.website.main} for all my commands!\nUse \`${config.prefix} callme\` to give yourself a username that i can call you :)`)
        message.channel.send(`Hello **${name[message.author.id].name}**, What can i do for you?\n\nUse \`${config.prefix} commands\` or visit our site  ${config.website.main} for all my commands!`);
    } else if(message.content === `<@${client.user.id}>`){
      message.channel.send(`My prefix is \`${config.prefix}\``);
    }
  
    if(message.content === 'it\'s my bday') return message.reply(`Happy birthday to you ${message.author}`)
    if(!message.content.startsWith(config.prefix)) return;
      if(message.content.startsWith(config.prefix + ` help`) || message.content.startsWith(config.prefix + `help`)) {
        
        const member = message.mentions.users.first();

        if(!member) return;

        let name = JSON.parse(fs.readFileSync("./names.json", "utf8"));
        if(!name[member.id]) name = member.username
        else if(name[member.id]) name = name[member.id].name
        
        
        if(member){
          if(member.id === message.author.id){
            message.channel.send(`You need help? lol for that you didn't need to ping yourself lol but oki you do you xD`)
            return message.channel.send(`Hello **${name}**, What can i do for you?\n\nUse \`${config.prefix} commands\` or visit our site ${config.website.main} for all my commands!`)
          } 
          else return message.channel.send(`I don't feel like helping ${name} today sorry. Not if you ask tho like if they ask themselves i'll help ${name} but when you ask nah i'm not going to help then lol`)
        }
      }
      if(message.author.id === config.owner){
        message.react(`♥`)
      };  
  });

client.on(`message`, message => {
  if(message.author.bot) return
  if (blacklist.includes(message.author.id)) return;
  
  const member = message.mentions.users.first();
  if(!member) return
    
    if(message.content.includes(member.id)){
      
      let afk = JSON.parse(fs.readFileSync("./afk.json", "utf8"));
  if(!afk[member.id]) return;
  else if(afk[member.id]){
    
      let afk = JSON.parse(fs.readFileSync("./afk.json", "utf8"));
      if(afk[member.id]) afkreason = afk[member.id].afkreason
      if(afk[member.id].afkreason === "/") return

      // names
        let name = JSON.parse(fs.readFileSync("./names.json", "utf8"));
        if(!name[message.author.id]) name = message.author.username
        else if(name[message.author.id]) name = name[message.author.id].name
        
        let name1 = JSON.parse(fs.readFileSync("./names.json", "utf8"));
        if(!name1[member.id]) name1 = member.username
        else if(name1[member.id]) name1 = name1[member.id].name
      // end of names;

      const embed = new Discord.MessageEmbed()
      .setTitle(`${name}, ${name1} is afk.`)
      .addField(`They are afk because:`, afkreason)
      .setTimestamp()
      .setAuthor(name, message.author.displayAvatarURL({ dynamic: true }))
      .setColor(`RANDOM`)
      return message.channel.send(embed)
    }
  }
})

client.login(config.token);