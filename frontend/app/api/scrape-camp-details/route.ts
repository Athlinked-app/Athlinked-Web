import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL required' },
        { status: 400 }
      );
    }

    console.log('Fetching camp details for:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try to scrape the actual page
    const title =
      $('h1').first().text().trim() ||
      $('.event-title').first().text().trim() ||
      $('[class*="title"]').first().text().trim() ||
      'Event Details';
    // Try multiple image selectors
    let image = '';
    const imageSelectors = [
      'img.featured-image',
      '.event-image img',
      '.main-image',
      'article img',
      '.wp-post-image',
      '[class*="featured"] img',
      '[class*="hero"] img',
      '.entry-content img',
      'img[src*="upload"]',
      'img',
    ];

    for (const selector of imageSelectors) {
      const img = $(selector).first();
      image =
        img.attr('src') ||
        img.attr('data-src') ||
        img.attr('data-lazy-src') ||
        '';

      if (image) {
        console.log(`Found image with selector: ${selector}, src: ${image}`);

        // Make sure image URL is absolute
        if (!image.startsWith('http')) {
          if (image.startsWith('//')) {
            image = `https:${image}`;
          } else if (image.startsWith('/')) {
            image = `https://www.playnsports.com${image}`;
          } else {
            image = `https://www.playnsports.com/${image}`;
          }
        }

        // Skip placeholder/icon images
        if (
          !image.includes('placeholder') &&
          !image.includes('icon') &&
          !image.includes('logo') &&
          image.length > 20
        ) {
          break;
        } else {
          image = ''; // Reset and continue searching
        }
      }
    }

    // Fallback to default image
    if (!image) {
      console.log('No suitable image found, using fallback');
      image =
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop';
    }

    console.log('Final image URL:', image);

    const date =
      $('.date, .event-date, time, [class*="date"]').first().text().trim() ||
      'Date TBA';

    const location =
      $('.location, .venue, .event-location, [class*="location"]')
        .first()
        .text()
        .trim() || 'Location TBA';

    const description =
      $('.description, .event-description, .content p, article p')
        .first()
        .text()
        .trim() ||
      $('.description, .event-description, .content, article')
        .first()
        .text()
        .trim()
        .substring(0, 300) ||
      'Visit the link for more details about this event.';

    console.log('Scraped details:', {
      title,
      date,
      location,
      hasImage: !!image,
    });

    return NextResponse.json({
      success: true,
      camp: {
        title,
        image,
        date,
        location,
        description,
        applyLink: url,
      },
    });
  } catch (error) {
    console.error('Scraping error:', error);

    // Return basic info on error
    return NextResponse.json({
      success: true,
      camp: {
        title: 'Event Details',
        image:
          'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop',
        date: 'Date TBA',
        location: 'Location TBA',
        description:
          'Unable to load full details. Please click Apply Now to visit the event page.',
        applyLink: request.url.includes('url=')
          ? decodeURIComponent(request.url.split('url=')[1])
          : '',
      },
    });
  }
}
