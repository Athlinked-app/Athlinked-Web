import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET() {
  try {
    console.log('Starting to scrape camps from playnsports.com...');

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
    console.log('Fetched HTML, length:', html.length);

    const $ = cheerio.load(html);
    const camps: any[] = [];

    // Try multiple possible selectors
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
        console.log(
          `Found ${elements.length} elements with selector: ${selector}`
        );

        elements.each((index, element) => {
          const $el = $(element);

          // Try to find title
          const title =
            $el.find('h2').first().text().trim() ||
            $el.find('h3').first().text().trim() ||
            $el.find('.title').first().text().trim() ||
            $el.find('[class*="title"]').first().text().trim() ||
            $el.find('a').first().text().trim();

          // Try to find image
          const img = $el.find('img').first();
          let image = img.attr('src') || img.attr('data-src') || '';
          if (image && !image.startsWith('http')) {
            image = `https://www.playnsports.com${image}`;
          }

          // Try to find link
          const linkElement = $el.find('a').first();
          let link = linkElement.attr('href') || '';
          if (link && !link.startsWith('http')) {
            link = `https://www.playnsports.com${link}`;
          }

          // Try to find date
          const date =
            $el.find('.date').first().text().trim() ||
            $el.find('[class*="date"]').first().text().trim() ||
            $el.find('time').first().text().trim() ||
            '';

          // Try to find location
          const location =
            $el.find('.location').first().text().trim() ||
            $el.find('[class*="location"]').first().text().trim() ||
            $el.find('.venue').first().text().trim() ||
            '';

          if (title && link) {
            camps.push({
              id: `camp-${index + 1}`,
              title,
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
        break; // Stop after finding valid selector
      }
    }

    if (!foundElements) {
      console.log('No camps found with any selector. Returning mock data.');
      // Fallback to mock data if scraping fails
      return NextResponse.json({
        success: true,
        camps: [
          {
            id: 'camp-1',
            title: 'Basketball Training Camp',
            image:
              'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop',
            link: 'https://www.playnsports.com/find-camps-clinics/',
            date: 'Contact for dates',
            location: 'Various locations',
            category: 'Tryouts & Camps',
            type: 'tryouts',
          },
        ],
      });
    }

    console.log(`Successfully scraped ${camps.length} camps`);
    return NextResponse.json({ success: true, camps });
  } catch (error) {
    console.error('Scraping error:', error);
    // Return mock data on error
    return NextResponse.json({
      success: true,
      camps: [
        {
          id: 'camp-error-1',
          title: 'Unable to load camps - Check console',
          image:
            'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop',
          link: 'https://www.playnsports.com/find-camps-clinics/',
          date: 'Error loading',
          location: 'N/A',
          category: 'Tryouts & Camps',
          type: 'tryouts',
        },
      ],
    });
  }
}
