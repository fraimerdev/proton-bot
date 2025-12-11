import path from "node:path";
import { Canvas, GlobalFonts, type Image, loadImage } from "@napi-rs/canvas";
import { SHA512_256 } from "bun";
import { AttachmentBuilder, type GuildMember } from "discord.js";
import type { Level } from "#generated/prisma";
import { Config } from "../../../configs/bot";
import prisma from "../../../init/database";
import Logger from "../../../utils/logger";
import { abbrev } from "../../../utils/utils";

export async function getRankCard(member: GuildMember, levelData: Level) {
  const defaultImage = path.join(__dirname, "../../../../assets/rankcard.png");
  const customImage = null;
  const mainColor = Config.color;

  let rank = await prisma.level.count({
    where: {
      guildId: member.guild.id,
      xpTotal: { gt: levelData.xpTotal || 0 },
    },
  });

  rank += 1;

  const canvas = new Canvas(1100, 370);
  const ctx = canvas.getContext("2d");

  ctx.globalAlpha = 0.8;

  const h = canvas.height;
  const w = canvas.width;
  const x = 0;
  const y = 0;
  const r = 50;
  let backgroundImg: Image;

  GlobalFonts.registerFromPath(
    path.join(__dirname, "../../../../assets/fonts/MANROPE_REGULAR.ttf"),
    "Manrope",
  );

  GlobalFonts.registerFromPath(
    path.join(__dirname, "../../../../assets/fonts/MANROPE_BOLD.ttf"),
    "Manrope",
  );

  try {
    backgroundImg = await loadImage(customImage || defaultImage);
  } catch {
    backgroundImg = await loadImage(defaultImage);
  }

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
  ctx.font = "bold 44px Manrope";
  ctx.fillStyle = "white";
  ctx.textAlign = "left";

  ctx.globalAlpha = 1;
  ctx.font = "bold 44px Manrope";
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.fillText(member.nickname || member.user.displayName, 320, 220);
  ctx.font = "44px Manrope";
  ctx.fillStyle = "white";
  ctx.textAlign = "end";
  ctx.fillText(`Level ${levelData.level}`, 1010, 220);
  ctx.font = "44px Manrope";
  ctx.fillStyle = "white";

  const levelWidth =
    1110 -
    ctx.measureText(abbrev(rank)).width -
    7 -
    ctx.measureText(`Rank`).width;
  ctx.fillText(`Rank`, levelWidth, 80);
  ctx.font = "44px Manrope";
  ctx.fillStyle =
    rank === 1
      ? "#FFD700"
      : rank === 2
        ? "#C0C0C0"
        : rank === 3
          ? "#CD7F32"
          : mainColor.toString();
  ctx.textAlign = "right";
  ctx.fillText(abbrev(rank), 950 + ctx.measureText(`Rank`).width - 30, 80);
  const barHeight = 280;
  const barWidth = 50;
  const x_start = 730 + barHeight;
  const x_end = 310;
  const barLength = x_start - x_end;
  ctx.beginPath();
  ctx.lineCap = "round";
  ctx.strokeStyle = "#4d4d4d";
  ctx.lineWidth = barWidth;
  ctx.moveTo(x_start, barHeight);
  ctx.lineTo(x_end, barHeight);
  ctx.stroke();
  ctx.closePath();
  ctx.beginPath();
  ctx.lineWidth = barWidth;
  ctx.moveTo(x_end, barHeight);
  ctx.lineTo(
    x_end + barLength * (levelData.xpCurrent / levelData.xpRequired),
    barHeight,
  );
  ctx.strokeStyle = mainColor.toString();
  ctx.stroke();
  ctx.closePath();
  const xpText = `${Math.floor((levelData.xpCurrent / levelData.xpRequired) * 100)}%`;
  ctx.font = "44px Manrope";
  ctx.fillStyle = "white";
  ctx.textAlign = "right";
  ctx.fillText(xpText, barLength / 2 + x_end, 297);
  ctx.beginPath();
  const logorad = 108;
  ctx.arc(67 + logorad, 83 + logorad, logorad, 0, Math.PI * 2, true);
  ctx.lineWidth = 7;
  ctx.strokeStyle = "white";
  ctx.stroke();
  ctx.closePath();
  ctx.clip();

  try {
    const avatar = await loadImage(
      member.user.displayAvatarURL({ size: 2048, extension: "png" }),
    );
    ctx.drawImage(avatar, 67, 83, 2 * logorad, 2 * logorad);
  } catch (err) {
    Logger.warn(
      `command: leaderboard: failed to load user avatar, user id: ` +
        member.user.id +
        "guild id:" +
        member.guild.id +
        err,
    );
  }

  return [
    new AttachmentBuilder(canvas.toBuffer("image/png"))
      .setName("rankcard.png")
      .setDescription(`Rank Card for ${member.displayName}`),
  ];
}
