import express from 'express';
import { createTerm, deleteTerm, getTerms, updateTerm } from '../app/controllers/TermController.js';

const router = express.Router();

router.get('/', getTerms);
router.post('/', createTerm);
router.put('/:id', updateTerm);
router.delete('/:id', deleteTerm);

export default router;
