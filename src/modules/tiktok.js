import axios from "axios";
import tl from '#lib/temploader';
import fs from 'fs'

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
        console.log(data)
        if(data.status === 'picker') {
          const photos = data.picker.map((e) => {
            return {
              type: 'photo',
              media: e.url
            }
          })

          while (photos.length > 0) {
            ctx.sendMediaGroup(photos.splice(0, 9))
          }

          tl.downloadFile(data.audio).then(e=> {
            console.log(e)
            ctx.sendVoice({ source : fs.readFileSync(e) })
            tl.deleteFile(e)
          })
        } else {
          tl.downloadFile(data.url).then(e=> {
            ctx.sendVideo({ source : fs.readFileSync(e) })
            tl.deleteFile(e)
          })
        }
      });
  });
}

export default main;
