import dl from "#lib/ttdl";
// import fs from "fs";
// import createSlideshow from "#lib/slideShower";

function main(ctx) {
  const url = ctx.update.message.text;
  dl(url).then((data) => {
    if (data.images) {
      const photoUrls = data.images.map((e) => e.url);
      const audioUrl = data.music.play_url;
      // createSlideshow(photoUrls, audioUrl, ".temp/vid.mp4").then((e) => {
      //   ctx.sendVideo({ source: fs.readFileSync(e) });      пока не работает


      const photos = photoUrls.map((e) => {
        return {
          type: "photo",
          media: e,
        };
      });
      ctx.sendMediaGroup(photos);

      ctx.sendVoice(audioUrl);
    } else {
      const caption = `👨‍🦰${data.author.name}\n❤️${data.stats.likeCount} 👁${data.stats.playCount}\n${data.title == 'Downloaded from TiklyDown API' ? '' : data.title}`
      ctx.sendVideo(data.video.noWatermark, { caption });
    }
  });
}

export default main;
