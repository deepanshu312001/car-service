const {
  fetchAvailabelSlot,
  checkAvailableSlot,
  makeAppointment,
  fetchOperatorAppointments,
  fetchSuitableOperator,
  updateAppointmentFlag,
} = require("../service/service.appointments");

const getAvailableSlots = async (req, res) => {
  try {
    const day = req.query.day ? req.query.day : 1;
    const operatorId = req.query.operator_id;

    const today = new Date();

    // fetching appointments of next ${day}
    console.log("today.getDate()",typeof(today.getDate()),typeof(day));
    today.setDate(today.getDate()+parseInt(day) );
    console.log("today.getDate()",today.getDate(),today.getDate()+day );

    const date = today.toISOString().split("T")[0];

    const responseObj = await fetchAvailabelSlot(operatorId, date);

    return res.json({
      success: true,
      message: "Available slots fetched successfully!",
      data: responseObj,
    });
  } catch (error) {
    console.log("error", error);
    return res
      .status(500)
      .json({ success: false, message: "" + error ?? error.message });
  }
};

const bookAppointment = async (req, res) => {
  try {
    const startTime = req.body.start_time;
    const endTime = startTime+1;
    const date = req.body.date;
    const operatorId = req.body.operator_id;
    const userId = parseInt(req.header("userid"));

    if (!startTime || !endTime || !date || !userId) {
      return res.status(400).json({ success: false, message: "Bad request!" });
    }

    let suitableOperatorId;

    const isSlotAvailable = await checkAvailableSlot(
      startTime,
      endTime,
      date,
      operatorId
    );

    if (!isSlotAvailable) {
      return res
        .status(400)
        .json({ success: false, message: "Given slot not available" });
    }

    if (!operatorId) {
      suitableOperatorId = await fetchSuitableOperator(
        startTime,
        endTime,
        date
      );
    }

    if (!operatorId && !suitableOperatorId?.length) {
      return res
        .status(400)
        .json({ success: false, message: "No service operator available" });
    }

    const responseObj = await makeAppointment(
      userId,
      date,
      startTime,
      endTime,
      operatorId ? operatorId : suitableOperatorId[0].operator_id
    );

    return res.status(201).json({
      success: true,
      message: "Created",
      data: {
        apointment_id: responseObj.insertId,
      },
    });
  } catch (error) {
    console.log("error", error);
    return res
      .status(500)
      .json({ success: false, message: "" + error ?? error.message });
  }
};

async function getAppointmentsOfOperator(req, res) {
  try {
    const operatorId = req.query.operator_id;

    if (!operatorId) {
      return res.status(400).json({ success: false, message: "Bad request!" });
    }

    const responseObj = await fetchOperatorAppointments(operatorId);
    res
      .status(200)
      .json({
        success: true,
        message: "Appointments fetched successfully",
        data: responseObj,
      });
  } catch (error) {
    console.log("error", error);
    return res
      .status(500)
      .json({ success: false, message: "" + error ?? error.message });
  }
}

async function cancelAppointment(req, res) {
  try {
    const appointmentId = req.params.id;

    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "Bad request!" });
    }

    const responseObj = await updateAppointmentFlag(appointmentId, 2);

    res
      .status(200)
      .json({ success: true, message: "Appointments canceled successfully" });
  } catch (error) {
    console.log("error", error);
    return res
      .status(500)
      .json({ success: false, message: "" + error ?? error.message });
  }
}

async function rescheduleAppointment(req, res) {
  try {
    const startTime = req.body.start_time;
    const endTime = req.body.end_time;
    const date = req.body.date;
    const operatorId = req.body.operator_id;
    const userId = parseInt(req.header("userid"));

    const appointmentId = req.params.id;

    if (!startTime || !endTime || !date || !userId || !appointmentId) {
      return res.status(400).json({ success: false, message: "Bad request!" });
    }

    const responseObjDel = await updateAppointmentFlag(appointmentId, 3);

    let suitableOperatorId;

    const isSlotAvailable = await checkAvailableSlot(
      startTime,
      endTime,
      date,
      operatorId
    );

    if (!isSlotAvailable) {
      return res
        .status(400)
        .json({ success: false, message: "Given slot not available" });
    }

    if (!operatorId) {
      suitableOperatorId = await fetchSuitableOperator(
        startTime,
        endTime,
        date
      );
    }

    if (!operatorId && !suitableOperatorId?.length) {
      return res
        .status(400)
        .json({ success: false, message: "No service operator available" });
    }

    const responseObj = await makeAppointment(
      userId,
      date,
      startTime,
      endTime,
      operatorId ? operatorId : suitableOperatorId[0].operator_id
    );

    return res.status(201).json({
      success: true,
      message: "Created",
      data: {
        apointment_id: responseObj.insertId,
      },
    });
  } catch (error) {
    console.log("error", error);
    return res
      .status(500)
      .json({ success: false, message: "" + error ?? error.message });
  }
}

module.exports = {
  getAvailableSlots,
  bookAppointment,
  getAppointmentsOfOperator,
  cancelAppointment,
  rescheduleAppointment,
};
