const { z } = require('zod');

const createBoardSchema = z.object({
  body: z.object({
    title: z.string().min(1, { message: 'Title is required' }).max(100),
  }),
});

const updateBoardSchema = z.object({
  params: z.object({
    boardId: z.string().min(1),
  }),
  body: z.object({
    title: z.string().min(1, { message: 'Title is required' }).max(100),
  }),
});

const boardParamsSchema = z.object({
  params: z.object({
    boardId: z.string().min(1),
  }),
});

const addMemberSchema = z.object({
  params: z.object({
    boardId: z.string().min(1),
  }),
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    role: z.enum(['editor', 'viewer'], { message: 'Role must be editor or viewer' }),
  }),
});

module.exports = { createBoardSchema, updateBoardSchema, boardParamsSchema, addMemberSchema };
