import { format, bold, join } from 'gramio'
import type { BotType } from '../..'

const COMMANDS = [
  { cmd: '/bipki [@user]', desc: 'Баланс (свой или @user)' },
  { cmd: '/daily', desc: 'Ежедневный бонус' },
  { cmd: '/coinflip N', desc: 'Орёл/решка со ставкой' },
  { cmd: '/slots N', desc: 'Слот-машина со ставкой' },
  { cmd: '/dice N', desc: 'Кость со ставкой' },
  { cmd: '/transfer @user N [comment]', desc: 'Перевод бипок' },
  { cmd: '/work', desc: 'Заработать бипок (кулдаун 2ч)' },
  { cmd: '/burn N', desc: 'Сжечь бипки' },
  { cmd: '/rain N', desc: 'Устроить дождь в чате' },
  { cmd: '/top', desc: 'Топ чата' },
  { cmd: '/globaltop', desc: 'Глобальный топ' },
  { cmd: '/ngbet [N]', desc: 'Ставка в призовой пул' },
  { cmd: '/economy', desc: 'Статистика экономики' },
  { cmd: '/history [N]', desc: 'Последние 5 операций' },
  { cmd: '/bipkihelp', desc: 'Это сообщение' },
]

export default (bot: BotType) =>
  bot.command("bipkihelp", async (ctx: any) => {
    const items = COMMANDS.map(
      ({ cmd, desc }) => format`${bold(cmd)} — ${desc}`,
    )
    const msg = format`🅱️ Бипки — команды\n${join(items, '\n')}`
    await ctx.reply(msg)
  })
