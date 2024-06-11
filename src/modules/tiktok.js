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
          const photos = data.picker.slice(0,9).map((e) => {
            return {
              type: 'photo',
              media: e.url
            }
          })

          ctx.sendMediaGroup(photos)
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
