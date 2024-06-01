import pkg from 'nayan-media-downloader';
const { tikdown } = pkg;

function main(ctx) {
  ctx.persistentChatAction('upload_video', () => {
    tikdown(ctx.update.message.text)
      .then((ttres) => {
        ctx.sendVideo(ttres.data.video, {
          caption: ttres.data.title
        });
      })
      .catch(() => ctx.sendMessage('Чета не так пошло........'));
  })

}

export default main;
