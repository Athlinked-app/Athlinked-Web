import { NextResponse } from 'next/server';

/**
 * Serve Android App Links verification file
 * This route ensures assetlinks.json is served with correct headers
 * Path: /.well-known/assetlinks.json
 *
 * This is a backup route for cases where static file serving might not work
 * (e.g., with Cloudflare or other CDNs that might interfere)
 */
export async function GET() {
  const assetLinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'ai.randomwalk.athlinked',
        sha256_cert_fingerprints: [
          '3B:26:86:26:23:0A:DA:C5:79:E4:FC:CC:29:87:3E:DF:BF:B2:DA:56:28:A0:F3:CD:17:AA:80:41:61:75:4A:B7',
        ],
      },
    },
  ];

  return NextResponse.json(assetLinks, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
