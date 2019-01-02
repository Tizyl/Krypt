//calling in packages
const Discord = require('discord.js');
const bot = new Discord.Client();
const weather = require('weather-js');
const fs = require('fs');

//calling in json files
const commands = JSON.parse(fs.readFileSync('Storage/commands.json', 'utf8'));


//global settings
const prefix = '*';

//functions webhook + code (zie webhook cmd(line:140))
function hook(channel, title, message, color, avatarURL) {

    if(!channel) return console.log('Channel not specified.');
    if(!title) return console.log('Title not specified.');
    if(!message) return console.log('Message not specified.');
    if(!color) color = 'd9a744';
    if(!avatarURL) avatarURL = 'https://cdn4.iconfinder.com/data/icons/technology-devices-1/500/speech-bubble-128.png';

    color = color.replace(/\s/g, '');
    avatarURL = avatarURL.replace(/\s/g, '');

    channel.fetchWebhooks()
        .then(webhook => {

            let foundHook = webhook.find('name', 'Krypt');

            if(!foundHook) {
                channel.createWebhook('Webhook', 'https://cdn4.iconfinder.com/data/icons/technology-devices-1/500/speech-bubble-128.png')
                    .then(webhook => {

                        webhook.send('', {
                            "username": title,
                            "avatarURL": avatarURL,
                            "embeds": [{
                                "color": parseInt(`0x${color}`),
                                "description": message
                            }]
                        })
                            .catch(error => {
                                console.log(error);
                                return channel.send('**Something went wrong while sending the webhook. Please check the console.**');

                            })
                    })
            } else {
                foundHook.send('', {
                    "username": title,
                    "avatarURL": avatarURL,
                    "embeds": [{
                        "color": parseInt(`0x${color}`),
                        "description": message
                    }]
                })
                    .catch(error => {
                        console.log(error);
                        return channel.send('**Something went wrong while sending the webhook. Please check the console.**');

                    })
            }


        })

}

//messages
bot.on('message', message => {
    //variabelen
    let msg = message.content.toUpperCase();
    let sender = message.author;
    let cont = message.content.slice(prefix.length).split(" ");
    let args = cont.slice(1);

    //commands

    //ping cmd
    if(msg === prefix +'PING') {
        message.channel.send('PING!');
    }

    //delete cmd
    if(msg.startsWith(prefix + 'PURGE')) {
        async function purge() {
            message.delete();

            if(!message.member.roles.find(roles => roles.name === "Moderator")) {
                message.channel.send('You need the \`Moderator\` role to use this command.');
                return;
            }

            if(isNaN(args[0])) {
                message.channel.send(' ``` Usage: ' + prefix + 'purge <amount> \n (Moderator rank required) ``` ');
                return;
            }

            if(args[0] > 100) {
                message.channel.send(' ** Maximum amount is 100 messages at once. **');
                return;
            }

            const fetched = await message.channel.fetchMessages({limit: args[0]});
            //console log voorbeeld
            console.log(fetched.size + ' messages found, deleting...');

            message.channel.bulkDelete(fetched)
                .catch(error => message.channel.send(`Error: ${error}`)); //error displayen
            message.channel.send(' ** Deleted ' + fetched.size + " message(s). ** ");
        }
        purge();
    }
    //weather cmd
    if(msg.startsWith(prefix + 'WEATHER')) {
        weather.find({search: args.join(" "), degreeType: 'C'}, function(err, result) {
            if(err) message.channel.send(err);

            if(result === undefined || result.length === 0) {
                message.channel.send('Please enter a **valid** location.')
                return;
            }

            //variabelen
            var current = result[0].current;
            var location = result[0].location;

            //embed
            const embed = new Discord.RichEmbed()
                .setDescription(`**${current.skytext}**`)
                .setAuthor(`Weather for ${current.observationpoint}`)
                .setThumbnail(current.imageUrl)
                .setColor(0x00AE86)
                .addField('Timezone', `UTC${location.timezone}`, true)
                .addField('Degree Type',location.degreetype, true)
                .addField('Temperature',`${current.temperature} Degrees`, true)
                .addField('Day', `${current.shortday}`, true)
                .addField('Winds',current.winddisplay, true)
                .addField('Humidity', `${current.humidity}%`, true)

                message.channel.send({embed});
        });
    }
    //webhooks
    if(msg.startsWith(prefix + 'HOOK')) {
        message.delete();

        if(msg === prefix + 'HOOK') {
            return hook(message.channel, 'Hook Usage', `${prefix}hook <title>, <message>, [HEXcolor], [avatarURL]\n\n**<> is required\n[] is optional**`, 'FC8469', 'https://cdn4.iconfinder.com/data/icons/global-logistics-3/512/129-512.png')

        }

        let hookArgs = message.content.slice(prefix.length + 4).split(",");

        hook (message.channel, hookArgs[0], hookArgs[1], hookArgs[2], hookArgs[3]);
    }
    //help cmd
    if(msg.startsWith(prefix + 'HELP')) {
        if(msg === `${prefix}HELP`) {
            const embed = new Discord.RichEmbed()
                .setColor(0x1D82B6)

                let commandsFound = 0;

                for(var cmd in commands) {
                    if(commands[cmd].group.toUpperCase() === 'USER') {
                        
                        commandsFound++

                        embed.addField(`${commands[cmd].name}`, `**Description:** ${commands[cmd].desc}\n**Usage:** ${prefix + commands[cmd].usage}`);

                    }
                    embed.setFooter(`Currently showing ${groupFound} commands. To view another group do ${prefix}help [group / command]`)
                    embed.setDescription(`**${commandsFound} commands found** - <> means required, [] means optional`)

                }
                message.author.send({embed})
                message.channel.send({embed: {
                    color: 0x1D82B6,
                    description: `**Check your DMs ${message.author}!**`
                }})
        } else if (args.join(" ").toUpperCase() === 'GROUPS') {

            let groups = '';

            for(var cmd in commands) {
                if(!groups.includes(commands[cmd].group)) {
                    groups += `${commands[cmd].group}\n`
                }
            }

            message.channel.send({embed: {
                description: `**${groups}**`,
                title:"Groups",
                color: 0x1D82B6,
                
            }})

            return;

        } else {

            let groupFound = '';

            for(var cmd in commands) {
                
                if(args.join(" ").trim().toUpperCase() === commands[cmd].group.toUpperCase()) {
                    groupFound = commands[cmd].group.toUpperCase();
                    break;
                }

            }
            if(groupFound != '') {
                const embed = new Discord.RichEmbed()
                .setColor(0x1D82B6)

                let commandsFound = 0;

                for(var cmd in commands) {
                    if(commands[cmd].group.toUpperCase() === groupFound) {
                        
                        commandsFound++

                        embed.addField(`${commands[cmd].name}`, `**Description:** ${commands[cmd].desc}\n**Usage:** ${prefix + commands[cmd].usage}`);

                    }
                    
                }
                embed.setFooter(`Currently showing ${groupFound} commands. To view another group do ${prefix}help [group / command]`)
                embed.setDescription(`**${commandsFound} commands found** - <> means required, [] means optional`)

                message.author.send({embed})
                message.channel.send({embed: {
                    color: 0x1D82B6,
                    description: `**Check your DMs ${message.author}!**`
                }})
                return;
                
            }
            
            
            let commandFound = '';
            let commandDesc = '';
            let commandUsage = '';
            let commandGroup = ''

            for(var cmd in commands) {
                if(args.join(" ").trim().toUpperCase() === commands[cmd].name.toUpperCase()) {
                    commandFound = commands[cmd].name;
                    commandDesc = commands[cmd].desc;
                    commandUsage = commands[cmd].usage;
                    commandGroup = commands[cmd].group;
                    break;
                }
            }
            if(commandFound === '') {
                 message.channel.send({embed: {
                description: `**No group or command found titled \`${args.join(" ")}\`**`,
                color: 0x1D82B6,
                
            }})

            }

            message.channel.send({embed: {
                title: '<> means required, [] means optional',
                color: 0x1D82B6,
                fields: [{
                    name:commandFound,
                    value:`**Description:** ${commandDesc}\n**Usage:** ${commandUsage}\n**Group:** ${commandGroup}`
                }]
            }})
        }
    }

});

//bot: ready
bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}.`);
    bot.user.setActivity('Tizyl#4609', {type: 'Listening'});

});


//login 
bot.login(process.env.BOT_TOKEN);
