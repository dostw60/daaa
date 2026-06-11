const router = require("express").Router();

const {
  getCorporateActions,
} = require("../controllers/corporateActionController");

router.get("/", getCorporateActions);

module.exports = router;
