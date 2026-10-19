import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthJwtPayload } from '../guards/jwt-auth.guard';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthJwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
