import axios from "axios";
import tl from "#lib/temploader";
import fs from "fs";
import createSlideshow from "#lib/slideShower";

function main(ctx) {
  ctx.persistentChatAction("upload_video", () => {
    let videoUrl = null;
    let forceSlide = false

    if(ctx.update.message.text.slice(-1) === '!') {
      videoUrl = ctx.update.message.text.slice(0, -1)
      forceSlide = true
    } else { 
      videoUrl = ctx.update.message.text
    }
    axios
      .post(
        "https://api.cobalt.tools/api/json",
        {
          url: videoUrl,
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
          if (photoUrls.length > 4 || forceSlide) {
            createSlideshow(photoUrls, audioUrl, ".temp/vid.mp4").then((e) => {
              ctx.sendVideo({ source: fs.readFileSync(e) });
            }).catch((e) => {
              ctx.reply(e)
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
      }).catch(e => {
        ctx.reply(`ERR: ${e.response.data.text}`)
      }).catch(e=> {
        ctx.reply(e)
      });
  });
}

export default main;
