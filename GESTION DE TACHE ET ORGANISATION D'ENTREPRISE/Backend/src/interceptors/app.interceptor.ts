import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, tap } from "rxjs";

@Injectable()
export class AppInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    // You can add custom logic here before the request is handled
    const request = context.switchToHttp().getRequest();
    console.log(`Incoming request to ${request.method} ${request.url}`);
    console.log(`Incoming request to ${context.getHandler().name}`);
    return next.handle().pipe(tap(()=>console.log(`Request completed`)), map((data) => {
      // You can modify the response data here if needed
      return data;
    }   ));     
  }
}