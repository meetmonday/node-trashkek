import { execSync } from 'child_process';
import axios from 'axios';

const GITHUB_OWNER = 'meetmonday';
const GITHUB_REPO = 'node-trashkek';
const DEFAULT_CHANGELOG_ENTRIES = 7;

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
 * @param {string} owner - Repository owner.
 * @param {string} repo - Repository name.
 * @returns {Promise<Array|null>} Array of commits or null on error.
 */
async function getCommitHistory(owner, repo) {
  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`);
    return response.data;
  } catch (error) {
    console.error('Error fetching commit history:', error.message);
    return null;
  }
}

/**
 * Generates a changelog from recent commits.
 * @param {string} owner - Repository owner.
 * @param {string} repo - Repository name.
 * @param {number} numEntries - Number of entries to include.
 * @returns {Promise<Array|null>} Array of changelog entries or null.
 */
async function generateChangelog(owner, repo, numEntries) {
  const commitHistory = await getCommitHistory(owner, repo);
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
  const numEntries = ctx.payload || DEFAULT_CHANGELOG_ENTRIES;

  try {
    const changelog = await generateChangelog(GITHUB_OWNER, GITHUB_REPO, numEntries);

    const messages = ['ЧЛЕНДЖЛОГ:'];
    if (changelog) {
      messages.push(...changelog);
    }

    await ctx.sendMessage(messages.join('\n'));
  } catch (error) {
    console.error('Version command error:', error);
    await ctx.sendMessage('Failed to retrieve version information');
  }
};

export default getVersion;
