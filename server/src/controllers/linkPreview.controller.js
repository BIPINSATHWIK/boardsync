const ogs = require('open-graph-scraper');

/**
 * GET /link-preview?url=<encoded-url>
 * Returns Open Graph metadata for the given URL.
 * Requires authentication (applied at route level).
 */
const getLinkPreview = async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: { message: 'url query parameter is required', code: 'VALIDATION_ERROR' } });
    }

    // Validate it's a real URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: { message: 'Invalid URL', code: 'VALIDATION_ERROR' } });
    }

    // YouTube special handling — extract video thumbnail directly
    const youtubeMatch =
      parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be');

    let videoId = null;
    if (youtubeMatch) {
      if (parsedUrl.hostname.includes('youtu.be')) {
        videoId = parsedUrl.pathname.slice(1);
      } else {
        videoId = parsedUrl.searchParams.get('v');
      }
    }

    const { error: ogsError, result } = await ogs({
      url,
      timeout: 5000,
      fetchOptions: {
        headers: {
          'User-Agent': 'BoardSyncBot/1.0 (+https://boardsync.app)',
        },
      },
    });

    if (ogsError) {
      // Fallback: return minimal info from the URL itself
      const domain = parsedUrl.hostname.replace('www.', '');
      return res.json({
        preview: {
          title: domain,
          description: url,
          image: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null,
          siteName: domain,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
          url,
        },
      });
    }

    const image =
      (result.ogImage && (Array.isArray(result.ogImage) ? result.ogImage[0]?.url : result.ogImage?.url)) ||
      (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

    const domain = parsedUrl.hostname.replace('www.', '');

    res.json({
      preview: {
        title: result.ogTitle || result.twitterTitle || domain,
        description: result.ogDescription || result.twitterDescription || '',
        image,
        siteName: result.ogSiteName || domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        url,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLinkPreview };
