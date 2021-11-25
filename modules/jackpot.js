module.exports = function () {
  async function startJackpot(message, gameID) {
    var pickwinner = [];
    var winner = "";

    var theJackpot = await jackpot.findOne({
      where: { type: "low", gameId: gameID },
    });

    const firstId = await jackpotgame.findOne({
      order: [["configId", "ASC"]],
      limit: 1,
    });

    const lastId = await jackpotgame.findOne({
      order: [["configId", "DESC"]],
      limit: 1,
    });

    for (var i = firstId.configId; i < lastId.configId; i++) {
      var usr = await jackpotgame.findOne({
        where: {
          configId: i,
        },
      });
      for (var x = 0; x < (usr.bid / theJackpot.pool) * 10000; x++) {
        pickwinner.push(`${usr?.userID || "1"}`);
      }
    }
    winner = pickwinner[Math.floor(Math.random() * pickwinner.length)];

    var usr = await jackpotgame.findOne({
      where: {
        userID: winner,
      },
    });

    var user = await users.findOne({
      where: {
        userID: winner,
      },
    });

    message.channel
      .send({
        embeds: [
          new MessageEmbed()
            .setColor("#D7BE69")
            .setTitle(`JackPota Wyniki`)
            .setThumbnail(
              gifs.jackpotwinimg[
                Math.floor(Math.random() * gifs.jackpotwinimg.length)
              ]
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
      await users.update(
        { biggestwin: theJackpot.pool - usr.bid },
        { where: { userID: winner } }
      );
    }

    if (user.luckiestwin > (usr.bid / theJackpot.pool) * 100) {
      await users.update(
        { luckiestwin: ((usr.bid / theJackpot.pool) * 100).toFixed(2) },
        { where: { userID: winner } }
      );
    }

    await users.increment(
      {
        money: +theJackpot.pool,
        wins: +1,
      },
      { where: { userID: winner || "" } }
    );

    await jackpotgame.destroy({ where: { gameId: gameID, type: "low" } });

    await theJackpot.update(
      {
        ended: true,
      },
      { where: { gameId: gameID, type: "low" } }
    );
  }
};
