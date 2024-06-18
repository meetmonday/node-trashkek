import axios from "axios";
import tl from "#lib/temploader";
import fs from "fs";
import createSlideshow from "#lib/slideShower";

function main(ctx) {
  ctx.persistentChatAction("upload_video", () => {
    axios
      .post(
        "https://api.cobalt.tools/api/json",
        {
          url: ctx.update.message.text,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      )
      .then(({ data }) => {
        if (data.status === "picker") {
          const photoUrls = data.picker.map((e) => e.url);
          const audioUrl = data.audio;
          if (photoUrls.length > 9) {
            createSlideshow(photoUrls, audioUrl, ".temp/vid.mp4").then((e) => {
              ctx.sendVideo({ source: fs.readFileSync(e) });
            }).catch((e) => {
              ctx.reply(`Произошло хуй знает что, но ${e}`)
            });
          } else {
            const photos = photoUrls.map((e) => {
              return {
                type: "photo",
                media: e,
              };
            });
            ctx.sendMediaGroup(photos);

            tl.downloadFile(data.audio).then((e) => {
              ctx.sendVoice({ source: fs.readFileSync(e) });
              tl.deleteFile(e);
            });
          }
        } else {
          tl.downloadFile(data.url).then((e) => {
            ctx.sendVideo({ source: fs.readFileSync(e) });
            tl.deleteFile(e);
          });
        }
      });
  });
}

export default main;
