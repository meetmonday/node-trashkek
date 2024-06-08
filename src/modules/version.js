import { execSync } from 'child_process';
import axios from 'axios';

// Function to get the current commit hash of the project
function getCurrentCommitHash() {
    try {
        const commitHash = execSync('git rev-parse --short=7 HEAD').toString().trim();
        return commitHash;
    } catch (error) {
        console.debug('GIT NE SUCHESTVUET, MI CHTO V MUSORNoM KONTEYNERE?');
        return process.env.GIT_HASH || null;
    }
}

// Function to get commit history from a GitHub repository using Axios
async function getCommitHistory(owner, repo) {
    try {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`);
        return response.data;
    } catch (error) {
        console.error('Error fetching commit history:', error);
        return null;
    }
}

// Function to generate changelog with multiple commit entries and highlight the current commit
async function generateChangelog(owner, repo, numEntries) {
    const fullCommitHistory = await getCommitHistory(owner, repo);
    if (!fullCommitHistory) {
        console.error('Failed to retrieve commit history. Changelog generation aborted.');
        return null;
    }

    const currentCommitHash = getCurrentCommitHash();
    const commitEntries = fullCommitHistory.slice(0, numEntries);

    const changelogEntries = commitEntries.map((commit, index) => {
        const commitShortSha = commit.sha.slice(0, 7)
        const commitMarker = commitShortSha === currentCommitHash ? ' ◀' : '';
        return `${index + 1}. ${commitShortSha}${commitMarker}: ${commit.commit.message}`;
    });

    return changelogEntries;
}

// Example usage
const owner = 'meetmonday';
const repo = 'node-trashkek';
const numEntriesToShow = 7;



  
const getVersion = (ctx) => {
  generateChangelog(owner, repo, ctx.payload || numEntriesToShow)
    .then(changelog => {
      let text = []
        if (changelog) {
            text.push('ЧЛЕНДЖЛОГ:');
            changelog.forEach(entry => text.push(entry));
        }
        ctx.sendMessage(text.join('\n'))
    });
}

export default getVersion;