import { describe, it, expect } from 'vitest';
import { ZodError, z } from 'zod';
import { createEventSchema, updateEventSchema } from '@/lib/validations/event';
import { idSchema, paginationSchema, searchSchema } from '@/lib/validations/common';

describe('Event validations', () => {
  it('accepts a valid event create object', () => {
    const validEvent = {
      title: 'Mountain hike to Rysy',
      type: 'GÓRY' as const,
      dateStart: '2025-06-15T09:00:00Z',
      description: 'A beautiful hike to the highest peak in Poland',
      location: 'Zakopane',
      image: 'https://example.com/image.jpg',
      spots: 30,
      difficulty: 3,
      organizer: 'John Doe',
      imageFocalX: 50,
      imageFocalY: 50,
    };

    const result = createEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Mountain hike to Rysy');
      expect(result.data.type).toBe('GÓRY');
    }
  });

  it('rejects event with missing required title', () => {
    const invalidEvent = {
      type: 'GÓRY' as const,
      dateStart: '2025-06-15T09:00:00Z',
    };

    const result = createEventSchema.safeParse(invalidEvent);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('title'))).toBe(true);
    }
  });

  it('rejects event with invalid date format', () => {
    const invalidEvent = {
      title: 'Test event',
      type: 'GÓRY' as const,
      dateStart: 'not-a-date',
    };

    const result = createEventSchema.safeParse(invalidEvent);
    expect(result.success).toBe(false);
  });

  it('rejects event with invalid difficulty (out of range)', () => {
    const invalidEvent = {
      title: 'Test event',
      type: 'GÓRY' as const,
      dateStart: '2025-06-15T09:00:00Z',
      difficulty: 10,
    };

    const result = createEventSchema.safeParse(invalidEvent);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('difficulty'))).toBe(true);
    }
  });

  it('rejects event with invalid image URL', () => {
    const invalidEvent = {
      title: 'Test event',
      type: 'GÓRY' as const,
      dateStart: '2025-06-15T09:00:00Z',
      image: 'not-a-url',
    };

    const result = createEventSchema.safeParse(invalidEvent);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('image'))).toBe(true);
    }
  });

  it('accepts partial update for event', () => {
    const partialUpdate = {
      title: 'Updated title',
      spots: 25,
    };

    const result = updateEventSchema.safeParse(partialUpdate);
    expect(result.success).toBe(true);
  });

  it('defaults imageFocalX and imageFocalY to 50', () => {
    const event = {
      title: 'Test event',
      type: 'GÓRY' as const,
      dateStart: '2025-06-15T09:00:00Z',
    };

    const result = createEventSchema.safeParse(event);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageFocalX).toBe(50);
      expect(result.data.imageFocalY).toBe(50);
    }
  });
});

describe('Common validations', () => {
  it('validates a valid UUID', () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000';
    const result = idSchema.safeParse(validId);
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID format', () => {
    const invalidId = 'not-a-uuid';
    const result = idSchema.safeParse(invalidId);
    expect(result.success).toBe(false);
  });

  it('validates pagination with defaults', () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('validates pagination with custom values', () => {
    const result = paginationSchema.safeParse({ page: 3, limit: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it('rejects pagination limit over max', () => {
    const result = paginationSchema.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });

  it('validates search with minimum 3 characters', () => {
    const result = searchSchema.safeParse({ q: 'hike' });
    expect(result.success).toBe(true);
  });

  it('rejects search query too short', () => {
    const result = searchSchema.safeParse({ q: 'hi' });
    expect(result.success).toBe(false);
  });

  it('rejects search query too long', () => {
    const result = searchSchema.safeParse({ q: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });
});
