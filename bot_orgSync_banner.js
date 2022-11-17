#!/usr/bin/env node

// read in env settings
require('dotenv').config();

const tmi = require('tmi.js');
const fetch = require('./bin/fetch');
const auth = require('./bin/auth');
var fs = require('fs');
var util = require('util');
const { command } = require('yargs');
var mysql = require('mysql2')
const req = require('request')
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
var log_file = fs.createWriteStream(__dirname + '/logs/debug_orgSync_banner.log', { flags: 'a' });
log_file.write(`============================== New logs starting ${getTimeStamp(`US/Eastern`)}==============================\r\n`)

// Define configuration options
const opts = {
  //options: { debug: true, messagesLogLevel: "info" },
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

async function getBanList_DB() {
  var newList = []

  con.query(`select ban_username from ${process.env.DB_BotListTable}`, function (err, result, fields) {
    if (err) colorLog(`!!! query failed because: ${err}`, `error`);
    result.forEach((record) => {
      //console.log(`username: ${record.ban_username}`)
      newList.push(record.ban_username)
    })
  })

  con.query(`select ban_username from ${process.env.DB_BanListTable}`, function (err, result, fields) {
    if (err) colorLog(`!!! query failed because: ${err}`, `error`);
    result.forEach((record) => {
      //console.log(`username: ${record.ban_username}`)
      newList.push(record.ban_username)
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
//pull data from excel sheet
//process data to get a list of usernames
async function getBanList() {
  try {
    const authResponse = await auth.getToken(auth.tokenRequest);
    const rows = await fetch.callApi(auth.apiConfig.uri + process.env.API_VERSION + '/groups/' + process.env.GROUP_ID + '/drive/items/' + process.env.FILE_ID + '/workbook/tables/' + process.env.BANLIST_TABLE_ID + '/rows', authResponse.accessToken, "get");
    //go through each row
    const bannedNames = [];
    rows.value.forEach(element => {
      element.values.forEach(row => {
        //colorLog('* Adding ' + row[1] + ' to ban list. Reported by ' + row[0], 'info')
        if (!bannedNames.includes(row[1])) {
          bannedNames.push(row[1].toString().replace(" ", ""))
        } else {
          //colorLog("! Duplicate entry for " + row[1], 'warning')
        }
      }
      )
    }
    )
    //colorLog(`* finished pulling ban list with ${bannedNames.count} entries`,`info`)
    //console.log(bannedNames)
    return Array.from(bannedNames)
  } catch (error) {
    colorLog(`!!! failed to pull bans from Graph : ${error}`, 'error');
  }
}

function setTerminalTitle(title) {
  process.stdout.write(
    String.fromCharCode(27) + "]0;" + title + String.fromCharCode(7)
  );
}

//ban users from all managed chats
// async function banFromList(list) {
//   if (!Array.isArray(list)) {
//     colorLog("!!! banlist was not an array", 'error')
//     return
//   }
//   var promise = Promise.resolve();
//   opts.channels.forEach(function (channel) {
//     promise = promise.then(function () {
//       setTerminalTitle(`${getTimeStamp(`US/Eastern`)} : Starting to process ${channel}`)
//       if (channel.replace("#", "") == opts.identity.username || client.isMod(channel, opts.identity.username)) {
//         colorLog(`* ${opts.identity.username} is a moderator - enforcing bans on ${channel.replace("#", "")}`, `success`);
//         count = 0;
//         list.forEach(function (username) {
//           count++
//           //colorLog(`* Processing ${count} of ${list.length}...`, `info`)
//           promise = promise.then(function () {
//             if (allowlist.includes(username) || opts.channels.includes(username)) {
//               colorLog(`! allowlist account found on ban list : ${username} : skipping`, `warning`)
//               return
//             }
//             client.ban(channel, username, "found on Brave Bear organization sync list")
//               .then((data) => {
//                 // data returns [channel, username, reason]
//                 colorLog("* Banned " + username + " from " + channel.replace("#", ""), 'success')
//               }).catch((err) => {
//                 if (err == "already_banned") {
//                   colorLog("* Can't ban "+username+ " from " + channel.replace("#", "") +" - already banned","info")
//                 }
//                 else if (err == "invalid_user") {
//                   var errorBansFile = fs.createWriteStream(__dirname + '/logs/invalidUsers.log', { flags: 'a' });
//                   errorBansFile.write(`${username}\r\n`)
//                   errorBansFile.close()
//                 }
//                 else if (err == "No response from Twitch") {
//                   client.reconnect()
//                     .then(() => {
//                       client.ban(channel, username, "found on Brave Bear organization sync list")
//                     })
//                 } else {
//                   colorLog("!!! Couldn't ban " + username + " on " + channel.replace("#", "") + " because " + err, 'error')
//                 }
//               });
//             return new Promise(function (resolve) {
//               setTimeout(resolve, process.env.TIME_BETWEEN_BANS)
//             })
//           })
//         })
//       } else {
//         colorLog(`! ${opts.identity.username} not a moderator - can't enforce bans on ${channel.replace("#", "")}`, `warning`)
//         return
//       }
//       // return new Promise(function (resolve) {
//       //   setTimeout(resolve, process.env.TIME_BETWEEN_CHANNELS)
//       // })
//     })
//   })
// }

async function banFromList_new(list) {
  if (!Array.isArray(list)) {
    colorLog("!!! banlist was not an array", 'error')
    return
  }
  var promise = Promise.resolve();
  list.forEach(username => {
    if (client.readyState() != 'OPEN') {
      colorLog(`!!! client not in OPEN ready state`, `error`)
      return
    }
    if (allowlist.includes(username) || opts.channels.includes(username)) {
      colorLog(`! allowlist account found on ban list : ${username} : skipping`, `warning`)
      return
    }
    promise = promise.then(function () {
      opts.channels.forEach(channel => {
        promise = promise.then(function () {
          if (wentLive.includes(channel.replace("#", ""))) {
            colorLog(`! skipping ${channel.replace("#", "")} - found on went live list`, `warning`)
            return
          }
          else if (getLive(channel)) {
            colorLog(`! found ${channel.replace("#", "")} live while processing bans - kicking out of sync run`, `warning`)
            const ind = opts.channels.indexOf(channel)
            if (ind > -1) {
              opts.channels.splice(ind, 1)
            }
            return
          } else {
            colorLog(`* found ${channel.replace("#", "")} offline - continuing`, `info`)
          }
          if (channel.replace("#", "") == opts.identity.username || client.isMod(channel, opts.identity.username)) {
            client.ban(channel, username, "found on Brave Bear known bot list")
              .then((data) => {
                // data returns [channel, username, reason]
                colorLog("* Banned " + username + " from " + channel.replace("#", ""), 'success')
              }).catch((err) => {
                if (err == "already_banned") {
                  colorLog("* Can't ban " + username + " from " + channel.replace("#", "") + " - already banned", "info")
                }
                else if (err == "invalid_user") {
                  var errorBansFile = fs.createWriteStream(__dirname + '/logs/invalidUsers.log', { flags: 'a' });
                  errorBansFile.write(`${username}\r\n`)
                  errorBansFile.close()
                  try {
                    colorLog(`* attempting to remove invalid user (${username}) from DB`, `info`)
                    con.query(`delete from ${process.env.DB_BotListTable} where ban_username='${username}'`)
                    colorLog(`* remove invalid user (${username}) from DB`, `success`)
                  } catch (err) {
                    colorLog(`!!! failed to remove invalid user from DB because\n${err}\n==========`, `error`)
                  }
                }
                else if (err == "No response from Twitch") {
                  client.reconnect()
                    .then(() => {
                      client.ban(channel, username, "found on Brave Bear known bot list")
                    })
                } else {
                  colorLog("!!! Couldn't ban " + username + " on " + channel.replace("#", "") + " because " + err, 'error')
                }
              });
            return new Promise(function (resolve) {
              setTimeout(resolve, process.env.TIME_BETWEEN_BANS)
            })
          } else {
            colorLog(`! ${opts.identity.username} not a moderator - can't enforce bans on ${channel.replace("#", "")}`, `warning`)
            return
          }
        });
      })
    });
  })
  colorLog(`* finished processing usernames to ban`, `info`)
  stillRunning = false
}

const getToken = (url, callback) => {
  const options = {
    url: process.env.GET_TOKEN,
    json: true,
    body: {
      client_id: process.env.BOT_ClientID,
      client_secret: process.env.BOT_Secret,
      grant_type: 'client_credentials'
    }
  }
  req.post(options, (err, res, body) => {
    if (err) {
      return console.log(err)
    }
    callback(res);
  })
}

function getLive(chan) {
  if (!authToken || authToken == '') {
    getToken(process.env.GET_TOKEN, (res) => {
      authToken = res.body.access_token
      return authToken
    })
  } else {
    colorLog(`* found api auth token for getLive`, `info`)
  }
  setTimeout(() => {
    const userOpts = {
      url: `https://api.twitch.tv/helix/streams?user_login=${chan}`,
      method: 'GET',
      json: true,
      headers: {
        'Client-ID': process.env.BOT_ClientID,
        'Authorization': 'Bearer ' + authToken,
      }
    }
    req.get(userOpts, (err, res, body) => {
      if (err) {
        return colorLog(`!!! ${err} checking if channel is live`, `error`)
      }
      if (body.err) {
        return colorLog(`!!! ${body.err} checking if channel is live : ${body.message}`, `error`)
      }
      //console.log(body)
      if (body.data) {
        if (body.data.length > 0) {
          colorLog(`* ${chan} is online`, `info`)
          if (!wentLive.includes(chan)) {
            wentLive += chan
          }
          return true
        } else {
          colorLog(`* ${chan} is offline`, `info`)
          try {
            wentLive.splice(chan, 1)
          } catch { }
          return false
        }
      }
    })
  }, 5000);
}

async function main() {
  stillRunning = true
  wentLive = []
  setTerminalTitle("Ban Sync")
  try {
    con.on('error', (err) => {
      colorLog(`!!! db connection found error\n${err}\n==========`, `error`)
    })
    //get twitch auth token
    getToken(process.env.GET_TOKEN, (res) => {
      authToken = res.body.access_token
      return authToken
    })
    if (con.state === 'disconnected') {
      con.connect(function (err) {
        if (err) colorLog(`!!! db connect failed because: ${err}`, `error`);
        colorLog("* DB connected!", `info`);
      })
    }
    //get all managed users from db
    var data = await con.promise().query(`SELECT * FROM ${process.env.DB_UserListTable}`)
    data[0].forEach((record) => {
      //console.log(`username: ${record.managed_user_name}`)
      //check if coverage is still valid
      if (!allowlist.includes(record.managed_user_name)) {
        allowlist.push(record.managed_user_name)
      }
      if (new Date() <= new Date(record.coverage_ends)) {
        //console.log(`* date was ${new Date(record.coverage_ends)}`)
        //query twitch api for if channel is live
        //if not live, mark channel as being in the managed ban list
        if (!getLive(record.managed_user_name)) {
          opts.channels.push(record.managed_user_name)
        }
      } else {
        console.log("! " + record.managed_user_name + " no longer has coverage")
      }
    })
    data = await con.promise().query(`select ban_username from ${process.env.DB_BanListTable}`)
    data[0].forEach((record) => {
      //colorLog(`* added to banlist: ${record.ban_username}`,`info`)
      banlist.push(record.ban_username)
    })
    // colorLog(`* pulled back ban list with ${banlist.count} entries`,`info`)
    // colorLog(`* pulled back managed accounts list with ${opts.channels.count} entries`,`info`)
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
    client.on('disconnected', onDisconnectHandler);
    // Connect to Twitch
    await client.connect();
    //await banFromList(await getBanList())//await banFromList(banlist);
    await banFromList_new(banlist)
    getNextRunTime()
    //con.end()
  } catch (err) {
    colorLog(`!!! error in the main call\n${err}\n==========`, `error`)
    return
  } finally {
    //con.destroy()
  }
}

function getNextRunTime() {
  var dt = new Date()
  dt.setHours(dt.getHours() + (process.env.TIME_RUN_OCCURANCE / 3600000))
  colorLog("* Starting next run:\t" + dt, 'info')
}

function onDisconnectHandler(reason) {
  colorLog(`! disconnected : ${reason}`, `warning`)
  return
  client.connect()
    .then((data) => {
      // data returns [server, port]
      colorLog(`* Connected to ${server}:${port}`, 'info')
    }).catch((err) => {
      colorLog(`!!! Failed to connect : ${err}`, 'error')
    });
}

//main program
var client
var authToken = ''
var banlist = []
var wentLive = []
let allowlist = ['bravebearbot', 'moobot', 'nightbot', 'streamlabs', 'streamelements'] //,'zoid__', 'bravebearbot', 'TomaBeru', 'yashuch', 'shroompaivt', 'shizukach', 'aristeiapacificator', 'takemi_hamazaki', 'LilacsWrath', 'HoshiKusa', 'lapismanplaysmc', 'sarachariotvt', 'lemxnslush', 'fraisechu', 'xai_ice'] //accounts to ignore on bans
var stillRunning = false
main();
setInterval(() => {
  if (!stillRunning) {
    main();
  }
}, process.env.TIME_RUN_OCCURANCE);

setInterval(() => {
  // wentLive = []
  colorLog(`* checking what channels are live`, `info`)
  opts.channels.forEach(channel => {
    getLive(channel)
  })
  colorLog(`* new live list is ${wentLive.toString()}`, `info`)
}, 1000 * 60 * 5);