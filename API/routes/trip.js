var express = require('express');
var router = express.Router();
const AdmZip = require('adm-zip');
var path = require('path');
const _ = require('lodash');

router.post('/declaration', function(req, res, next) {
  gPool.query(
    'INSERT INTO trip SET ?',
    {
      u_id: req.user.userID
    },
    function(err, results) {
      if (err) {
        // not connected!
        next(err);
        return;
      }

      let tripId = results.insertId;

      gPool.query(
        'INSERT INTO declaration SET ?',
        {
          u_id: req.user.userID,
          trip_id: tripId
        },
        function(err, results) {
          // Handle error after the release.
          if (err) {
            // not connected!
            next(err);
            return;
          }

          res.send(
            JSON.stringify({
              status: 200,
              error: null,
              response: tripId
            })
          );
        }
      );
    }
  );
});

router.post('/startTrip', function(req, res, next) {
  const tripID = req.body.tripID;
  const regoNum = req.body.regoNum;
  const jType = req.body.jType;
  const oMeter = req.body.oMeter;
  const jTimeStart = req.body.jTimeStart;
  const sLocation = req.body.sLocation;

  gPool.query(
    'UPDATE trip SET u_id = ?, t_id = ?, j_id = ?, start_o_meter = ?, start_j_time = ?, start_location = ?, start_time = ?, trip_started = 1 WHERE trip_id = ?',
    [
      req.user.userID,
      regoNum,
      jType,
      oMeter,
      new Date(jTimeStart),
      sLocation,
      new Date(),
      tripID
    ],
    function(err, results) {
      // Handle error after the release.
      if (err) {
        // not connected!
        next(err);
        return;
      }

      let tripId = results.affectedRows;
      res.send(JSON.stringify({ status: 200, error: null, response: tripId }));
    }
  );
});

router.put('/endTrip', function(req, res, next) {
  const tripId = req.body.regoNum;
  const jobBy = req.body.jType;
  const oMeter = req.body.oMeter;
  const jTimeStart = req.body.jTimeStart;
  const eLocation = req.body.eLocation;
  const fLoad = req.body.fLoad;
  const load = req.body.load;
  const delivery = req.body.delivery;
  const palletDetails = req.body.palletDetails;

  gPool.query(
    'UPDATE trip SET end_o_meter = ?, end_j_time = ?, end_location = ?, end_time = ? WHERE trip_id = ?',
    [oMeter, new Date(jTimeStart), eLocation, new Date(), tripId],
    function(err, results) {
      // Handle error after the release.
      if (err) {
        // not connected!
        next(err);
        return;
      }
      if (jobBy == 'Load') {
        // Insert into load_details table
        gPool.query(
          'INSERT INTO loaddetails SET ?',
          {
            trip_id: tripId,
            full_load: fLoad,
            load: load,
            delivery: delivery
          },
          function(err, results) {
            if (err) {
              // not connected!
              next(err);
              return;
            }
            let lId = results.insertId;
            res.send(
              JSON.stringify({ status: 200, error: null, response: lId })
            );
          }
        );
      } else if (jobBy == 'Pallet') {
        palletData = [];
        _.forEach(palletDetails, loadDet => {
          let loadDetails = {};
          loadDetails['loadNum'] = loadDet['groupIndex'] + 1;
          _.forEach(loadDet['dropDetail'], (dropDet, ind) => {
            loadDetails['dropNum'] = ind + 1;
            loadDetails['nDpallet'] = dropDet['nDpallet'];
            loadDetails['nFpallet'] = dropDet['nFpallet'];
            palletData.push(_.clone(loadDetails));
          });
          if (loadDet['dropNum'] === 0) {
            loadDetails['dropNum'] = 0;
            loadDetails['nDpallet'] = 0;
            loadDetails['nFpallet'] = 0;
            palletData.push(_.clone(loadDetails));
          }
        });
        // Old Logic
        let palletDataInsert = [];
        for (let i = 0; i < palletData.length; i++) {
          palletDataInsert.push([
            tripId,
            palletData[i].loadNum,
            palletData[i].dropNum,
            palletData[i].nDpallet,
            palletData[i].nFpallet
          ]);
        }
        gPool.query(
          'INSERT INTO palletdetails (trip_id, load_num, drop_num, dry_pallet, fridge_pallet) VALUES ?',
          [palletDataInsert],
          function(err, results) {
            if (err) {
              // not connected!
              next(err);
              return;
            }
            let pId = results.insertId;
            res.send(
              JSON.stringify({ status: 200, error: null, response: pId })
            );
          }
        );
      } else {
        let affectedRows = results.affectedRows;
        res.send(
          JSON.stringify({ status: 200, error: null, response: affectedRows })
        );
      }
    }
  );
});

router.get('/tripDetail/:tpID', function(req, res, next) {
  const tpID = req.params.tpID;

  gPool.query(
    `SELECT
      tp.trip_id AS tripID,
      tp.trip_started AS tripStarted,
      CASE WHEN tp.end_time IS NULL THEN false ELSE true END AS tripEnded,
      true AS declaration,
      true AS checklist,
      tp.start_j_time  AS sjTime,
      tp.start_o_meter AS sKM,
      j.report_by AS jobBy
    FROM
      trip tp
      INNER JOIN declaration d ON d.trip_id = tp.trip_id
      INNER JOIN checklistans c ON c.trip_id = tp.trip_id
      LEFT JOIN jobtype j on j.j_id = tp.j_id
    WHERE
      tp.trip_id = ?
      AND tp.deleted = 0
    LIMIT
      1`,
    [tpID],
    function(error, results, fields) {
      // Handle error after the release.
      if (error) {
        next(error);
        return;
      }

      //If there is no error, all is good and response is 200OK.
      res.send(JSON.stringify({ status: 200, error: null, response: results }));
    }
  );
});

router.get('/userTrip/:uID', function(req, res, next) {
  const uID = req.params.uID;

  gPool.query(
    `SELECT
      tp.trip_id AS tripID,
      tp.trip_started AS tripStarted,
      CASE WHEN tp.end_time IS NULL THEN false ELSE true END AS tripEnded,
      true AS declaration,
      true AS checklist,
      tp.start_j_time  AS sjTime,
      tp.start_o_meter AS sKM,
      IFNULL(j.report_by, '') AS jobBy
    FROM
      trip tp
      INNER JOIN declaration d ON d.trip_id = tp.trip_id
      INNER JOIN checklistans c ON c.trip_id = tp.trip_id
      LEFT JOIN jobtype j ON j.j_id = tp.j_id
    WHERE
      tp.trip_id = (
        SELECT
          trip_id
        FROM
          trip
        WHERE
          u_id = ? AND deleted = 0 AND (start_j_time IS NOT NULL AND end_j_time IS NULL)
        ORDER BY
          trip_id ASC
        LIMIT
          1
      )
      AND tp.deleted = 0
    LIMIT
      1`,
    [uID],
    function(error, results, fields) {
      // Handle error after the release.
      if (error) {
        next(error);
        return;
      }

      //If there is no error, all is good and response is 200OK.
      res.send(JSON.stringify({ status: 200, error: null, response: results }));
    }
  );
});

router.get('/tripList', function(req, res, next) {
  gPool.query(
    `SELECT tp.trip_id       AS tripID,
            t.rego_no        AS regoNum,
            CONCAT(u.f_name, ' ', u.l_name) AS driverName,
            tp.start_o_meter AS sKm,
            tp.end_o_meter   AS eKm,
            tp.start_j_time  AS sjTime,
            tp.start_time    AS sTime,
            tp.end_j_time    AS ejTime,
            tp.end_time      AS eTime,
            CASE WHEN c.ans = 'YES' THEN 1 ELSE 0 END AS anyDamage
        FROM   trip tp
            INNER JOIN truck t
                    ON t.t_id = tp.t_id
            INNER JOIN userdetail u
                    ON tp.u_id = u.u_id
        INNER JOIN checklistans c
          ON c.trip_id = tp.trip_id AND c.q_id = 10
        WHERE  t.in_use = 1
            AND (tp.trip_id IN (SELECT Max(trip_id)
                              FROM   trip
                              WHERE deleted = 0
                              GROUP  BY t_id) OR (tp.start_j_time IS NOT NULL AND tp.end_j_time IS NULL))
            AND tp.trip_started = 1
            AND tp.deleted = 0
        ORDER  BY tp.start_time DESC`,
    function(error, results, fields) {
      // Handle error after the release.
      if (error) {
        next(error);
        return;
      }

      //If there is no error, all is good and response is 200OK.
      res.send(JSON.stringify({ status: 200, error: null, response: results }));
    }
  );
});

router.get('/que', function(req, res, next) {
  gPool.query(
    'SELECT q_id AS qID ,que AS que, que_type AS queType, img_require AS imgReq FROM checklistque WHERE deleted = 0 ORDER BY sort_order ASC',
    function(error, results, fields) {
      // Handle error after the release.
      if (error) {
        next(error);
        return;
      }

      //If there is no error, all is good and response is 200OK.
      res.send(JSON.stringify({ status: 200, error: null, response: results }));
    }
  );
});

router.get('/quetype', function(req, res, next) {
  gPool.query(
    'SELECT q_type_id AS type, type_desc AS typeDesc FROM quetypes',
    function(error, results, fields) {
      // Handle error after the release.
      if (error) {
        next(error);
        return;
      }

      //If there is no error, all is good and response is 200OK.
      res.send(JSON.stringify({ status: 200, error: null, response: results }));
    }
  );
});

router.post('/addans', function(req, res, next) {
  const tripID = req.body.tripID;
  const answer = req.body.ans;

  let affectedRows = 0;
  let ansData = [];
  for (let i in answer) {
    ansData.push([answer[i].id, req.user.userID, tripID, answer[i].ans]);
  }

  gPool.query(
    'INSERT INTO checklistans (q_id, u_id, trip_id, ans) VALUES ?',
    [ansData],
    function(err, results) {
      if (err) {
        // not connected!
        next(err);
        return;
      }

      affectedRows = results.affectedRows;

      res.send(
        JSON.stringify({
          status: 200,
          error: null,
          response: affectedRows
        })
      );
    }
  );
});

router.get('/checklistData/:tpID', function(req, res, next) {
  const tpID = req.params.tpID;

  gPool.query(
    `SELECT  q.que  AS que,
        a.ans  AS ans
    FROM   checklistans a
        INNER JOIN checklistque q
                ON a.q_id = q.q_id
        INNER JOIN trip tp
                ON tp.trip_id = a.trip_id
    WHERE  a.trip_id = ? AND tp.deleted = 0
    ORDER BY q.sort_order ASC`,
    [tpID],
    function(error, results, fields) {
      // Handle error after the release.
      if (error) {
        next(error);
        return;
      }

      //If there is no error, all is good and response is 200OK.
      res.send(JSON.stringify({ status: 200, error: null, response: results }));
    }
  );
});

router.get('/tripData/:tpID', function(req, res, next) {
  const tpID = req.params.tpID;

  gPool.query(
    `SELECT tp.trip_id       AS tripID, 
        t.rego_no        AS regoNum, 
        t.t_id           AS truckID, 
        CONCAT(u.f_name, ' ', u.l_name) AS driverName, 
        true             AS declaration,
        d.time           AS dTime,
        tp.start_o_meter AS sKm, 
        tp.end_o_meter   AS eKm, 
        tp.working_hours AS wHrs,
        tp.start_j_time  AS sjTime, 
        tp.start_time    AS sTime, 
        tp.end_j_time    AS ejTime, 
        tp.end_time      AS eTime, 
        l.full_load      AS fLoad, 
        l.LOAD           AS 'load', 
        l.delivery       AS delivery, 
        p.zone           AS zone, 
        z.z_name         AS zoneName, 
        z.z_number       AS zoneNumber, 
        p.load_num       AS loadNum, 
        p.drop_num       AS dropNum, 
        p.dry_pallet     AS dryPallet, 
        p.fridge_pallet  AS fridgePallet, 
        p.current_dry_rate  AS dryPalletRate, 
        p.current_fridge_rate  AS fridgePalletRate,
        p.extra_drop_num  AS extraDropNum, 
        p.current_extra_rate  AS extraRate,
        j.report_by      AS jobBy, 
        j.j_type         AS jType, 
        j.j_id           AS jID 
    FROM   trip tp 
        INNER JOIN truck t 
                ON t.t_id = tp.t_id 
        INNER JOIN userdetail u 
                ON tp.u_id = u.u_id
        LEFT JOIN  declaration d
                ON d.u_id = u.u_id AND
                  d.trip_id = tp.trip_id 
        LEFT JOIN loaddetails l 
              ON l.trip_id = tp.trip_id 
        LEFT JOIN palletdetails p 
              ON p.trip_id = tp.trip_id 
        LEFT JOIN jobtype j 
              ON j.j_id = tp.j_id 
        LEFT JOIN zonetype z 
              ON z.z_id = p.zone 
    WHERE  tp.trip_id = ? 
        AND tp.trip_started = 1 
        AND tp.deleted = 0 `,
    [tpID],
    function(error, results, fields) {
      // Handle error after the release.
      if (error) {
        next(error);
        return;
      }

      //If there is no error, all is good and response is 200OK.
      res.send(JSON.stringify({ status: 200, error: null, response: results }));
    }
  );
});

/*add trip by admin */

router.post('/addTrip', function(req, res, next) {
  const userID = req.body.userID;
  const truckID = req.body.truckID;
  const jType = req.body.jType;
  const sKm = req.body.sKm;
  const eKm = req.body.eKm;
  const wHrs = req.body.wHrs;
  const sjTime = req.body.sjTime;
  const ejTime = req.body.ejTime;
  const fLoad = req.body.fLoad;
  const load = req.body.load;
  const delivery = req.body.delivery;
  const jobBy = req.body.jobBy;
  const palletDetails = req.body.palletDetails;

  gPool.query(
    'INSERT INTO trip SET ?',
    {
      u_id: userID,
      t_id: truckID,
      j_id: jType,
      start_o_meter: sKm,
      end_o_meter: eKm,
      start_j_time: new Date(sjTime),
      end_j_time: new Date(ejTime),
      trip_started: 1,
      start_time: new Date(),
      end_time: new Date(),
      working_hours: wHrs
    },
    function(err, results) {
      // Handle error after the release.
      if (err) {
        // not connected!
        next(err);
        return;
      }
      let tpID = results.insertId;
      if (jobBy == 'Load') {
        // Insert into load_details table
        gPool.query(
          `INSERT INTO loaddetails SET ?`,

          {
            trip_id: tpID,
            full_load: fLoad,
            load: load,
            delivery: delivery
          },

          function(err, results) {
            if (err) {
              // not connected!
              next(err);
              return;
            }
            // let insertId = results.insertId;
            res.send(
              JSON.stringify({
                status: 200,
                error: null,
                response: tpID
              })
            );
          }
        );
      } else if (jobBy == 'Pallet') {
        palletData = [];
        _.forEach(palletDetails, loadDet => {
          let loadDetails = {};
          loadDetails['loadNum'] = loadDet['groupIndex'] + 1;
          _.forEach(loadDet['dropDetail'], (dropDet, ind) => {
            loadDetails['dropNum'] = ind + 1;
            loadDetails['zone'] = dropDet['zone'];
            loadDetails['nDpallet'] = dropDet['nDpallet'];
            loadDetails['nFpallet'] = dropDet['nFpallet'];
            loadDetails['rDpallet'] = dropDet['rDpallet'];
            loadDetails['rFpallet'] = dropDet['rFpallet'];
            loadDetails['extraDropNum'] = 0;
            loadDetails['extraRate'] = 0;
            palletData.push(_.clone(loadDetails));
          });
          if (loadDet['dropNum'] === 0) {
            loadDetails['dropNum'] = 0;
            loadDetails['zone'] = 0;
            loadDetails['nDpallet'] = 0;
            loadDetails['nFpallet'] = 0;
            loadDetails['rDpallet'] = 0;
            loadDetails['rFpallet'] = 0;
            loadDetails['extraDropNum'] = 0;
            loadDetails['extraRate'] = 0;
            palletData.push(_.clone(loadDetails));
          }
          let extraDrops = _.get(loadDet, 'extraDropNum') || 0;
          if (loadDet['dropNum'] > 0 && extraDrops > 0) {
            loadDetails['dropNum'] = 0;
            loadDetails['zone'] = 0;
            loadDetails['nDpallet'] = 0;
            loadDetails['nFpallet'] = 0;
            loadDetails['rDpallet'] = 0;
            loadDetails['rFpallet'] = 0;
            loadDetails['extraDropNum'] = extraDrops;
            loadDetails['extraRate'] = _.get(loadDet, 'extraRate') || 0;
            palletData.push(_.clone(loadDetails));
          }
        });

        let palletDataInsert = [];
        for (let i = 0; i < palletData.length; i++) {
          palletDataInsert.push([
            tpID,
            palletData[i].zone,
            palletData[i].loadNum,
            palletData[i].dropNum,
            palletData[i].nDpallet,
            palletData[i].nFpallet,
            palletData[i].rDpallet,
            palletData[i].rFpallet,
            palletData[i].extraDropNum,
            palletData[i].extraRate
          ]);
        }

        gPool.query(
          `INSERT INTO palletdetails (trip_id, zone, load_num, drop_num, dry_pallet, fridge_pallet, current_dry_rate, current_fridge_rate, extra_drop_num, current_extra_rate) VALUES ?;`,
          [palletDataInsert],
          function(err, results) {
            if (err) {
              // not connected!
              next(err);
              return;
            }

            //let affectedRows = results[2].affectedRows;
            res.send(
              JSON.stringify({
                status: 200,
                error: null,
                response: tpID
              })
            );
          }
        );
      } else {
        // let tId = results.insertId;
        res.send(JSON.stringify({ status: 200, error: null, response: tpID }));
      }
    }
  );
});

/*update trip data */
router.put('/updatetripData/:tpID', function(req, res, next) {
  const tpID = req.params.tpID;
  const truckID = req.body.truckID;
  const sKm = req.body.sKm;
  const eKm = req.body.eKm;
  const wHrs = req.body.wHrs ? req.body.wHrs : null;
  const sjTime = req.body.sjTime;
  const ejTime = req.body.ejTime;
  const fLoad = req.body.fLoad;
  const load = req.body.load;
  const delivery = req.body.delivery;
  const jobBy = req.body.jobBy;
  const palletDetails = req.body.palletDetails;
  const jType = req.body.jType;
  console.log(sjTime);

  gPool.query(
    ` UPDATE trip
        SET t_id = ?,
          start_j_time = ?,
          end_j_time = ?,
          start_o_meter = ?,
          end_o_meter = ?,
          j_id = ?,
          working_hours = ?
        WHERE
        trip_id=?;`,
    [truckID, new Date(sjTime), new Date(ejTime), sKm, eKm, jType, wHrs, tpID],
    function(error, results, fields) {
      // Handle error after the release.
      if (error) {
        next(error);
        return;
      }

      if (jobBy == 'Load') {
        // Insert into load_details table
        gPool.query(
          `DELETE FROM palletdetails WHERE trip_id = ?;
          DELETE FROM loaddetails WHERE trip_id = ?;
          INSERT INTO loaddetails SET ?`,
          [
            tpID,
            tpID,
            {
              trip_id: tpID,
              full_load: fLoad,
              load: load,
              delivery: delivery
            }
          ],

          function(err, results) {
            if (err) {
              // not connected!
              next(err);
              return;
            }
            let affectedRows = results[1].affectedRows;
            res.send(
              JSON.stringify({
                status: 200,
                error: null,
                response: affectedRows
              })
            );
          }
        );
      } else if (jobBy == 'Pallet') {
        palletData = [];
        _.forEach(palletDetails, loadDet => {
          let loadDetails = {};
          loadDetails['loadNum'] = loadDet['groupIndex'] + 1;
          _.forEach(loadDet['dropDetail'], (dropDet, ind) => {
            loadDetails['dropNum'] = ind + 1;
            loadDetails['zone'] = dropDet['zone'];
            loadDetails['nDpallet'] = dropDet['nDpallet'];
            loadDetails['nFpallet'] = dropDet['nFpallet'];
            loadDetails['rDpallet'] = dropDet['rDpallet'];
            loadDetails['rFpallet'] = dropDet['rFpallet'];
            loadDetails['extraDropNum'] = 0;
            loadDetails['extraRate'] = 0;
            palletData.push(_.clone(loadDetails));
          });
          if (loadDet['dropNum'] === 0) {
            loadDetails['dropNum'] = 0;
            loadDetails['zone'] = 0;
            loadDetails['nDpallet'] = 0;
            loadDetails['nFpallet'] = 0;
            loadDetails['rDpallet'] = 0;
            loadDetails['rFpallet'] = 0;
            loadDetails['extraDropNum'] = 0;
            loadDetails['extraRate'] = 0;
            palletData.push(_.clone(loadDetails));
          }
          let extraDrops = _.get(loadDet, 'extraDropNum') || 0;
          if (loadDet['dropNum'] > 0 && extraDrops > 0) {
            loadDetails['dropNum'] = 0;
            loadDetails['zone'] = 0;
            loadDetails['nDpallet'] = 0;
            loadDetails['nFpallet'] = 0;
            loadDetails['rDpallet'] = 0;
            loadDetails['rFpallet'] = 0;
            loadDetails['extraDropNum'] = extraDrops;
            loadDetails['extraRate'] = _.get(loadDet, 'extraRate') || 0;
            palletData.push(_.clone(loadDetails));
          }
        });

        let palletDataInsert = [];
        for (let i = 0; i < palletData.length; i++) {
          palletDataInsert.push([
            tpID,
            palletData[i].zone,
            palletData[i].loadNum,
            palletData[i].dropNum,
            palletData[i].nDpallet,
            palletData[i].nFpallet,
            palletData[i].rDpallet,
            palletData[i].rFpallet,
            palletData[i].extraDropNum,
            palletData[i].extraRate
          ]);
        }

        gPool.query(
          `DELETE FROM loaddetails WHERE trip_id = ?;
           DELETE FROM palletdetails WHERE trip_id = ?; 
           INSERT INTO palletdetails (trip_id, zone, load_num, drop_num, dry_pallet, fridge_pallet, current_dry_rate, current_fridge_rate, extra_drop_num, current_extra_rate) VALUES ?;`,
          [tpID, tpID, palletDataInsert],
          function(err, results) {
            if (err) {
              // not connected!
              next(err);
              return;
            }

            let affectedRows = results[2].affectedRows;
            res.send(
              JSON.stringify({
                status: 200,
                error: null,
                response: affectedRows
              })
            );
          }
        );
      } //If there is no error, all is good and response is 200OK.
      else {
        let affectedRows = results.affectedRows;
        res.send(
          JSON.stringify({ status: 200, error: null, response: affectedRows })
        );
      }
    }
  );
});

router.get('/tripImgData/:tpID', function(req, res, next) {
  const tpID = req.params.tpID;

  gPool.query(
    `SELECT attach_id       AS ID,
        CASE
          WHEN a.field_name = 'endOdometer' THEN 'End Odometer'
          WHEN a.field_name = 'jobSheet' THEN 'Job Sheet'
          WHEN a.field_name = 'startOdometer' THEN 'Start Odometer'
          WHEN a.field_name = 'checklist|~|10' THEN 'Any Damage'
          WHEN a.field_name LIKE 'loadImage_%' THEN REPLACE(a.field_name, 'loadImage_', 'Pallet Sheet Load ')
          ELSE a.field_name
        END             AS type,
        a.original_f_name AS originalName,
        a.path            AS path,
        a.time            AS time
    FROM   attachments a
    INNER JOIN trip tp ON tp.trip_id = a.trip_id
    WHERE  a.deleted = 0 AND tp.deleted = 0 AND a.trip_id = ?
    ORDER  BY time DESC `,
    [tpID],
    function(error, results, fields) {
      // Handle error after the release.
      if (error) {
        next(error);
        return;
      }

      //If there is no error, all is good and response is 200OK.
      res.send(JSON.stringify({ status: 200, error: null, response: results }));
    }
  );
});

router.get('/jobSheetImgData', function(req, res, next) {
  gPool.query(
    `SELECT attach_id       AS ID,
        CASE
          WHEN field_name = 'jobSheet' THEN 'Job Sheet'
          ELSE field_name
        END             AS type,
        original_f_name AS originalName,
        path            AS path,
        time            AS time
    FROM   attachments
    WHERE  deleted = 0 AND field_name = 'jobsheet'
    ORDER  BY time DESC `,

    function(error, results, fields) {
      // Handle error after the release.
      if (error) {
        next(error);
        return;
      }

      //If there is no error, all is good and response is 200OK.
      res.send(JSON.stringify({ status: 200, error: null, response: results }));
    }
  );
});

router.post('/filteredImages', function(req, res, next) {
  let a = req.body.sDate;

  gPool.query(
    `SELECT attach_id       AS ID,
        CASE
          WHEN field_name = 'jobSheet' THEN 'Job Sheet'
          ELSE field_name
        END             AS type,
        original_f_name AS originalName,
        path            AS path,
        time            AS time
    FROM   attachments
    WHERE  deleted = 0 AND field_name = 'jobsheet' AND time >='${req.body.sDate} 00:00:00' and time < '${req.body.eDate} 23:59:59'
    ORDER  BY time DESC `,

    function(error, results, fields) {
      // Handle error after the release.
      if (error) {
        next(error);
        return;
      }

      //If there is no error, all is good and response is 200OK.
      res.send(JSON.stringify({ status: 200, error: null, response: results }));
    }
  );
});

router.post('/downloadFilteredImages', function(req, res, next) {
  gPool.query(
    `SELECT attach_id       AS ID,
        CASE
          WHEN a.field_name = 'jobSheet' THEN 'Job Sheet'
          ELSE a.field_name
        END             AS type,
        a.original_f_name AS originalName,
        a.path            AS path,
        a.time            AS time,        
        CONCAT(tp.start_j_time, '_', ud.f_name,' ', ud.l_name) AS fileName
    FROM   attachments a
    INNER JOIN trip tp  ON tp.trip_id = a.trip_id
    INNER JOIN userdetail ud  ON tp.u_id = ud.u_id
    WHERE  a.deleted = 0 AND a.field_name = 'jobsheet' AND a.time >='${req.body.sDate} 00:00:00' and a.time < '${req.body.eDate} 23:59:59'
    ORDER  BY time DESC `,

    function(error, results, fields) {
      // Handle error after the release.
      if (error) {
        next(error);
        return;
      }

      //If there is no error, all is good and response is 200OK.
      const zip = new AdmZip();
      results.forEach(r => {
        zip.addLocalFile(r.path);
      });

      // reading archives
      var zipEntries = zip.getEntries(); // an array of ZipEntry records

      zipEntries.forEach(function(zipEntry) {
        let fileName = zipEntry.entryName;
        let ext = path.extname(fileName);

        let newFileName = results.filter(r => {
          return r.path.toString().endsWith(fileName);
        });

        // var newFileName = fileName.substring(fileName.indexOf('/') + 1);
        if (newFileName.length > 0) {
          zipEntry.entryName =
            `${newFileName[0]['fileName']}${ext}` || zipEntry.entryName;
        }
      });

      const downloadName = `${Date.now()}.zip`;
      const data = zip.toBuffer();
      res.set('Content-Type', 'application/octet-stream');
      res.set('Content-Disposition', `attachment; filename=${downloadName}`);
      res.set('Content-Length', data.length);
      res.send(data);
    }
  );
});

router.put('/resetKM/:tpID', function(req, res, next) {
  const tpID = req.params.tpID;

  gPool.query(
    `UPDATE trip SET do_total_km = 0 WHERE trip_id = ?`,
    [tpID],
    function(error, results, fields) {
      // Handle error after the release.
      if (error) {
        next(error);
        return;
      }

      let affectedRows = results.affectedRows;
      //If there is no error, all is good and response is 200OK.
      res.send(
        JSON.stringify({ status: 200, error: null, response: affectedRows })
      );
    }
  );
});

module.exports = router;
