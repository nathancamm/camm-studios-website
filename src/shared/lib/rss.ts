interface RssItem {
  title: string;
  url: string;
  date: Date;
  summary: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderRss(opts: {
  title: string;
  description: string;
  site: string;
  items: RssItem[];
}): string {
  const items = opts.items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.url}</link>
      <guid>${item.url}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate>
      <description>${escapeXml(item.summary)}</description>
    </item>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(opts.title)}</title>
    <link>${opts.site}</link>
    <description>${escapeXml(opts.description)}</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
}
