import { format, bold, join } from 'gramio'
import type { BotType } from '../..'

const COMMANDS = [
  { cmd: '/bipki [@user]', desc: 'Баланс (свой, reply или @user)' },
  { cmd: '/daily', desc: 'Ежедневный бонус (streak + рандом)' },
  { cmd: '/transfer @user N [comment]', desc: 'Перевод с комиссией 5%' },
  { cmd: '/work', desc: 'Заработать 5–50 бипок (кулдаун 2ч)' },
  { cmd: '/burn N', desc: 'Сжечь бипки' },
  { cmd: '/rain N', desc: 'Устроить дождь в чате' },
  { cmd: '/top', desc: 'Топ чата' },
  { cmd: '/globaltop', desc: 'Глобальный топ' },
  { cmd: '/economy', desc: 'Статистика экономики' },
  { cmd: '/history [N]', desc: 'Последние N операций (по умолч. 5)' },
  { cmd: '/bipkiHelp', desc: 'Это сообщение' },
]

export default (bot: BotType) =>
  bot.command("bipkihelp", async (ctx: any) => {
    const items = COMMANDS.map(
      ({ cmd, desc }) => format`${bold(cmd)} — ${desc}`,
    )
    const msg = format`🅱️ Бипки — команды\n${join(items, '\n')}`
    await ctx.reply(msg)
  })
