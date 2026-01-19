import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const ALLOWED_SPORTS = [
  'baseball',
  'basketball',
  'golf',
  'softball',
  'swimming',
  'ice hockey',
  'hockey',
];

function extractSport(title: string): string | null {
  const lowerTitle = title.toLowerCase();

  for (const sport of ALLOWED_SPORTS) {
    if (lowerTitle.includes(sport)) {
      if (sport === 'ice hockey' || sport === 'hockey') return 'Ice Hockey';
      return sport.charAt(0).toUpperCase() + sport.slice(1);
    }
  }

  return null;
}

export async function GET() {
  try {
    const response = await fetch(
      'https://www.playnsports.com/find-camps-clinics/',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const camps: any[] = [];

    const possibleSelectors = [
      '.event-item',
      '.camp-item',
      'article',
      '.card',
      '.listing-item',
      '[class*="event"]',
      '[class*="camp"]',
    ];

    let foundElements = false;

    for (const selector of possibleSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((index, element) => {
          const $el = $(element);

          const title =
            $el.find('h2').first().text().trim() ||
            $el.find('h3').first().text().trim() ||
            $el.find('.title').first().text().trim() ||
            $el.find('[class*="title"]').first().text().trim() ||
            $el.find('a').first().text().trim();

          const sport = extractSport(title);

          if (!sport) {
            return;
          }

          const img = $el.find('img').first();
          let image = img.attr('src') || img.attr('data-src') || '';
          if (image && !image.startsWith('http')) {
            image = `https://www.playnsports.com${image}`;
          }

          const linkElement = $el.find('a').first();
          let link = linkElement.attr('href') || '';
          if (link && !link.startsWith('http')) {
            link = `https://www.playnsports.com${link}`;
          }

          const date =
            $el.find('.date').first().text().trim() ||
            $el.find('[class*="date"]').first().text().trim() ||
            $el.find('time').first().text().trim() ||
            '';

          const location =
            $el.find('.location').first().text().trim() ||
            $el.find('[class*="location"]').first().text().trim() ||
            $el.find('.venue').first().text().trim() ||
            '';

          if (title && link) {
            camps.push({
              id: `camp-${camps.length + 1}`,
              title,
              sport,
              website: 'Play N Sports',
              image:
                image ||
                'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop',
              link,
              date: date || 'Date TBA',
              location: location || 'Location TBA',
              category: 'Tryouts & Camps',
              type: 'tryouts',
            });
          }
        });

        foundElements = true;
        break;
      }
    }

    console.log(`✅ Play N Sports: Scraped ${camps.length} camps`);
    return NextResponse.json({ success: true, camps });
  } catch (error) {
    console.error('❌ Play N Sports scraping error:', error);
    return NextResponse.json({
      success: true,
      camps: [],
    });
  }
}
