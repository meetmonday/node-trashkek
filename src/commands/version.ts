import { execSync } from 'child_process';

/**
 * Gets the current git commit hash.
 * @returns {string|null} Short commit hash or null if not available.
 */
function getCurrentCommitHash() {
  try {
    return execSync('git rev-parse --short=7 HEAD').toString().trim();
  } catch (error) {
    console.debug('GIT NOT AVAILABLE, USING ENVIRONMENT VARIABLE');
    return process.env.GIT_HASH || null;
  }
}

/**
 * Fetches commit history from GitHub repository.
 * @returns {Promise<Array|null>} Array of commits or null on error.
 */
async function getCommitHistory() {
  try {
    const response = await fetch(`https://api.github.com/repos/meetmonday/node-trashkek/commits`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching commit history:', error.message);
    return null;
  }
}

/**
 * Generates a changelog from recent commits.
 * @param {number} numEntries - Number of entries to include.
 * @returns {Promise<Array|null>} Array of changelog entries or null.
 */
async function generateChangelog(numEntries) {
  const commitHistory = await getCommitHistory();
  if (!commitHistory) {
    console.error('Failed to retrieve commit history. Changelog generation aborted.');
    return null;
  }

  const currentCommitHash = getCurrentCommitHash();
  const recentCommits = commitHistory.slice(0, numEntries);

  return recentCommits.map((commit, index) => {
    const shortSha = commit.sha.slice(0, 7);
    const marker = shortSha === currentCommitHash ? ' ◀' : '';
    return `${index + 1}. ${shortSha}${marker}: ${commit.commit.message}`;
  });
}

/**
 * Handler for version command.
 * @param {Object} ctx - Telegraf context object.
 */
const getVersion = async (ctx) => {
  const numEntries = ctx.args || 7;

  try {
    const changelog = await generateChangelog(numEntries);

    const messages = ['ЧЛЕНДЖЛОГ:'];
    if (changelog) {
      messages.push(...changelog);
    }

    await ctx.send(messages.join('\n'));
  } catch (error) {
    console.error('Version command error:', error);
    await ctx.send('Failed to retrieve version information');
  }
};

export default (bot: BotType) =>
    bot.command("ver", (context) => getVersion(context));