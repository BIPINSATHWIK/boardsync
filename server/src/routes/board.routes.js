const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { requireBoardMembership } = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createBoardSchema,
  updateBoardSchema,
  boardParamsSchema,
  addMemberSchema,
} = require('../schemas/board.schema');
const {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
  addMember,
} = require('../controllers/board.controller');

const router = Router();

router.use(authenticate);

router.post('/', validate(createBoardSchema), createBoard);
router.get('/', getBoards);
router.get('/:boardId', validate(boardParamsSchema), requireBoardMembership('viewer'), getBoard);
router.patch('/:boardId', validate(updateBoardSchema), requireBoardMembership('owner'), updateBoard);
router.delete('/:boardId', validate(boardParamsSchema), requireBoardMembership('owner'), deleteBoard);
router.post('/:boardId/members', validate(addMemberSchema), requireBoardMembership('owner'), addMember);

module.exports = router;
