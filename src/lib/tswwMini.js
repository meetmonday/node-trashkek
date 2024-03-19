import pkg from 'nayan-media-downloader';
const { tikdown } = pkg;

async function ttd(url) {
    return await tikdown(url)
}

export { ttd };
