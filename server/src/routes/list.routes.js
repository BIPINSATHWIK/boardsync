const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { requireBoardMembership } = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');
const { createListSchema, updateListSchema, listParamsSchema } = require('../schemas/list.schema');
const { createList, updateList, deleteList } = require('../controllers/list.controller');

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/boards/:boardId/lists', validate(createListSchema), requireBoardMembership('editor'), createList);
router.patch('/lists/:listId', validate(updateListSchema), requireBoardMembership('editor'), updateList);
router.delete('/lists/:listId', validate(listParamsSchema), requireBoardMembership('editor'), deleteList);

module.exports = router;
