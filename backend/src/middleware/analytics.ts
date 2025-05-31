import { Request, Response, NextFunction } from 'express';

interface UserMetrics {
  ip: string | undefined;
  userAgent: string | undefined;
  timestamp: Date;
  endpoint: string;
  method: string;
  location?: {
    country: string;
    city: string;
    timezone: string;
  };
}

// Simple analytics middleware for collecting user metrics
export const analyticsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userMetrics: UserMetrics = {
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date(),
    endpoint: req.path,
    method: req.method
  };
  
  // Log user metrics (can be enhanced to store in database)
  console.log('User Metrics:', JSON.stringify(userMetrics, null, 2));
  
  // TODO: In production, you might want to:
  // 1. Store metrics in database
  // 2. Add GeoIP lookup for location data
  // 3. Filter out bot traffic
  // 4. Aggregate metrics for reporting
  
  next();
};

// Optional: GeoIP integration example (commented out - requires geoip-lite package)
/*
import geoip from 'geoip-lite';

const addGeoLocation = (userMetrics: UserMetrics) => {
  if (userMetrics.ip) {
    const geo = geoip.lookup(userMetrics.ip);
    if (geo) {
      userMetrics.location = {
        country: geo.country,
        city: geo.city,
        timezone: geo.timezone
      };
    }
  }
};
*/