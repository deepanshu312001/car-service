const express = require("express");
const router = express.Router();

const {
  getAvailableSlots,
  getAppointmentsOfOperator,
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
} = require("../controller/controller.appointment");

router.get("/", getAvailableSlots);
router.get("/operator", getAppointmentsOfOperator);

router.post("/", bookAppointment);
router.post("/:id/cancel", cancelAppointment);
router.post("/:id/reschedule", rescheduleAppointment);

module.exports = router;
