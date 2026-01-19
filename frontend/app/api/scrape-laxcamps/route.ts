import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET() {
  try {
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
    const $ = cheerio.load(html);
    const camps: any[] = [];

    const panels = $('.fusion-panel');

    panels.each((stateIndex, stateElement) => {
      const $statePanel = $(stateElement);

      const stateName = $statePanel
        .find('.fusion-toggle-heading')
        .text()
        .trim()
        .replace(' LACROSSE CAMPS', '');

      if (!stateName) return;

      const viewAllLink =
        $statePanel.find('a.fusion-button[href*="/camps/"]').attr('href') || '';

      const panelBody = $statePanel.find('.panel-body');
      const campSections = panelBody.html()?.split('<hr>') || [];

      campSections.forEach((section, campIndex) => {
        const $section = $('<div>').html(section);

        const cityState = $section.find('strong').text().trim();

        const campLink = $section.find('a[style*="color"]');
        const campName = campLink.text().trim();
        const campUrl = campLink.attr('href') || viewAllLink;

        const registerLink =
          $section
            .find(
              'a.find-by-state[href*="register"], a.find-by-state[href*="active.com"]'
            )
            .attr('href') || '';
        const moreInfoLink =
          $section.find('a.find-by-state[href*="laxcamps.com"]').attr('href') ||
          campUrl;

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

    console.log(`✅ Lax Camps: Scraped ${camps.length} camps`);
    return NextResponse.json({ success: true, camps });
  } catch (error) {
    console.error('❌ Lax Camps scraping error:', error);
    return NextResponse.json({
      success: true,
      camps: [],
      error: String(error),
    });
  }
}
