import { type MessageContext } from 'gramio';
import type { BotType } from '..';

type CmdCtx = MessageContext<BotType> & { args: string | null }

interface GitHubCommit {
  sha: string
  commit: { message: string }
}

function getCurrentCommitHash(): string | null {
  return process.env.GIT_HASH?.slice(0, 7) || null;
}

async function getCommitHistory(): Promise<GitHubCommit[]> {
  try {
    const response = await fetch('https://api.github.com/repos/meetmonday/node-trashkek/commits');
    if (!response.ok) return [];
    return await response.json() as GitHubCommit[];
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    }
    return [];
  }
}

async function generateChangelog(numEntries: number): Promise<string[]> {
  const commitHistory = await getCommitHistory();
  if (commitHistory.length === 0) return ['Failed to retrieve commit history.'];

  const currentCommitHash = getCurrentCommitHash();
  const recentCommits = commitHistory.slice(0, numEntries);

  return recentCommits.map((commit: GitHubCommit, index: number) => {
    const shortSha = commit.sha.slice(0, 7);
    const marker = shortSha === currentCommitHash ? ' ◀' : '';
    return `${index + 1}. ${shortSha}${marker}: ${commit.commit.message}`;
  });
}

/**
 * Handler for version command.
 * @param {Object} ctx - Telegraf context object.
 */
const getVersion = async (ctx: CmdCtx): Promise<void> => {
  const numEntries = Math.min(Math.max(parseInt(ctx.args ?? '', 10) || 7, 1), 20);

  try {
    const changelog = await generateChangelog(numEntries);
    await ctx.send(['ЧЛЕНДЖЛОГ:', ...changelog].join('\n'));
  } catch (error) {
    console.error('Version command error:', error);
    await ctx.send('Failed to retrieve version information');
  }
};

export default (bot: BotType) =>
    bot.command("ver", (context) => getVersion(context));