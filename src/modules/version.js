import { execSync } from 'child_process';

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

// Function to get commit history from a GitHub repository using Fetch API
async function getCommitHistory(owner, repo) {
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits`);
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error('Error fetching commit history:', response.status);
            return null;
        }
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
            text.push(`ЧЛЕНДЖЛОГ: ${ process.env.WEINBUN ? 'В БУНЕ ' + Bun.version : '' }`);
            changelog.forEach(entry => text.push(entry));
        }
        ctx.sendMessage(text.join('\n'))
    });
}

export default getVersion;