var express = require('express');
var router = express.Router();

/* GET users listing.*/

router.post('/', function(req, res, next) {
  gPool.query(
    `SELECT
          trp.tripID,
          t.t_id AS tID,
          ud.u_id AS uID,
          trp.totalKM,
          trp.totalHrs,
          trp.working_hours   AS wHrs,
          start_j_time AS sJTime,
          end_j_time AS eJTime,
          start_o_meter AS sOMeter,
          end_o_meter AS eOMeter,
          start_time AS sTime,
          end_time AS eTime,
      CONCAT(ud.f_name, ' ', ud.l_name) AS uName,
          j.report_by AS jobBy,
          j.j_type    AS jType,
          l.full_load AS fLoad,
          l.load AS 'load',
          l.delivery AS delivery,
          p.load_num AS loadNum,
          p.drop_num AS dropNum,
          p.fridge_pallet AS nFpallet,
          p.dry_pallet AS nDpallet,
          t.rego_no AS regoNum ,
          z.z_number AS zoneNumber,
          z.z_name AS zoneName,
          p.current_dry_rate AS rDpallet,
          p.current_fridge_rate AS rFpallet,
          p.extra_drop_num  AS extraDropNum, 
          p.current_extra_rate  AS extraRate
      FROM
          (
            SELECT
              trip_id AS tripID,
              u_id,
              t_id,
              j_id,
              CASE WHEN do_total_km = 1 THEN end_o_meter - start_o_meter ELSE 0 END AS totalKM,
              time_to_sec(timediff(end_j_time , start_j_time )) / 3600 AS totalHrs,
              start_j_time,
              end_j_time,
              start_o_meter,
              end_o_meter,
              start_time,
              end_time,
              working_hours
              FROM
                trip 
              WHERE
                start_j_time >= '${req.body.sDate} 00:00:00' 
                AND end_j_time <= '${req.body.eDate} 23:59:59'
                AND trip_started = 1
                AND deleted = 0
          )
        AS trp 
      INNER JOIN
        userdetail ud 
        ON ud.u_id = trp.u_id 
      INNER JOIN
        truck t 
        ON t.t_id = trp.t_id
      LEFT JOIN
        jobtype j 
        on j.j_id = trp.j_id
      LEFT JOIN
        loaddetails l
        on l.trip_id = trp.tripID
      LEFT JOIN
        palletdetails p
        ON p.trip_id = trp.tripID
      LEFT JOIN
        zonetype z
        ON z.z_id = p.zone;
`,
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

/*delete trip */
router.put('/delete/:tID', function(req, res, next) {
  const tID = req.params.tID;

  gPool.query('UPDATE trip SET deleted = 1 where trip_id = ?', [tID], function(
    error,
    results,
    fields
  ) {
    //If there is error, we send the error in the error section with 500 status
    if (error) {
      next(error);
      return;
    }

    res.send(
      JSON.stringify({
        status: 200,
        error: null,
        response: results.affectedRows > 0
      })
    );
  });
});

module.exports = router;
