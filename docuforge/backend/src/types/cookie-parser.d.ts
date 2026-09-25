import "express";

declare module "cookie-parser";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email?: string;
      };
      file?: Express.Multer.File;
    }
  }
}

