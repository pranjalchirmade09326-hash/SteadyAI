import 'fastify';
import type { UserRole } from '@prisma/client';

declare module 'fastify' {
  interface MultipartUploadFile {
    filename: string;
    mimetype: string;
    toBuffer: () => Promise<Buffer>;
  }

  interface FastifyRequest {
    userId?: string;
    userEmail?: string;
    userRole?: UserRole;
    workspaceId?: string;
    userIdentity?: {
      id: string;
      email?: string;
      displayName?: string | null;
      role?: UserRole;
    };
    file: () => Promise<MultipartUploadFile | undefined>;
  }
}
