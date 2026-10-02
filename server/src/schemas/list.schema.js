const { z } = require('zod');

const createListSchema = z.object({
  params: z.object({
    boardId: z.string().min(1),
  }),
  body: z.object({
    title: z.string().min(1, { message: 'Title is required' }).max(100),
    order: z.number({ required_error: 'Order is required' }),
  }),
});

const updateListSchema = z.object({
  params: z.object({
    listId: z.string().min(1),
  }),
  body: z.object({
    title: z.string().min(1).max(100).optional(),
    order: z.number().optional(),
  }).refine((data) => data.title !== undefined || data.order !== undefined, {
    message: 'At least one of title or order must be provided',
  }),
});

const listParamsSchema = z.object({
  params: z.object({
    listId: z.string().min(1),
  }),
});

module.exports = { createListSchema, updateListSchema, listParamsSchema };
