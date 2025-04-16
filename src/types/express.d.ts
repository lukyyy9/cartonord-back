import { Request as ExpressRequest, Response, NextFunction } from 'express';

declare module 'express' {
  export interface Request extends ExpressRequest {
    user?: {
      id: number;
    };
  }
  
  export interface RequestHandler {
    (req: Request, res: Response, next: NextFunction): void | Promise<void> | Response | Promise<Response>;
  }
} 