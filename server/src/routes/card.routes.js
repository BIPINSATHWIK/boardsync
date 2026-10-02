const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { requireBoardMembership } = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');
const { createCardSchema, updateCardSchema, cardParamsSchema } = require('../schemas/card.schema');
const { createCard, updateCard, deleteCard } = require('../controllers/card.controller');

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/lists/:listId/cards', validate(createCardSchema), requireBoardMembership('editor'), createCard);
router.patch('/cards/:cardId', validate(updateCardSchema), requireBoardMembership('editor'), updateCard);
router.delete('/cards/:cardId', validate(cardParamsSchema), requireBoardMembership('editor'), deleteCard);

module.exports = router;
