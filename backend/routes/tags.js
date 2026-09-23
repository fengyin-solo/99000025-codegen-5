const express = require('express');
const { getDb } = require('../db/init');

const router = express.Router();

// Number of recently updated articles used to calculate frequently used tags
const RECENT_ARTICLE_LIMIT = 20;
// Maximum number of recent tags returned to the client
const RECENT_TAG_LIMIT = 10;

function splitTags(tagsStr) {
  if (!tagsStr) return [];
  return Array.from(
    new Set(
      tagsStr
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)
    )
  );
}

function compareTagName(a, b) {
  return a.localeCompare(b, 'zh-Hans-CN');
}

// GET /api/tags - Get all tags with article counts and recently used high-frequency tags
router.get('/', (req, res) => {
  const db = getDb();

  try {
    const { total: totalArticles } = db
      .prepare('SELECT COUNT(*) AS total FROM articles')
      .get();

    const rows = db
      .prepare(`
        SELECT tags, updated_at, created_at
        FROM articles
        WHERE tags IS NOT NULL AND tags != ''
      `)
      .all();

    const counts = new Map();

    rows.forEach(row => {
      splitTags(row.tags).forEach(name => {
        counts.set(name, (counts.get(name) || 0) + 1);
      });
    });

    // Aggregate tags from the most recently updated articles
    const recentCounts = new Map();
    const recentRows = rows
      .map(row => ({
        tags: row.tags,
        usedAt: new Date(row.updated_at || row.created_at).getTime()
      }))
      .sort((a, b) => b.usedAt - a.usedAt)
      .slice(0, RECENT_ARTICLE_LIMIT);

    recentRows.forEach(({ tags: tagsStr, usedAt }) => {
      splitTags(tagsStr).forEach(name => {
        const entry = recentCounts.get(name) || { count: 0, lastUsedAt: 0 };
        entry.count += 1;
        entry.lastUsedAt = Math.max(entry.lastUsedAt, usedAt);
        recentCounts.set(name, entry);
      });
    });

    const tagCounts = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return compareTagName(a.name, b.name);
      });

    // Keep alphabetical ordering for backward compatibility
    const tags = Array.from(counts.keys()).sort(compareTagName);

    const recentTags = Array.from(recentCounts.entries())
      .map(([name, { count, lastUsedAt }]) => ({
        name,
        count,
        lastUsedAt: new Date(lastUsedAt).toISOString()
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        if (b.lastUsedAt !== a.lastUsedAt) return b.lastUsedAt.localeCompare(a.lastUsedAt);
        return compareTagName(a.name, b.name);
      })
      .slice(0, RECENT_TAG_LIMIT);

    res.json({
      tags,
      tagCounts,
      recentTags,
      totalTags: tags.length,
      totalArticles
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

module.exports = router;
