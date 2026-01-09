import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ success: false, message: 'Missing url parameter' }, { status: 400 });
    }

    // Use server-side fetch to avoid CORS issues and parse HTML with cheerio
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, message: `Failed to fetch url: ${response.status}` }, { status: 502 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').first().text() ||
      '';

    return NextResponse.json({ success: true, title: title || 'Article' });
  } catch (error) {
    console.error('Error in scrape-url:', error);
    return NextResponse.json({ success: false, message: 'Scrape failed' }, { status: 500 });
  }
}
