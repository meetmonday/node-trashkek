import fs from 'fs';
import { rand } from '#lib/helpers';

const lines = fs.readFileSync('dgdata.txt', 'utf8').split("<br>").filter(Boolean);

const main = (ctx) => {
  const zalupdaId = rand(0, lines.length - 1);
  ctx.answerInlineQuery([
    {
      type: 'article',
      id: zalupdaId,
      title: 'Выебать мамку - ' + zalupdaId,
      input_message_content: {
        message_text: lines[zalupdaId],
      }
    }
  ], 
  {
    cache_time: 1
  })
}

export default main;