const { z } = require('zod');

const createCardSchema = z.object({
  params: z.object({
    listId: z.string().min(1),
  }),
  body: z.object({
    title: z.string().min(1, { message: 'Title is required' }).max(200),
    description: z.string().max(2000).optional(),
    url: z.string().url().optional().or(z.literal('')),
    order: z.number({ required_error: 'Order is required' }),
  }),
});

const updateCardSchema = z.object({
  params: z.object({
    cardId: z.string().min(1),
  }),
  body: z.object({
    version: z.number({ required_error: 'version is required for conflict detection' }),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    url: z.string().url().optional().or(z.literal('')),
    order: z.number().optional(),
    list: z.string().optional(),
    linkPreview: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().optional().nullable(),
      siteName: z.string().optional(),
      favicon: z.string().optional(),
      url: z.string().optional(),
    }).optional().nullable(),
  }).refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.order !== undefined ||
      data.list !== undefined ||
      data.url !== undefined ||
      data.linkPreview !== undefined,
    { message: 'At least one field to update must be provided' }
  ),
});

const cardParamsSchema = z.object({
  params: z.object({
    cardId: z.string().min(1),
  }),
});

module.exports = { createCardSchema, updateCardSchema, cardParamsSchema };
