import { Router } from 'express';
import * as noteController from './note.controller.js';

const router = Router();

router.get('/:contactId', noteController.getNotesByContact);
router.post('/', noteController.createNote);
router.delete('/:id', noteController.deleteNote);

export const noteRoutes = router;
