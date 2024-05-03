const { db } = require("../database/db");
const mysql = require("mysql2");

async function makeAppointment(userId, date, startTime, endTime, operatorId) {
  return new Promise(async (resolve, reject) => {
    try {
      const sql = `INSERT INTO appointment (operator_id, user_id, date, start_time, end_time)
            VALUES (?, ?, ?, ?, ?)`;

      db.query(
        sql,
        [operatorId, userId, date, startTime, endTime],
        (err, result) => {
          if (err) {
            console.error("Error inserting data:", err);
            return reject(err);
          }

          return resolve(result);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

async function fetchSuitableOperator(startTime, endTime, date) {
  return new Promise(async (resolve, reject) => {
    try {
      const sql = `
            SELECT id as operator_id 
                FROM service_operator
            WHERE 
                id NOT IN(
                    SELECT
                        operator_id
                    FROM
                        appointment
                    WHERE 
                        active_flag=1 
                        AND date = ${mysql.escape(date)}
                        AND start_time = ${startTime}
                        AND end_time = ${endTime}
                        GROUP BY operator_id)`;
      db.query(sql, function (err, operators) {
        console.log(this.sql);
        if (err) {
          return reject(err);
        }
        return resolve(operators);
      });
    } catch (error) {
      return reject(error);
    }
  });
}

async function checkAvailableSlot(startTime, endTime, date, operatorId) {
  let sql = `
            SELECT 
                count(1) as count,
                (SELECT COUNT(1) AS total FROM service_operator) as total_operators
            FROM  
                appointment
            WHERE  
                active_flag=1
                AND date = ${mysql.escape(date)} 
                AND start_time = ${startTime} 
                AND end_time = ${endTime} `;
  if (operatorId) {
    sql += ` AND operator_id = ${operatorId} `;
  }

  return new Promise(async (resolve, reject) => {
    try {
      db.query(sql, function (err, results) {
        if (err) {
          console.error("Error executing query:", err);
          return reject(err);
        }
        console.log("Query results:", results);
        if (results?.length) {
          if (!operatorId && results[0].count < results[0].total_operators) {
            return resolve(true);
          } else if (operatorId && results[0].count == 0) {
            return resolve(true);
          } else {
            return resolve(false);
          }
        }

        return reject("no records");
      });
    } catch (error) {
      return reject(error);
    }
  });
}

async function fetchBookedSlot(operatorId, date) {
  return new Promise(async (resolve, reject) => {
    try {
      let bookedSlotSql = `
                    SELECT
                        start_time,
                        end_time,
                        date
                    FROM 
                        appointment
                    WHERE 
                        active_flag=1
                        AND date >= now()
                        AND date <= '${date}' 
                        AND operator_id = ${operatorId}
                    ORDER BY date, start_time `;
console.log("bookedSlotSql",bookedSlotSql);
      db.query(bookedSlotSql, (err, results) => {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        console.log("Query results:", results);

        return resolve(results);
      });
    } catch (error) {
      return reject(error);
    }
  });
}

async function fetchOperatorAppointments(operatorId) {
  return new Promise(async (resolve, reject) => {
    try {
      const sql = `
                SELECT 
                    id as appointment_id,
                    user_id,
                    operator_id,
                    DATE_ADD(date, INTERVAL 330 MINUTE) as date,
                    start_time,
                    end_time
                FROM
                    appointment
                WHERE
                    active_flag=1
                    AND operator_id = ${operatorId}
                `;
      db.query(sql, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    } catch (error) {
      return reject(error);
    }
  });
}

async function updateAppointmentFlag(appointmentId, activeFlag) {
  return new Promise(async (resolve, reject) => {
    try {
      //1-active,2-deleted,3-reschedule
      const sql = ` UPDATE appointment SET active_flag = ${activeFlag} WHERE id = ${appointmentId}`;

      db.query(sql, (err, row) => {
        if (err) {
          return reject(err);
        }
        return resolve(row);
      });
    } catch (error) {
      return reject(error);
    }
  });
}

async function fetchAvailabelSlot(operatorId, date) {
  const bookedSlots = await fetchBookedSlot(operatorId, date);
  console.log("bookedSlots",bookedSlots)
  const openSlots = [];
  let lastEnd = 0;

  bookedSlots.forEach((slot) => {
    if (slot.start_time > lastEnd) {
      console.log("bookedSlots",bookedSlots)
      openSlots.push({ start_time: lastEnd, end_time: slot.start_time, date: date });
    }
    lastEnd = slot.end_time;
  });

  if (lastEnd < 24) {
    openSlots.push({ start_time: lastEnd, end_time: 24, date: date });
  }

  return openSlots;
}

module.exports = {
  fetchAvailabelSlot,
  checkAvailableSlot,
  makeAppointment,
  fetchOperatorAppointments,
  fetchSuitableOperator,
  updateAppointmentFlag,
};
