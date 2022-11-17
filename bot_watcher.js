#!/usr/bin/env node

// read in env settings
require('dotenv').config();

const tmi = require('tmi.js');
const fetch = require('./bin/fetch');
const auth = require('./bin/auth');
var fs = require('fs');
var util = require('util');
var mysql = require('mysql2');
var con = mysql.createConnection({
  host: process.env.DB_IP,
  user: process.env.DB_UNAME,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  dateStrings: true
});
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}
var log_file = fs.createWriteStream(__dirname + '/logs/debug_watcher.log', { flags: 'a' });
log_file.write(`============================== New logs starting ${getTimeStamp(`US/Eastern`)}==============================\r\n`)

// Define configuration options
const opts = {
  options: { debug: false, messagesLogLevel: "info" },
  connection: {
    reconnect: true,
    secure: true
  },
  identity: {
    username: process.env.BOT_UNAME,
    password: process.env.BOT_PWD
  },
  channels: []
};
//functions
async function getUserList_DB() {
  var newList = []
  con.query(`SELECT * FROM ${process.env.DB_UserListTable}`, function (err, result, fields) {
    if (err) colorLog(`!!! query failed because: ${err}`, `error`);
    result.forEach((record) => {
      //colorLog(`* username: ${record.managed_user_name}`,`info`)
      if (new Date() <= new Date(record.coverage_ends)) {
        //colorLog(`* date was ${new Date(record.coverage_ends)}`,`info`)
        newList.push(record.managed_user_name)
      } else {
        colorLog("! " + record.managed_user_name + " no longer has coverage", `warning`)
      }
    })
  })
  return (Array.from(newList))
}

function getTimeStamp(timezone) {
  if (!timezone) {
    timezone = "UTC"
  }
  let date_string = new Date().toLocaleString("en-US", { timeZone: timezone });
  let base_date = new Date(date_string);
  let year = base_date.getFullYear();
  let month = ("0" + (base_date.getMonth() + 1)).slice(-2);
  let date = ("0" + base_date.getDate()).slice(-2);
  let hours = ("0" + base_date.getHours()).slice(-2);
  let minutes = ("0" + base_date.getMinutes()).slice(-2);
  let seconds = ("0" + base_date.getSeconds()).slice(-2);
  return year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds
}
function getColorCharacter(color) {
  switch (color) {
    case 'red':
      return "\x1b[31m"
    case 'green':
      return "\x1b[32m"
    case 'blue':
      return "\x1b[34m"
    case 'yellow':
      return "\x1b[33m"
    case 'magenta':
      return "\x1b[35m"
    case 'cyan':
      return "\x1b[36m"
    case 'white':
      return "\x1b[37m"
    default:
      return "\x1b[0m"
  }
}

function colorLog(message, status, channel = null) {
  if (process.env.LOGGING_LEVEL < 1) {
    return
  }
  switch (status) {
    case "success":
      if (process.env.LOGGING_LEVEL >= 3) {
        color = getColorCharacter('green');
        if (channel) {
          log_file.write(util.format(`[${getTimeStamp("US/Eastern")}][${status}][${channel.replace("#", "")}] : ${message}`) + '\n')
          console.log(color + `[${getTimeStamp("US/Eastern")}][${status}][${channel.replace("#", "")}] : ${message}` + "\x1b[0m");
        } else {
          log_file.write(util.format(`[${getTimeStamp("US/Eastern")}][${status}] : ${message}`) + '\n')
          console.log(color + `[${getTimeStamp("US/Eastern")}][${status}] : ${message}` + "\x1b[0m");
        }
      }
      break;
    case "info":
      if (process.env.LOGGING_LEVEL >= 3) {
        color = getColorCharacter('cyan')
        if (channel) {
          log_file.write(util.format(`[${getTimeStamp("US/Eastern")}][${status}][${channel.replace("#", "")}] : ${message}`) + '\n')
          console.log(color + `[${getTimeStamp("US/Eastern")}][${status}][${channel.replace("#", "")}] : ${message}` + "\x1b[0m");
        } else {
          log_file.write(util.format(`[${getTimeStamp("US/Eastern")}][${status}] : ${message}`) + '\n')
          console.log(color + `[${getTimeStamp("US/Eastern")}][${status}] : ${message}` + "\x1b[0m");
        }
      }
      break;
    case "error":
      if (process.env.LOGGING_LEVEL >= 1) {
        color = getColorCharacter('red');
        if (channel) {
          log_file.write(util.format(`[${getTimeStamp("US/Eastern")}][${status}][${channel.replace("#", "")}] : ${message}`) + '\n')
          console.log(color + `[${getTimeStamp("US/Eastern")}][${status}][${channel.replace("#", "")}] : ${message}` + "\x1b[0m");
        } else {
          log_file.write(util.format(`[${getTimeStamp("US/Eastern")}][${status}] : ${message}`) + '\n')
          console.log(color + `[${getTimeStamp("US/Eastern")}][${status}] : ${message}` + "\x1b[0m");
        }
      }
      break;
    case "warning":
      if (process.env.LOGGING_LEVEL >= 2) {
        color = getColorCharacter('yellow');
        if (channel) {
          log_file.write(util.format(`[${getTimeStamp("US/Eastern")}][${status}][${channel.replace("#", "")}] : ${message}`) + '\n')
          console.log(color + `[${getTimeStamp("US/Eastern")}][${status}][${channel.replace("#", "")}] : ${message}` + "\x1b[0m");
        } else {
          log_file.write(util.format(`[${getTimeStamp("US/Eastern")}][${status}] : ${message}`) + '\n')
          console.log(color + `[${getTimeStamp("US/Eastern")}][${status}] : ${message}` + "\x1b[0m");
        }
      }
      break;
    default:
      if (process.env.LOGGING_LEVEL >= 3) {
        color = getColorCharacter();
        if (channel) {
          log_file.write(util.format(`[${getTimeStamp("US/Eastern")}][${status}][${channel.replace("#", "")}] : ${message}`) + '\n')
          console.log(color + `[${getTimeStamp("US/Eastern")}][${status}][${channel.replace("#", "")}] : ${message}` + "\x1b[0m");
        } else {
          log_file.write(util.format(`[${getTimeStamp("US/Eastern")}][${status}] : ${message}`) + '\n')
          console.log(color + `[${getTimeStamp("US/Eastern")}][${status}] : ${message}` + "\x1b[0m");
        }
      }
  }
}

function ExcelDateToJSDate(serial) {
  var utc_days = Math.floor(serial - 25569);
  var utc_value = utc_days * 86400;
  var date_info = new Date(utc_value * 1000);

  var fractional_day = serial - Math.floor(serial) + 0.0000001;

  var total_seconds = Math.floor(86400 * fractional_day);

  var seconds = total_seconds % 60;

  total_seconds -= seconds;

  var hours = Math.floor(total_seconds / (60 * 60));
  var minutes = Math.floor(total_seconds / 60) % 60;

  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

function JSDateToExcelDate(inDate) {

  var returnDateTime = 25569.0 + ((inDate.getTime() - (inDate.getTimezoneOffset() * 60 * 1000)) / (1000 * 60 * 60 * 24));
  return returnDateTime.toString().substr(0, 5);

}

async function getUserList() {
  try {
    const authResponse = await auth.getToken(auth.tokenRequest);
    const rows = await fetch.callApi(auth.apiConfig.uri + process.env.API_VERSION + '/groups/' + process.env.GROUP_ID + '/drive/items/' + process.env.FILE_ID + '/workbook/tables/' + process.env.USER_TABLE_ID + '/rows', authResponse.accessToken, "get");
    const managedUsers = [];
    rows.value.forEach(element => {
      element.values.forEach(row => {
        if (new Date() <= ExcelDateToJSDate(row[3])) {
          colorLog('* Adding ' + row[0] + ' to managed list. Coverage expires ' + ExcelDateToJSDate(row[3]), 'info')
          managedUsers.push('#' + row[0])
          allowlist.push(row[0])
        } else {
          colorLog("! " + row[0] + " no longer has coverage", 'warning')
        }
      })
    })
    return Array.from(managedUsers)
  } catch (error) {
    colorLog(`!!! failed to pull managed users from Graph : ${error}`, 'error')
  }
}

function setTerminalTitle(title) {
  process.stdout.write(
    String.fromCharCode(27) + "]0;" + title + String.fromCharCode(7)
  );
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

async function main() {
  try {
    setTerminalTitle("Watcher")
    con.on('error', (err) => {
      colorLog(`!!! db connection found error\n${err}\n==========`, `error`)
    })
    con.connect(function (err) {
      if (err) throw err;
      colorLog("* dB connected", `info`);
    })
    var data = await con.promise().query(`SELECT * FROM ${process.env.DB_UserListTable}`)
    data[0].forEach((record) => {
      console.log(`username: ${record.managed_user_name}`)
      if (new Date() <= new Date(record.coverage_ends)) {
        //console.log(`* date was ${new Date(record.coverage_ends)}`)
        opts.channels.push(record.managed_user_name)
      } else {
        console.log("! " + record.managed_user_name + " no longer has coverage")
      }
    })
    // Create a client with our options
    if (client) {
      client.disconnect()
        .then((data) => {
          // data returns [server, port]
          colorLog('* disconnected from server before next run', 'success')
        }).catch((err) => {
          colorLog(`!!! failed disconnected from server before next run : ${err}`, 'error')
        });
    }
    client = new tmi.client(opts);
    // Register our event handlers (defined below)
    client.on('message', onMessageHandler);
    client.on('connected', onConnectedHandler);
    client.on('disconnected', onDisconnectHandler);
    client.on('ban', onBanHandler)
    client.on('raided', onRaidedHandler)
    client.on('hosted', onHostedHandler)
    client.on('hosting', onHostingHandler)
    client.on("cheer", onCheerHandler)
    client.on('subgift', onSubgiftHandler)
    client.on('submysterygift', onAnonSubGift)
    client.on('subscription', onSubscriptionHandler)
    client.on("followersonly", onFollowersOnly)
    client.on("roomstate", onRoomstateHandler)
    //client.on("mods",onModsHandler)
    // Connect to Twitch
    await client.connect();
    //con.end()
  } catch (err) {
    colorLog(`!!! error in main invocation\n${err}\n==========`, `error`)
  } finally {
    //con.destroy()
  }
}

async function writeRecord(value) {
  //TODO: get dupe record check working without pulling list again
  //if ((await getBanList()).includes(value.values[0][1])) {//if(banlist.includes(value.values[0][1])){
  if (banlist.includes(value.values[0][1])) {
    colorLog(`! trying to write duplicate ban already on list : ${value.values[0][1]}`, 'warning')
    return
  }
  colorLog(`* new record: [${value.values[0][0]},${value.values[0][1]},${value.values[0][2]}]`, 'info')
  const authResponse = await auth.getToken(auth.tokenRequest);
  const response = await fetch.callApi(auth.apiConfig.uri + process.env.API_VERSION + '/groups/' + process.env.GROUP_ID + '/drive/items/' + process.env.FILE_ID + '/workbook/tables/' + process.env.BANLIST_TABLE_ID + '/rows', authResponse.accessToken, "post", value);
  colorLog("* record post response: " + response, 'info')
}

//handlers

function onModsHandler(channel, mods) {
  colorLog(`* updating modlist dict entry for ${channel} to ${mods}`, `info`)
  modList[channel] = mods
}

// Called every time a message comes in
function onMessageHandler(channel, context, msg, self) {
  if (context['user-type'] === "mod") {
    if (modList[channel.replace("#", "")]) {
      if (!modList[channel.replace("#", "")].includes(context.username)) {
        colorLog(`* adding ${context.username} to ${channel.replace("#", "")} mod list`, `info`)
        modList[channel.replace("#", "")].push(context.username)
        colorLog(`* modList is now ${JSON.stringify(modList)}`, `info`)
      }
    } else {
      colorLog(`* creating modlist for ${channel.replace("#", "")} and adding ${context.username}`, `info`)
      modList[channel.replace("#", "")] = [context.username]
      colorLog(`* modList is now ${JSON.stringify(modList)}`, `info`)
    }
  }
  if (self) { return; } // Ignore messages from the bot

  //easter eggs
  if (msg.trim().toLowerCase().search(/happy(.*)birthday/) >= 0) {
    if (bdayHTable[channel]) {
      colorLog(`* birthday triggered on ${channel} - will be enabled in ${bdayCooldownInSeconds} seconds`, `info`)
      bdayHTable[channel] = false;
      client.say(channel, `FeelsBirthdayMan happy birthday`, `info`);
      setTimeout(() => {
        colorLog(`* timeout of happy birthday complete on ${channel}`, 'info')
        bdayHTable[channel] = true;
      }, 1000 * bdayCooldownInSeconds)
    } else {
      colorLog(`* saw 'happy*birthday' on ${channel},but on cooldown`, `info`)
    }
    return
  }

  const commandName = msg.trim().split(" ");
  if (context.username === "warmachine673" && commandName[0] === "!weasel" && channel.replace("#", "") === "tomaberu") {
    client.say(channel, `No Warmachine, you can't have it pepeD`);
    colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
    return
  }

  if (context.username === 'zoid__') {
    if (commandName[0] === 'bbs!ping') {
      client.say(channel, `pong`);
      colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
      return
    }
  }

  if (commandName[0] === `!kith`) {
    if (context.username === 'sarachariotvt') {
      if (commandName[1] && commandName[1] != "") {
        client.say(channel, `/me kithes ${commandName[1].replace("@", "")}`)
      } else {
        client.say(channel, `/me kithes ${context.username}`)
      }
      colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
      return
    } else {
      client.say(channel, `${context.username} - you're not the right person FeelsBadMan`)
    }
  }

  //moderator commands
  if (context.username === 'zoid__' || context.username === channel.replace("#", "") || client.isMod(channel.replace("#", ""), context.username) || (modList[channel] && modList[channel].includes(context.username))) {
    // if (commandName[0] === "!hilem") {
    //   client.say(channel, `Hi Lemxnslush! https://www.twitch.tv/lemxnslush https://twitter.com/LemxnSlush`)
    //   return
    // }
    if (commandName[0] === "!shromerch") {
      client.say(channel, `Have you seen Shroom's merch? Theres a cup! https://merch.streamelements.com/shroompaivt`);
      colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
      return
    }
    if (commandName[0] === "!shimerch") {
      client.say(channel, `Have you seen Shizuka's merch? There's a clock? https://www.redbubble.com/people/shizukach/explore?page=1&sortOrder=recent`);
      colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
      return
    }
    if (commandName[0] === '!tomaprime') {
      client.say(channel, `Have you heard of Twitch prime? https://clips.twitch.tv/ScaryWimpySandpiperPastaThat-WQv7I4PjKdvPPE-I`);
      colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
      return
    }
    if (commandName[0] === '!tomaxiv') {
      client.say(channel, `Have you heard of the trial for FFXIV? Use Toma's RAF code "JD7QG6HR" https://clips.twitch.tv/MagnificentNeighborlyChickpeaKappaRoss-ZouiYENhrWyM8UlC`);
      colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
      return
    }
  }

  //all user commands
  if (commandName[0] === '!bonk') {
    if (commandName[1] && commandName[1] != "") {
      if (commandName[1].toLowerCase() == "bravebearbot" || commandName[1].toLowerCase() == "@bravebearbot") {
        client.say(channel, `Nice try, kid`)
        client.timeout(channel.replace("#", ""), context.username, 5, "[NOT SERIOUS] tried to make bravebearbot bonk itself")
      } else {
        client.say(channel, `/me bonks ${commandName[1].replace("@", "")}`)
      }
    } else {
      client.say(channel, `/me bonks ${context.username}`)
    }
    colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
    return
  }

  if (commandName[0] === "!hw") {
    client.say(channel, `D: @${channel.replace("#", "")} do your homework`);
    colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
    return
  }

  if (commandName[0] === "!omd") {
    client.say(channel, `OhMyDog OHMYDOG MOMENT OhMyDog OHMYDOG MOMENT OhMyDog OHMYDOG MOMENT OhMyDog OHMYDOG MOMENT OhMyDog OHMYDOG MOMENT `);
    colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
    return
  }

  if (commandName[0] === '!savebears') {
    client.say(channel, `D: Stop killing bears`);
    colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
    return
  }

  if (commandName[0] === '!hug') {
    if (commandName[1] && commandName[1] != "") {
      client.say(channel, `/me bearhugs ${commandName[1].replace("@", "")}`)
    } else {
      client.say(channel, `/me bearhugs ${context.username}`)
    }
    colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
  }

  if (commandName[0] === '!tomerch') {
    client.say(channel, `KonBeru! Have you heard? Toma has merch! Come check it out here: https://store.streamelements.com/tomaberu-3451 https://www.redbubble.com/people/TomaBeru/explore?page=1&sortOrder=recent`);
    colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
    return
  }

  if (commandName[0] === "!rolldice") {
    if (commandName.length != 2 && commandName.length != 3) {
      colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")} - ${commandName} with length ${commandName.length}`, 'info')
      client.say(channel, `@${context.username} rolled 1d6 for ${getRandomInt(6) + 1}`)
      return
    }
    if (commandName[1] <= 2) {
      client.say(channel, `${context.username} invalid sides - die must have 3 or more sides - use !coinflip for 2 sided die`)
      return
    }
    //quantity specififed
    if (commandName[2]) {
      let quantity = Number(commandName[2])
      let sides = Number(commandName[1])
      if (quantity < 0 || quantity > 10) {
        colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
        client.say(channel, `${context.username} invalid quantity - must roll between 1 and 10 dice`)
        return
      }
      var results = []
      var sum = 0
      for (let i = 0; i < quantity + 1; i++) {
        let roll = getRandomInt(sides) + 1
        results.push(roll)
        sum += roll
      }
      colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")} - sum ${sum} results ${results}`, 'info')
      client.say(channel, `@${context.username} rolled ${quantity}d${sides} totaling ${sum} [${results}]`)
      return
    } else {//no quantity specified
      let sides = Number(commandName[1])
      colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
      client.say(channel, `@${context.username} rolled 1d${sides} for ${getRandomInt(sides) + 1}`)
      return
    }

  }

  if (commandName[0] === '!coinflip') {
    var rand = ['HEADS!', 'TAILS!'];
    client.say(channel, `/me @${context.username} caught ${rand[Math.floor(Math.random() * rand.length)]}`);
    colorLog(`* Executed ${commandName} command on https://twitch.tv/${channel.replace("#", "")}`, 'info')
    return
  }

  //shoutout commands
  switch (commandName[0].toLowerCase()) {
    case '!castella':
      client.say(channel, `https://www.twitch.tv/castella_rabbit https://twitter.com/Castella_Rabbit`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!fraise':
      client.say(channel, `https://www.twitch.tv/fraisechu  https://twitter.com/chubewbz`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!hahn':
      client.say(channel, `https://www.twitch.tv/hahnaraa https://twitter.com/hahnkusuda`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!kazuki':
      client.say(channel, `https://www.twitch.tv/kazukimajimach https://twitter.com/MajimaVtuber`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!lapis':
      client.say(channel, `https://www.twitch.tv/lapismanplaysmc https://twitter.com/lapismanplaysmc`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!lemon':
      client.say(channel, `https://www.twitch.tv/lemxnslush https://twitter.com/LemxnSlush`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!lilath':
      client.say(channel, `https://www.twitch.tv/lilacswrath https://twitter.com/LilacsWrath`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!runa':
      client.say(channel, `https://www.twitch.tv/teatimewithruna https://twitter.com/runsachan`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!noma':
      client.say(channel, `https://www.twitch.tv/vtubermissnoma https://twitter.com/MissNomaVT`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!sara':
      client.say(channel, `https://www.twitch.tv/sarachariotvt https://twitter.com/serendipity9169 `)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!seele':
      client.say(channel, `https://www.twitch.tv/seelemonochrome https://twitter.com/MonochromeSeele`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!sen':
      client.say(channel, `https://www.twitch.tv/sen_seiyin https://twitter.com/Sen_Seiyin`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!shizuka':
      client.say(channel, `https://www.twitch.tv/shizukach https://twitter.com/Shizuka_Ch`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!shroom':
      client.say(channel, `https://www.twitch.tv/ShroompaiVT https://twitter.com/ShroompaiVT`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!sir':
      client.say(channel, `https://www.twitch.tv/sirstebe https://twitter.com/SirStebe`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!takemi':
      client.say(channel, `https://www.twitch.tv/takemi_hamazaki https://twitter.com/ProjectTakemi`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!toma':
      client.say(channel, `https://twitch.tv/tomaberu https://twitter.com/berutoma`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!vio':
      client.say(channel, `https://www.twitch.tv/viovt https://twitter.com/xVioChan`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!xai':
      client.say(channel, `https://www.twitch.tv/xai_ice https://twitter.com/xai_ice`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!yashu':
      client.say(channel, `https://www.twitch.tv/ya5hu https://twitter.com/shubewbz `)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!zelduh':
      client.say(channel, `https://www.twitch.tv/izelduh https://twitter.com/iZelduh`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!zoid':
      client.say(channel, `Don't talk about dad FeelsBadMan`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
    case '!bravebear':
      client.say(channel, `Join us on Discord: discord.bravebearstudios.com\nLearn more about us: https://bravebearstudios.com`)
      colorLog(`* shouted out ${commandName[0].toLowerCase()}`, `info`)
      break
  }
}

function onDisconnectHandler(reason) {
  colorLog(`! disconnected : ${reason}`, `warning`)
  // client.connect()
  //   .then((data) => {
  //     // data returns [server, port]
  //     colorLog(`* Connected to ${server}:${port}`, 'info')
  //   }).catch((err) => {
  //     colorLog(`!!! Failed to connect : ${err}`, 'error')
  //   });
}

function onBanHandler(channel, username, reason, userstate) {
  //TODO: ignore self bans
  if (allowlist.includes(username) || opts.channels.includes(username)) {
    colorLog(`! allowlist account banned : ignoring`, `warning`)
    return
  }
  colorLog(`* Saw ${username} banned in ${channel.replace("#", "")}`, 'info')
  //write to database
  // try {
  //   con.connect(function (err) {
  //     if (err) {
  //       colorLog(`!!! ${err}`,`error`);
  //       return
  //     }
  //     colorLog("* dB connected", `info`);
  //   })
  //   var data = con.promise().query(`select * from ${process.env.DB_BotListTable} where ban_username = '${username}'`)
  //   if (data && data.count > 0) {
  //     colorLog(`* logging new user into ${process.env.DB_BanListTable}`, `info`)
  //     con.promise().query(`insert into ${process.env.DB_BanListTable} values ('${channel.replace("#", "")}','${username}','${(new Date().toISOString().split('T')[0])}')`)
  //   } else {
  //     colorLog(`* didn't add user to db, already exists on bot list`, `info`)
  //   }
  // } catch (err) {
  //   colorLog(`!!! failed to write to database : \n${err}\n==========`, `error`)
  //   return
  // }
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  colorLog(`* Connected to ${addr}:${port}`, 'info')
}

function onRaidedHandler(channel, username, viewers) {
  colorLog(`* @ ${getTimeStamp("US/Eastern")} : ${channel.replace("#", "")} raided by ${username} with ${viewers} viewers`, `info`)
}

function onHostedHandler(channel, username, viewers, autohost) {
  if (autohost) {
    colorLog(`* @ ${getTimeStamp("US/Eastern")} : ${channel.replace("#", "")} auto-hosted by ${username} with ${viewers} viewers`, `info`)
  } else {
    colorLog(`* @ ${getTimeStamp("US/Eastern")} : ${channel.replace("#", "")} hosted by ${username} with ${viewers} viewers`, `info`)
  }
}

function onHostingHandler(channel, target, viewers) {
  colorLog(`* @ ${getTimeStamp("US/Eastern")} : ${channel.replace("#", "")} hosting ${target} with ${viewers} viewers`, `info`)
}

function onCheerHandler(channel, userstate, message) {
  colorLog(`* @ ${getTimeStamp("US/Eastern")} : ${channel.replace("#", "")} was cheered to with message :  ${message}`, `info`)
}

function onSubscriptionHandler(channel, username, method, message, userstate) {
  colorLog(`* @ ${getTimeStamp("US/Eastern")} : ${channel.replace("#", "")} was subscribed to by ${username} with message : ${message}`, `info`)
}

function onSubgiftHandler(channel, username, streakMonths, recipient, methods, userstate) {
  let senderCount = ~~userstate["msg-param-sender-count"];
  colorLog(`* @ ${getTimeStamp("US/Eastern")} : [Month streak: ${streakMonths}] ${username} gifed subscription to ${recipient} on ${channel.replace("#", "")}`, `info`)
}

function onAnonSubGift(channel, username, numbOfSubs, methods, userstate) {
  let senderCount = ~~userstate["msg-param-sender-count"];
  colorLog(`* @ ${getTimeStamp("US/Eastern")} : ANON : ${username} gifed ${numbOfSubs} subscriptions to ${channel.replace("#", "")}`, `info`)
}

function onFollowersOnly(channel, enabled, length) {
  if (enabled) {
    colorLog(`! @ ${getTimeStamp("US/Eastern")} : ${channel.replace("#", "")} turned on follower only mode - can't interact`, `warning`)
  } else {
    colorLog(`* @ ${getTimeStamp("US/Eastern")} : ${channel.replace("#", "")} turned off follower only mode`, `info`)
  }
}

function onRoomstateHandler(channel, state) {
  colorLog(`* joined room for ${channel} with state ${JSON.stringify(state)}`, `info`)
  if (state["followers-only"] != false) {
    colorLog(`! ${channel} in follower only mode - service may be degraded`, `warning`)
  }
  if (state["subs-only"] != false) {
    colorLog(`! ${channel} in sub only mode - service may be degraded`, `warning`)
  }
  bdayHTable[channel] = true
}

//main program
var client
var banlist = []
var modList = {}
let allowlist = ['bravebearbot', 'moobot', 'nightbot', 'streamlabs', 'streamelements'] //,'zoid__', 'bravebearbot', 'TomaBeru', 'yashuch', 'shroompaivt', 'shizukach', 'aristeiapacificator', 'takemi_hamazaki', 'LilacsWrath', 'HoshiKusa', 'lapismanplaysmc', 'sarachariotvt', 'lemxnslush', 'fraisechu', 'xai_ice'] //accounts to ignore on bans
let bdayCooldownInSeconds = 30
var canHappyBirthday = true
var bdayHTable = {}
main();
// setInterval(() => {
//   main();
// }, process.env.TIME_RUN_OCCURANCE);