import { Router } from "express";
import filesController from "../controllers/files";
import multer from "multer";
import { authenticateToken } from "../middlewares/auth";
import Joi from "joi";
import { validateParams } from "../middlewares/validate-schema";

const upload = multer({
  dest: 'uploads/',
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
});

const Schema = Joi.object({
  agent_id: Joi.number().required(),
})

const filesRouter = Router();

filesRouter
  .use(authenticateToken)
  .post("/:agent_id", validateParams(Schema), upload.array('files'), filesController.upload)
  // .put("/:id", filesController.update)
  .delete("/:id", filesController.delete)
;

export { filesRouter };