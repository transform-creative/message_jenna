
// import { kv } from '@vercel/kv';
// import { NextRequest, NextResponse } from 'next/server';

// // 1. Configure which paths to track
// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for:
//      * - api routes (unless you want to track those)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico, sitemap.xml, robots.txt (assets)
//      */
//     '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
//   ],
// };

// export async function middleware(req: NextRequest) {
//   try {
//     // 2. Identify the Key Data
//     const date = new Date().toISOString().split('T')[0]; // "2026-01-23"
//     const path = req.nextUrl.pathname;
    
//     // We use IP for "Unique Visitors". 
//     // Fallback to 'unknown' if not present (e.g. localhost)
//     const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';

//     // 3. Define your Redis Keys
//     // Structure: "analytics:DATE:TYPE:..."
//     const pageKey = `analytics:${date}:page:${path}`; 
//     const visitorKey = `analytics:${date}:visitors`;

//     // 4. Update Redis (Fire and Forget)
//     // We use context.waitUntil to ensure this runs in the background 
//     // without slowing down the user's page load.
//     const updateStats = Promise.all([
//       // Increment the count for this specific page
//       kv.incr(pageKey),
      
//       // Add IP to a HyperLogLog (HLL) set
//       // This counts UNIQUE items with huge efficiency
//       kv.pfadd(visitorKey, ip) 
//     ]);

//     // This is the magic Vercel feature that prevents the "await" lag
//     if (req.waitUntil) {
//       req.waitUntil(updateStats);
//     } else {
//       // Fallback for environments without waitUntil (adds ~10ms latency)
//       await updateStats; 
//     }

//   } catch (e) {
//     // Never crash the site just because analytics failed
//     console.error("Analytics Error:", e);
//   }

//   // 5. Continue loading the page as normal
//   return NextResponse.next();
// }
