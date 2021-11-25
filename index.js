const { Client, Intents, MessageEmbed, Permissions } = require("discord.js");
const db = require("./database/db");
const users = require("./database/users");
const jackpot = require("./database/jackpot");
const jackpotgame = require("./database/jackpotgames");
const lotto = require("./database/lotto");
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

var {
  jackpotwinimg,
  hackedgifs,
  nothacked,
  freegifs,
  bwords,
} = require("./modules/variables.js");
const { prefix, token } = require("./config.json");

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  db.authenticate()
    .then(() => {
      console.log("Logged in to DB!");

      users.init(db);
      users.sync();

      jackpot.init(db);
      jackpot.sync();

      jackpotgame.init(db);
      jackpotgame.sync();

      lotto.init(db);
      lotto.sync();
    })
    .catch((err) => console.log(err));

  setInterval(async () => {
    var richestUser = await users
      .findAll({
        order: [["money", "DESC"]],
        limit: 1,
      })
      .catch((error) => console.log(error));

    Promise.resolve(client.users.fetch(richestUser[0].userID)).then(function (
      value
    ) {
      client.user.setActivity(`👑Top 1: ${value.username}`, {
        type: "PLAYING",
      });
    });
  }, 3000);
});

var seconds = 0;
setInterval(function () {
  seconds++;
}, 1000);

function secondsToHms(d) {
  d = Number(d);
  var days = Math.floor(d / 3600 / 24);
  var h = Math.floor((d / 3600) % 60);
  var m = Math.floor((d % 3600) / 60);

  var dDisplay = days > 0 ? days + "d " : "0d ";
  var hDisplay = h > 0 ? h + "h " : "0h ";
  var mDisplay = m > 0 ? m + (m == 1 ? "m" : "m") : "0m";
  return dDisplay + hDisplay + mDisplay;
}

function generateRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

async function startJackpot(message, gameID) {
  var pickwinner = [];
  var winner = "";

  var theJackpot = await jackpot
    .findOne({
      where: { type: "low", gameId: gameID },
    })
    .catch((error) => console.log(error));

  const firstId = await jackpotgame
    .findOne({
      order: [["configId", "ASC"]],
      limit: 1,
    })
    .catch((error) => console.log(error));

  const lastId = await jackpotgame
    .findOne({
      order: [["configId", "DESC"]],
      limit: 1,
    })
    .catch((error) => console.log(error));

  for (var i = firstId.configId; i < lastId.configId; i++) {
    var usr = await jackpotgame
      .findOne({
        where: {
          configId: i,
        },
      })
      .catch((error) => console.log(error));
    for (var x = 0; x < (usr?.bid / theJackpot?.pool) * 10000; x++) {
      pickwinner.push(`${usr?.userID || "1"}`);
    }
  }
  winner = pickwinner[Math.floor(Math.random() * pickwinner.length)];

  var usr = await jackpotgame
    .findOne({
      where: {
        userID: winner,
      },
    })
    .catch((error) => console.log(error));

  var user = await users
    .findOne({
      where: {
        userID: winner,
      },
    })
    .catch((error) => console.log(error));

  message.channel
    .send({
      embeds: [
        new MessageEmbed()
          .setColor("#D7BE69")
          .setTitle(`JackPota Wyniki`)
          .setThumbnail(
            jackpotwinimg[Math.floor(Math.random() * jackpotwinimg.length)]
          )
          .setDescription(
            `▸ **Pula:** ${theJackpot.pool} RC\n▸ **Graczy:** ${
              theJackpot.users
            }\n▸ **Wygrał:** <@${winner}>\n▸ **Procent:** ${(
              (usr.bid / theJackpot.pool) *
              100
            ).toFixed(2)}%`
          )
          .setFooter(
            `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
              seconds
            )})`,
            `${client.user.displayAvatarURL()}`
          ),
      ],
    })
    .catch((error) => console.log(`Error while sending victory message`));

  console.log(`USER BIGGEST WIN: ${user.wins}\nUserID: ${winner}`);

  if (user.biggestwin < theJackpot.pool - usr.bid) {
    console.log("OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO USERBIGGESTWIN");
    await users
      .update(
        {
          jpbiggestwinsum: theJackpot.pool - usr.bid,
          jpluckiestwinpercent: (usr.bid / theJackpot.pool) * 100,
        },
        { where: { userID: winner } }
      )
      .catch((error) => console.log(error));
  }

  console.log(
    `user luckiestwin: ${user.jpluckiestwinpercent}  user now: ${
      (usr.bid / theJackpot.pool) * 100
    }`
  );
  if (
    user.jpluckiestwinpercent == 0 ||
    user.jpluckiestwinpercent > (usr.bid / theJackpot.pool) * 100
  ) {
    await users
      .update(
        {
          jpluckiestwinpercent: ((usr.bid / theJackpot.pool) * 100).toFixed(2),
        },
        { where: { userID: winner } }
      )
      .catch((error) => console.log(error));
  }

  console.log(
    `user biggestwin: ${user.jpbiggestwinsum}  user now: ${
      theJackpot.pool - usr.bid
    }`
  );
  if (user.jpbiggestwinsum > theJackpot.pool - usr.bid) {
    await users
      .update(
        {
          jpbiggestwinsum: (theJackpot.pool - usr.bid).toFixed(2),
          jpluckiestwinpercent: ((usr.bid / theJackpot.pool) * 100).toFixed(2),
        },
        { where: { userID: winner } }
      )
      .catch((error) => console.log(error));
  }

  await users
    .increment(
      {
        money: +theJackpot.pool,
        jpwins: +1,
        jpwinssum: +theJackpot.pool,
      },
      { where: { userID: winner || "" } }
    )
    .catch((error) => console.log(error));

  await jackpotgame
    .destroy({ where: { gameId: gameID, type: "low" } })
    .catch((error) => console.log(error));

  await theJackpot
    .update(
      {
        ended: true,
      },
      { where: { gameId: gameID, type: "low" } }
    )
    .catch((error) => console.log(error));
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return 0;

  if (message.guild.id != "484749110314926121") {
    return message.channel.send({
      embeds: [
        new MessageEmbed()
          .setColor("RED")
          .setTitle(`Ten serwer nie ma permisji do używania tego bota!`)
          .setThumbnail(client.user.displayAvatarURL())
          .setDescription(
            `Nasze serwery:\n► https://discord.gg/eg2QWmHPSw (RichCraft)\n ► https://discord.gg/yQ7mrzjxee (RichLife)`
          )
          .setFooter(
            `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
              seconds
            )})`,
            `${client.user.displayAvatarURL()}`
          ),
      ],
    });
  }

  if (message.content.startsWith("-")) {
    return setTimeout(() => {
      message.delete().catch((error) => console.log(error));
    }, 10000);
  }

  if (
    (message.channel.parent.id != "903036836379787266" &&
      message.channel.type != "dm") ||
    message.author.id == "802216586605625384"
  ) {
    return 0;
  }
  if (message.channel.id != "904710314849861662") {
    message
      .delete()
      .catch((error) => console.log(`error while deleting message: ${error}`));
  }

  const activity = `${message.member.presence?.activities[0]?.state || ""}`;

  var userAccount = await users
    .findOne({
      where: {
        userID: message.author.id,
      },
    })
    .catch((error) => console.log(error));

  switch (message.channel.name) {
    case "📊głosowania":
      message.react("👍");
      message.react("👎");
      break;

    case "📀rzut-monetą":
      if (!userAccount) {
        userAccount = await users.create({
          userID: message.author.id,
          userName: message.author.username,
          money: 10,
        });
      }

      var content = message.content.toLocaleLowerCase().split(" ");
      if (
        !content[1] ||
        userAccount.money < parseInt(content[1]) ||
        (content[0] != "orzeł" && content[0] != "reszka") ||
        content[1] < 1
      ) {
        return message.author
          .send({
            embeds: [
              new MessageEmbed()
                .setColor("RED")
                .setTitle(`Wystąpił błąd podczas próby gry w "rzut monetą"`)
                .setThumbnail(
                  `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png?size=256`
                )
                .setDescription(
                  `Upewnij się, że masz wystarczająco pieniędzy (**${userAccount.money} RC**) oraz, że trzymasz się poniższego schematu:\n**<orzeł/reszka> <kwota>**`
                )
                .setFooter(
                  `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                    seconds
                  )})`,
                  `${client.user.displayAvatarURL()}`
                ),
            ],
          })
          .catch((error) =>
            console.log(
              `Error while sending a private message to ${message.author.tag} : ${error}`
            )
          );
      }
      var percent = Math.floor(Math.random() * 101);
      if (percent > 49) {
        if (userAccount.coinbiggestwin < parseInt(Math.round(content[1])) * 2) {
          await users
            .update(
              { coinbiggestwin: parseInt(Math.round(content[1])) * 2 },
              { where: { userID: message.author.id } }
            )
            .catch((error) => console.log(error));
        }
        await users
          .increment(
            {
              money: +parseInt(Math.round(content[1]) || 0),
              coinsdep: -parseInt(Math.round(content[1]) || 0),
              coinswin: +1,
              coinsprofit: +parseInt(Math.round(content[1]) || 0 * 2),
              coinsgames: +1,
            },
            { where: { userID: message.author.id } }
          )
          .catch((error) => console.log(error));
        return message.channel.send({
          embeds: [
            new MessageEmbed()
              .setColor("GREEN")
              .setTitle(`${message.author.username} - Wygrałeś!`)
              .setThumbnail(
                `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png?size=256`
              )
              .setDescription(
                `Wypadła **${content[0]}** i wygrywasz **${Math.round(
                  content[1] * 2
                )} RC**`
              )
              .setFooter(
                `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                  seconds
                )})`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        });
      } else {
        if (userAccount.coinbiggestloose < content[1]) {
          await users
            .update(
              { coinbiggestloose: parseInt(Math.round(content[1])) },
              { where: { userID: message.author.id } }
            )
            .catch((error) => console.log(error));
        }
        await users
          .increment(
            {
              money: activity.toLowerCase().includes("richcraft.pl")
                ? -parseInt(Math.round(content[1])) * 0.9
                : -parseInt(Math.round(content[1])),
              coinsdep: -parseInt(Math.round(content[1])),
              coinsprofit: -parseInt(Math.round(content[1])),
              coinsgames: +1,
            },
            { where: { userID: message.author.id } }
          )
          .catch((error) => console.log(error));

        bwords.forEach((w) => (activity.includes(w) ? (x = true) : ""));

        return message.channel.send({
          embeds: [
            new MessageEmbed()
              .setColor("RED")
              .setTitle(`${message.author.username} - Przegrałeś :(`)
              .setThumbnail(
                `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png?size=256`
              )
              .setDescription(
                `Wypadła ${
                  content[0] == "reszka" ? "**orzeł**" : "**reszka**"
                }\nTracisz **${Math.round(content[1])} RC**\n${
                  activity.toLowerCase().includes("richcraft.pl")
                    ? `Cashback: **10%** (${
                        parseInt(content[1]) * 0.1
                      }RC) za status **${activity}**`
                    : ""
                }`
              )
              .setFooter(
                `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                  seconds
                )})`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        });
      }
      break;

    case "📈jackpot-lite":
      var bid = parseInt(message?.content) || 0;
      if (!isNaN(bid) && bid > 0) {
        var userAccount = await users
          .findOne({
            where: {
              userID: message.author.id,
            },
          })
          .catch((error) => console.log(error));

        if (!userAccount || userAccount.money < bid) {
          if (!userAccount) {
            var error =
              "Nie udało się dołączyć z powodu braku użytkownika w bazie danych - napisz !account";
          } else {
            var error = `Nie udało się dołączyć z powodu niewystarczających środków na końcie\n\n▸ **Balans:** ${userAccount.money} RC`;
          }
          return message.author
            .send({
              embeds: [
                new MessageEmbed()
                  .setColor("RED")
                  .setTitle(`Wystąpił błąd podczas dołączania na jackpota`)
                  .setThumbnail(
                    `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png?size=256`
                  )
                  .setDescription(`${error}`)
                  .setFooter(
                    `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                      seconds
                    )})`,
                    `${client.user.displayAvatarURL()}`
                  ),
              ],
            })
            .catch((error) =>
              console.log(
                `Error while sending a private message to ${message.author.tag} : ${error}`
              )
            );
        }

        var jackpotcreateGame = await jackpot
          .findOne({
            where: {
              ended: false,
              type: "low",
            },
          })
          .catch((error) => console.log(error));

        await users
          .increment(
            {
              money: -bid,
              jps: +1,
              jpdep: +bid,
            },
            { where: { userID: message.author.id } }
          )
          .catch((error) => console.log(error));

        if (!jackpotcreateGame) {
          var gameId = Math.floor(10000000 + Math.random() * 90000000);
          jackpotcreateGame = await jackpot
            .create({
              pool: bid,
              type: "low",
              users: 1,
              ended: false,
              gameId: gameId,
            })
            .catch((error) => console.log(error));

          var colour = generateRandomColor();

          var genuser = await jackpotgame
            .create({
              gameId: gameId,
              type: "low",
              bid: bid,
              userID: message.author.id,
              userName: message.author.username,
              color: `${colour}`,
            })
            .catch((error) => console.log(error));

          message.channel
            .send("<@&903258870795890718>")
            .then((message) => {
              message
                .delete()
                .catch((error) =>
                  console.log(`error while deleting message: ${error}`)
                );
            })
            .catch(console.log(`Error while deleting a message`));

          message.channel.send({
            embeds: [
              new MessageEmbed()
                .setColor(`${colour}`)
                .setTitle(
                  `Gracz ${message.author.username} dołączył do jackpotu za ${bid} RC!`
                )
                .setDescription(
                  `▸ **Pula:** ${jackpotcreateGame.pool} RC\n▸ **Graczy:** ${jackpotcreateGame.users}\n\n**Start za**: 60s`
                )
                .addField(
                  `▸ **Szanse:**`,
                  `◽ ${message.author.tag}: 100% (${bid} RC)`,
                  false
                )
                .addField(`▸ Pingi:`, `[<@&903258870795890718>]`, false)
                .setFooter(
                  `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                    seconds
                  )})`,
                  `${client.user.displayAvatarURL()}`
                ),
            ],
          });
          setTimeout(async () => {
            var checkJackpot = await jackpot
              .findOne({
                where: { gameId: jackpotcreateGame.gameId, type: "low" },
              })
              .catch((error) => console.log(error));

            if (checkJackpot.users > 1) {
              startJackpot(message, gameId);
            } else {
              message.channel.send({
                embeds: [
                  new MessageEmbed()
                    .setColor("RED")
                    .setTitle(`Upłynął czas!`)
                    .setDescription(
                      `Zakończyłem jackpota z powodu braku aktywności :(`
                    )
                    .setFooter(
                      `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                        seconds
                      )})`,
                      `${client.user.displayAvatarURL()}`
                    ),
                ],
              });

              await users
                .increment(
                  {
                    money: +bid,
                    jps: -1,
                    jpdep: -bid,
                  },
                  { where: { userID: message.author.id } }
                )
                .catch((error) => console.log(error));

              await jackpotgame
                .destroy({
                  where: { gameId: jackpotcreateGame.gameId, type: "low" },
                })
                .catch((error) => console.log(error));

              return await jackpotcreateGame
                .update(
                  {
                    ended: true,
                  },
                  { where: { gameId: jackpotcreateGame.gameId, type: "low" } }
                )
                .catch((error) => console.log(error));
            }
          }, 60 * 1000);
        } else {
          var findUser = await jackpotgame
            .findOne({
              where: { userID: message.author.id, type: "low" },
            })
            .catch((error) => console.log(error));
          if (!findUser) {
            var findUser = await jackpotgame.create({
              gameId: jackpotcreateGame.gameId,
              type: "low",
              bid: bid,
              userID: message.author.id,
              userName: message.author.username,
              color: `${generateRandomColor()}`,
            });
            await jackpot
              .increment(
                {
                  pool: +bid,
                  users: +1,
                },
                { where: { gameId: jackpotcreateGame.gameId } }
              )
              .catch((error) => console.log(error));
          } else {
            await jackpotgame
              .update(
                {
                  bid: findUser.bid + bid,
                },
                { where: { userID: message.author.id, type: "low" } }
              )
              .catch((error) => console.log(error));
            await jackpot
              .increment(
                {
                  pool: +bid,
                },
                { where: { gameId: jackpotcreateGame.gameId } }
              )
              .catch((error) => console.log(error));
          }

          var jackPotG = await jackpot
            .findOne({
              where: { type: "low", gameId: jackpotcreateGame.gameId },
            })
            .catch((error) => console.log(error));

          const users = await jackpotgame
            .findAll({
              where: { type: "low", gameId: jackpotcreateGame.gameId },
            })
            .catch((error) => console.log(error));

          var userChances = "";

          users.map(
            (user) =>
              (userChances += `◽ ${user.userName}: ${(
                (user.bid / jackPotG.pool) *
                100
              ).toFixed(2)}% (${user.bid} RC)\n`)
          );

          message.channel.send({
            embeds: [
              new MessageEmbed()
                .setColor(findUser.color)
                .setTitle(
                  `Gracz ${message.author.username} dołączył do jackpotu za ${bid} RC!`
                )
                .setDescription(
                  `▸ **Pula:** ${jackPotG.pool} RC\n▸ **Liczba graczy:** ${jackPotG.users}`
                )
                .addField(`▸ **Szanse:**`, `${userChances}`, false)
                .setFooter(
                  `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                    seconds
                  )})`,
                  `${client.user.displayAvatarURL()}`
                ),
            ],
          });
        }
      }
      break;

    case "💣hack":
      const words = [
        "hack",
        "cheat",
        "hakuj",
        "chakuj",
        "chakój",
        "hak",
        "chak",
        "zadupcz",
        "zapierdziel",
        "ukradnij",
      ];

      if (!words.find((v) => message.content.toLowerCase().includes(v))) {
        return 0;
      }

      if (!userAccount) {
        userAccount = await users
          .create({
            userID: message.author.id,
            userName: message.author.username,
            money: 10,
          })
          .catch((error) => console.log(error));
      }

      await users
        .increment(
          {
            hacks: +1,
          },
          { where: { userID: message.author.id } }
        )
        .catch((error) => console.log(error));

      var percent = Math.floor(Math.random() * 101);
      if (percent == 50) {
        var price = Math.floor(Math.random() * (3000 - 100 + 1) + 100);

        message.channel.send({
          embeds: [
            new MessageEmbed()
              .setColor("#ffdd00")
              .setTitle(`${message.author.username} wykradł pieniądze z banku!`)
              .setThumbnail(
                hackedgifs[Math.floor(Math.random() * hackedgifs.length)]
              )
              .setDescription(
                `Użytkownik <@${message.author.id}> użył niezwykle skomplikowanego systemu i pomyślnie udało mu się ominąć zabezpieczenia **RichArmor**, tymsamym wykradł **${price} RC**`
              )
              .setFooter(
                `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                  seconds
                )})`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        });

        return await users
          .increment(
            {
              money: +price,
              hackwins: +1,
              hackprofit: +price,
            },
            { where: { userID: message.author.id } }
          )
          .catch((error) => console.log(error));
      } else {
        message.channel.send({
          embeds: [
            new MessageEmbed()
              .setColor("#fc0303")
              .setTitle(`🔐 System RichArmor wykrył podejrzane zachowanie`)
              .setDescription(
                `Użytkownik <@${message.author.id}> został przyłapany na próbie oszukania systemu **RichArmor**`
              )
              .setThumbnail(
                nothacked[Math.floor(Math.random() * nothacked.length)]
              )
              .setFooter(
                `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                  seconds
                )})`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        });
      }
      break;

    case "🧭darmówka":
      if (userAccount) {
        var x = false;
        bwords.forEach((w) => (activity.includes(w) ? (x = true) : ""));

        if (x == false) {
          message.channel
            .send({
              embeds: [
                new MessageEmbed()
                  .setColor("#1aa5eb")
                  .setTitle(
                    `🎁 Darmowe 10 RC ${
                      activity.toLowerCase().includes("richcraft.pl")
                        ? "(+ 50 RC)"
                        : ""
                    }`
                  )
                  .setDescription(
                    `▸ <@${
                      message.author.id
                    }> właśnie odebrał darmowe **10 RC** ${
                      activity.toLowerCase().includes("richcraft.pl")
                        ? `(**+50 RC** za status **${activity}**)`
                        : ""
                    } ◂`
                  )
                  .setThumbnail(
                    freegifs[Math.floor(Math.random() * freegifs.length)]
                  )
                  .setFooter(
                    `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                      seconds
                    )})`,
                    `${client.user.displayAvatarURL()}`
                  ),
              ],
            })
            .then((message) => {
              setTimeout(
                () =>
                  message
                    .delete()
                    .catch((error) =>
                      console.log(`error while deleting message: ${error}`)
                    ),
                30000
              );
            })
            .catch(console.log(`Error while deleting a message`));

          return await users
            .increment(
              {
                money: activity.toLowerCase().includes("richcraft.pl")
                  ? +50
                  : +10,
                freerecived: +1,
              },
              { where: { userID: message.author.id } }
            )
            .catch((error) => console.log(error));
        } else {
          message.author
            .send({
              embeds: [
                new MessageEmbed()
                  .setColor("RED")
                  .setTitle(`Błąd podczas odbierania darmówki`)
                  .setDescription(
                    `Twój status został oznaczony jako obraźliwy, zmień go aby odebrać darmowe RC.\n\n**Twój status:** ${activity}`
                  )
                  .setFooter(
                    `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                      seconds
                    )})`,
                    `${client.user.displayAvatarURL()}`
                  ),
              ],
            })
            .then((message) => {
              setTimeout(
                () =>
                  message
                    .delete()
                    .catch((error) =>
                      console.log(`error while deleting message: ${error}`)
                    ),
                30000
              );
            })
            .catch(console.log(`Error while deleting a message`));
        }
      }
      break;
  }

  if (!message.content.startsWith(prefix)) return 0;

  const commandBody = message.content.slice(prefix.length).trim();
  const args = commandBody.split(/ +/);
  const commandName = args.shift().toLowerCase();

  switch (commandName) {
    case "startjp":
      if (!args[0] || message.author.id != "304185495624351744") {
        return 0;
      }

      startJackpot(message, args[0]);
      break;
    case "top":
      var allusers = await users
        .findAll({
          order: [["money", "DESC"]],
          limit: 10,
        })
        .catch((error) => console.log(error));

      Promise.resolve(client.users.fetch(allusers[0].userID)).then(function (
        value
      ) {
        let top1 = `https://cdn.discordapp.com/avatars/${value.id}/${value.avatar}.png?size=256`;
        var ussrs = "";

        for (var i = 0; i < allusers.length; i++) {
          ussrs += `${i < 3 ? `**${i + 1}` : `${i + 1}`}. ${
            allusers[i].userName
          } ▸ ${allusers[i].money} RC${i < 3 ? `**` : ""}\n`;
        }

        message.channel
          .send({
            embeds: [
              new MessageEmbed()
                .setColor("#0099ff")
                .setTitle(`Top 10 Bogaczy 🤑`)
                .setDescription(ussrs)
                .setThumbnail(top1)
                .setFooter(
                  `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                    seconds
                  )})`,
                  `${client.user.displayAvatarURL()}`
                ),
            ],
          })
          .then((message) => {
            setTimeout(
              () =>
                message
                  .delete()
                  .catch((error) =>
                    console.log(`error while deleting message: ${error}`)
                  ),
              20000
            );
          });
      });

      break;
    case "konto":
      var user = message.author;
      if (message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
        user = message.mentions.users.first() || message.author;
      }

      var userAccount = await users
        .findOne({
          where: {
            userID: user.id,
          },
        })
        .catch((error) => console.log(error));

      if (!userAccount) {
        userAccount = await users
          .create({
            userID: user.id,
            userName: user.username,
            money: 10,
          })
          .catch((error) => console.log(error));
      }

      if (
        message.member.roles.cache.some((r) => r.id == "911630835642400778")
      ) {
        message.author
          .send({
            embeds: [
              new MessageEmbed()
                .setColor("#0099ff")
                .setTitle(`Konto użytkownika ► ${user.tag}`)
                .setThumbnail(
                  `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
                )
                .addField(
                  `🔸 BALANS 🔸`,
                  `▸ ${userAccount.money} RC\n▸ ${userAccount.pln} PLN`
                )
                .addField("‏", "‏")
                .addFields(
                  {
                    name: "📈 JACKPOT 📈",
                    value: `\n▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n\n▸ **Zagranych:** ${
                      userAccount.jps
                    }\n▸ **Wygrane:** ${userAccount.jpwins} (${
                      userAccount.jpwinssum
                    } RC)\n▸ **Zdepozytowano:** ${
                      userAccount.jpdep
                    } RC\n▸ **Profit:** ${
                      userAccount.jpwins - userAccount.jpdep
                    } RC\n\n▸ **Najszczęśliwsza wygrana:** ${
                      userAccount.jpluckiestwinsum
                    } RC (${
                      userAccount.jpluckiestwinpercent
                    }%)\n▸ **Największa wygrana:** ${
                      userAccount.jpbiggestwinsum
                    } RC (${
                      userAccount.jpbiggestwinpercent
                    }%)\n▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁`,
                    inline: true,
                  },
                  { name: "‏", value: "‏", inline: false },
                  {
                    name: "💠 LOTTO 💠",
                    value: `\n▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n\n▸ **Zagranych:** ${userAccount.lottos}\n▸ **Wygrane:** ${userAccount.lottowins} (${userAccount.lottoprofit} RC)\n▸ **Profit:** ${userAccount.lottoprofit} RC\n\n▸ **Największa wygrana:** ${userAccount.lottobiggestwinsum} RC (${userAccount.lottobiggestwinnums})\n▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁`,
                    inline: false,
                  },
                  { name: "‏", value: "‏", inline: false },
                  {
                    name: "📀 Rzut monetą 📀",
                    value: `\n▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n\n▸ **Zagranych:** ${userAccount.coinsgames}\n▸ **Wygrane:** ${userAccount.coinswin} (${userAccount.coinsprofit} RC)\n▸ **Największa wygrana:** ${userAccount.coinbiggestwin} RC\n▸ **Największa przegrana: ** ${userAccount.coinbiggestloose} RC\n▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁`,
                    inline: false,
                  }
                )
                .addField("‏", "‏")
                .addFields(
                  {
                    name: "♦️ HACK ♦️",
                    value: `▸ **Prób:** ${userAccount.hacks}\n▸ **Udanych ataków:** ${userAccount.hackwins} (${userAccount.hackprofit} RC)`,
                    inline: true,
                  },
                  {
                    name: " ‎ ‎ ‎ ‎ 🎁 Darmówka 🎁",
                    value: `│ ▸ **Zebranych:** ${
                      userAccount.freerecived * 10
                    } RC\n│ ▸ **Giveawaye:** 0 (0 RC)`,
                    inline: true,
                  }
                )
                .setFooter(
                  `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                    seconds
                  )})`,
                  `${client.user.displayAvatarURL()}`
                ),
            ],
          })
          .catch((error) => {
            console.log(error);
          });
      } else {
        message.channel
          .send({
            embeds: [
              new MessageEmbed()
                .setColor("#0099ff")
                .setTitle(`Konto użytkownika ► ${user.tag}`)
                .setThumbnail(
                  `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
                )
                .addField(
                  `🔸 BALANS 🔸`,
                  `▸ ${userAccount.money} RC\n▸ ${userAccount.pln} PLN`
                )
                .addField("‏", "‏")
                .addFields(
                  {
                    name: "📈 JACKPOT 📈",
                    value: `\n▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n\n▸ **Zagranych:** ${
                      userAccount.jps
                    }\n▸ **Wygrane:** ${userAccount.jpwins} (${
                      userAccount.jpwinssum
                    } RC)\n▸ **Zdepozytowano:** ${
                      userAccount.jpdep
                    } RC\n▸ **Profit:** ${
                      userAccount.jpwins - userAccount.jpdep
                    } RC\n\n▸ **Najszczęśliwsza wygrana:** ${
                      userAccount.jpluckiestwinsum
                    } RC (${
                      userAccount.jpluckiestwinpercent
                    }%)\n▸ **Największa wygrana:** ${
                      userAccount.jpbiggestwinsum
                    } RC (${
                      userAccount.jpbiggestwinpercent
                    }%)\n▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁`,
                    inline: true,
                  },
                  { name: "‏", value: "‏", inline: false },
                  {
                    name: "💠 LOTTO 💠",
                    value: `\n▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n\n▸ **Zagranych:** ${userAccount.lottos}\n▸ **Wygrane:** ${userAccount.lottowins} (${userAccount.lottoprofit} RC)\n▸ **Profit:** ${userAccount.lottoprofit} RC\n\n▸ **Największa wygrana:** ${userAccount.lottobiggestwinsum} RC (${userAccount.lottobiggestwinnums})\n▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁`,
                    inline: false,
                  },
                  { name: "‏", value: "‏", inline: false },
                  {
                    name: "📀 Rzut monetą 📀",
                    value: `\n▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n\n▸ **Zagranych:** ${userAccount.coinsgames}\n▸ **Wygrane:** ${userAccount.coinswin} (${userAccount.coinsprofit} RC)\n▸ **Największa wygrana:** ${userAccount.coinbiggestwin} RC\n▸ **Największa przegrana: ** ${userAccount.coinbiggestloose} RC\n▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁`,
                    inline: false,
                  }
                )
                .addField("‏", "‏")
                .addFields(
                  {
                    name: "♦️ HACK ♦️",
                    value: `▸ **Prób:** ${userAccount.hacks}\n▸ **Udanych ataków:** ${userAccount.hackwins} (${userAccount.hackprofit} RC)`,
                    inline: true,
                  },
                  {
                    name: " ‎ ‎ ‎ ‎ 🎁 Darmówka 🎁",
                    value: `│ ▸ **Zebranych:** ${
                      userAccount.freerecived * 10
                    } RC\n│ ▸ **Giveawaye:** 0 (0 RC)`,
                    inline: true,
                  }
                )
                .setFooter(
                  `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                    seconds
                  )})`,
                  `${client.user.displayAvatarURL()}`
                ),
            ],
          })
          .then((message) => {
            setTimeout(
              () =>
                message
                  .delete()
                  .catch((error) =>
                    console.log(`error while deleting message: ${error}`)
                  ),
              30000
            );
          })
          .catch((error) => {
            console.log(error);
          });
      }

      break;

    case "lotto":
      if (message.channel.id == "911696265161613342") {
        if (!userAccount) {
          userAccount = await users
            .create({
              userID: message.author.id,
              userName: message.author.username,
              money: 10,
            })
            .catch((error) => console.log(error));
        }

        var un1 =
          parseInt(args[0]) > 0 && parseInt(args[0]) < 100
            ? (un1 = args[0])
            : Math.floor(Math.random() * (99 - 1) + 1);
        var un2 =
          parseInt(args[1]) > 0 && parseInt(args[1]) < 100
            ? (un2 = args[1])
            : Math.floor(Math.random() * (99 - 1) + 1);
        var un3 =
          parseInt(args[2]) > 0 && parseInt(args[2]) < 100
            ? (un3 = args[2])
            : Math.floor(Math.random() * (99 - 1) + 1);
        var un4 =
          parseInt(args[3]) > 0 && parseInt(args[3]) < 100
            ? (un4 = args[3])
            : Math.floor(Math.random() * (99 - 1) + 1);
        var un5 =
          parseInt(args[4]) > 0 && parseInt(args[4]) < 100
            ? (un5 = args[4])
            : Math.floor(Math.random() * (99 - 1) + 1);
        var un6 =
          parseInt(args[5]) > 0 && parseInt(args[5]) < 100
            ? (un6 = args[5])
            : Math.floor(Math.random() * (99 - 1) + 1);

        if (userAccount.money < 100) {
          return message.author
            .send({
              embeds: [
                new MessageEmbed()
                  .setColor("RED")
                  .setTitle(`❌ BŁĄD PODCZAS ZAKUPU BILETU`)
                  .setThumbnail(
                    `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png?size=256`
                  )
                  .setDescription(
                    `Wystąpił błąd podczas zakupu biletu lotto, upewnij się, że posiadasz wystarczającą ilość środków ( 100 RC ) oraz, że podałeś wszystkie niezbędne dane:\n\n**!lotto <liczba 1> <liczba 2> <liczba 3> <liczba 4> <liczba 5> <liczba 6>**\nPamiętaj, że możesz wybierać liczby tylko w przedziale **1-99**\n\n**Balans:** ${userAccount.money} RC`
                  )
                  .setFooter(
                    `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                      seconds
                    )})`,
                    `${client.user.displayAvatarURL()}`
                  ),
              ],
            })
            .catch(console.log(`Error while sending a message`));
        }

        message.channel.send({
          embeds: [
            new MessageEmbed()
              .setColor("GREEN")
              .setTitle(`Użytkownik ${message.author.tag} kupił bilet lotto 🗳 `)
              .setThumbnail(
                `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png?size=256`
              )
              .setDescription(
                `**▸ Wartość biletu:** 100 RC\n**▸ Wybrane liczby:** **[** ${un1} ${un2} ${un3} ${un4} ${un5} ${un6} **]**`
              )
              .setFooter(
                `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(
                  seconds
                )})`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        });

        await users
          .decrement(
            {
              money: 100,
              lottos: -1,
              lottoprofit: 100,
            },
            {
              where: { userId: message.author.id },
            }
          )
          .catch((error) => console.log(error));

        await lotto
          .create({
            price: 100,
            type: "low",
            num1: un1,
            num2: un2,
            num3: un3,
            num4: un4,
            num5: un5,
            num6: un6,
            userID: message.author.id,
            userName: message.author.tag,
            ended: false,
          })
          .catch((error) => console.log(error));
      }
      break;
  }
});

setInterval(async () => {
  const tickets = await lotto
    .findAll({
      where: { ended: false, type: "low" },
    })
    .catch((error) => console.log(error));

  const lottoUsers = tickets.map((ticket) => ({
    ticketID: ticket.configId,
    price: ticket.price,
    userID: ticket.userID,
    userName: ticket.userName,
    num1: ticket.num1,
    num2: ticket.num2,
    num3: ticket.num3,
    num4: ticket.num4,
    num5: ticket.num5,
    num6: ticket.num6,
  }));

  if (lottoUsers.length < 1) {
    return 0;
  }

  var winnumbers = [];
  var winners = "";
  for (var i = 0; i < 6; i++) {
    winnumbers.push(Math.floor(Math.random() * 99) + 1);
  }

  for (var i = 0; i < lottoUsers.length; i++) {
    var win = 0;
    var x = 0;

    winnumbers.includes(lottoUsers[i].num1) ? x++ : 0;
    winnumbers.includes(lottoUsers[i].num2) ? x++ : 0;
    winnumbers.includes(lottoUsers[i].num3) ? x++ : 0;
    winnumbers.includes(lottoUsers[i].num4) ? x++ : 0;
    winnumbers.includes(lottoUsers[i].num5) ? x++ : 0;
    winnumbers.includes(lottoUsers[i].num6) ? x++ : 0;

    switch (x) {
      case 2:
        win = 500;
        break;
      case 3:
        win = 2000;
        break;
      case 4:
        win = 5000;
        break;
      case 5:
        win = 10000;
        break;
      case 6:
        win = 100000;
        break;
    }

    winners += `▸ <@${lottoUsers[i].userID}> : [${
      winnumbers.includes(lottoUsers[i].num1)
        ? `**${lottoUsers[i].num1}**`
        : lottoUsers[i].num1
    } ${
      winnumbers.includes(lottoUsers[i].num2)
        ? `**${lottoUsers[i].num2}**`
        : lottoUsers[i].num2
    } ${
      winnumbers.includes(lottoUsers[i].num3)
        ? `**${lottoUsers[i].num3}**`
        : lottoUsers[i].num3
    } ${
      winnumbers.includes(lottoUsers[i].num4)
        ? `**${lottoUsers[i].num4}**`
        : lottoUsers[i].num4
    } ${
      winnumbers.includes(lottoUsers[i].num5)
        ? `**${lottoUsers[i].num5}**`
        : lottoUsers[i].num5
    } ${
      winnumbers.includes(lottoUsers[i].num6)
        ? `**${lottoUsers[i].num6}**`
        : lottoUsers[i].num6
    }] - **${win > 0 ? `✅ (${win} RC)` : "❌"}**\n`;

    if (x > 1) {
      var tuser = await users
        .findOne({
          where: { userId: lottoUsers[i].userID },
        })
        .catch((error) => console.log(error));

      if (win > tuser.lottobiggestwinsum) {
        await users.update(
          {
            lottobiggestwinsum: win,
            lottobiggestwinnums: `${
              winnumbers.includes(lottoUsers[i].num1)
                ? `**${lottoUsers[i].num1}**`
                : lottoUsers[i].num1
            } ${
              winnumbers.includes(lottoUsers[i].num2)
                ? `**${lottoUsers[i].num2}**`
                : lottoUsers[i].num2
            } ${
              winnumbers.includes(lottoUsers[i].num3)
                ? `**${lottoUsers[i].num3}**`
                : lottoUsers[i].num3
            } ${
              winnumbers.includes(lottoUsers[i].num4)
                ? `**${lottoUsers[i].num4}**`
                : lottoUsers[i].num4
            } ${
              winnumbers.includes(lottoUsers[i].num5)
                ? `**${lottoUsers[i].num5}**`
                : lottoUsers[i].num5
            } ${
              winnumbers.includes(lottoUsers[i].num6)
                ? `**${lottoUsers[i].num6}**`
                : lottoUsers[i].num6
            }`,
          },
          {
            where: { userId: lottoUsers[i].userID },
          }
        );
      }
      await users
        .increment(
          {
            money: +win,
            lottowins: +1,
            lottoprofit: +win,
          },
          {
            where: { userId: lottoUsers[i].userID },
          }
        )
        .catch((error) => console.log(error));
    }
  }

  client.channels.cache.get("911696265161613342").send({
    embeds: [
      new MessageEmbed()
        .setColor("#f2be22")
        .setTitle(`★ LOTTO - WYNIKI ★`)
        .setDescription(
          `**Wylosowane liczby:** [ ${winnumbers
            .toString()
            .replaceAll(",", " ")} ]\n\n**Gracze:**\n${winners}`
        )
        .setFooter(
          `RichFun - coded by Emsa001#0747 (uptime: ${secondsToHms(seconds)})`,
          `${client.user.displayAvatarURL()}`
        ),
    ],
  });

  await lotto
    .update({ ended: true }, { where: { ended: false, type: "low" } })
    .then(console.log("checking lotto players"))
    .catch((error) => console.log(error));
}, 60 * 1000);

client.login(token);
