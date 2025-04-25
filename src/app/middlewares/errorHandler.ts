import { NextRequest, NextResponse } from 'next/server';

export const errorHandler = <T extends any[], R extends NextResponse | Response>(
  handler: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ) as R;
    }
  };
};