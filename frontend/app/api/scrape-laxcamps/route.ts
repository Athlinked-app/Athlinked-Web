import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET() {
  try {
    console.log('Starting to scrape camps from laxcamps.com...');

    const response = await fetch('https://laxcamps.com/camps/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log('Fetched HTML from laxcamps.com, length:', html.length);

    const $ = cheerio.load(html);
    const camps: any[] = [];

    // Find all accordion panels (each state is in a panel)
    const panels = $('.fusion-panel');
    console.log(`Found ${panels.length} state panels`);

    panels.each((stateIndex, stateElement) => {
      const $statePanel = $(stateElement);

      // Extract state name from the accordion heading
      const stateName = $statePanel
        .find('.fusion-toggle-heading')
        .text()
        .trim()
        .replace(' LACROSSE CAMPS', ''); // e.g., "ARIZONA"

      if (!stateName) return;

      // Get the state-specific "VIEW ALL" link
      const viewAllLink = $statePanel
        .find('a.fusion-button[href*="/camps/"]')
        .attr('href') || '';

      // Find all camps within this state's panel body
      const panelBody = $statePanel.find('.panel-body');

      // Each camp is separated by <hr> tags, so we split by them
      const campSections = panelBody.html()?.split('<hr>') || [];

      campSections.forEach((section, campIndex) => {
        const $section = $('<div>').html(section);

        // Extract city from <strong> tag (e.g., "FLAGSTAFF, AZ")
        const cityState = $section.find('strong').text().trim();

        // Extract camp name and link from the colored span
        const campLink = $section.find('a[style*="color"]');
        const campName = campLink.text().trim();
        const campUrl = campLink.attr('href') || viewAllLink;

        // Extract register and more info links
        const registerLink = $section
          .find('a.find-by-state[href*="register"], a.find-by-state[href*="active.com"]')
          .attr('href') || '';
        const moreInfoLink = $section
          .find('a.find-by-state[href*="laxcamps.com"]')
          .attr('href') || campUrl;

        if (campName && campName.length > 3) {
          camps.push({
            id: `laxcamp-${camps.length + 1}`,
            title: campName,
            sport: 'Lacrosse',
            website: 'Lax Camps',
            image:
              'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop',
            link: moreInfoLink || campUrl || 'https://laxcamps.com/camps/',
            date: 'Check website for dates',
            location: cityState || stateName,
            category: 'Tryouts & Camps',
            type: 'tryouts',
            registerLink: registerLink || moreInfoLink,
          });
        }
      });

      // If no individual camps found, add the state as a single entry
      if (campSections.length === 0 || !campSections[0]) {
        camps.push({
          id: `laxcamp-${camps.length + 1}`,
          title: `${stateName} Lacrosse Camps`,
          sport: 'Lacrosse',
          website: 'Lax Camps',
          image:
            'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop',
          link: viewAllLink || 'https://laxcamps.com/camps/',
          date: 'Multiple dates available',
          location: stateName,
          category: 'Tryouts & Camps',
          type: 'tryouts',
        });
      }
    });

    console.log(`✅ Successfully scraped ${camps.length} lacrosse camps`);
    return NextResponse.json({ success: true, camps });
  } catch (error) {
    console.error('Laxcamps scraping error:', error);
    return NextResponse.json({
      success: true,
      camps: [],
      error: String(error),
    });
  }
}