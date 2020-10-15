var express = require('express');
var router = express.Router();

/*get job list */
router.get('/jobList', function(req, res, next) {
  gPool.query(
    'SELECT j_id AS jID, j_type AS jType,report_by AS reportBy, active as active FROM jobtype',
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

/*to get jobtype list */
router.get('/jobTypeList', function(req, res, next) {
  gPool.query(
    'SELECT j_id AS jID, j_type AS jType, report_by AS jobBy FROM jobtype WHERE active = 1',
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

/*to add a job */

router.post('/addJob', function(req, res, next) {
  const jType = req.body.jType;
  const reportBy = req.body.reportBy;

  gPool.query(
    'INSERT INTO jobtype SET ?',
    {
      j_type: jType,
      report_by: reportBy
    },
    function(err, results) {
      // Handle error after the release.
      if (err) {
        // not connected!
        next(err);
        return;
      }

      let jId = results.insertId;
      res.send(JSON.stringify({ status: 200, error: null, response: jId }));
    }
  );
});

/*Active job */
router.put('/active/:jID', function(req, res, next) {
  const jID = req.params.jID;

  gPool.query('UPDATE jobtype SET active = 1 where j_id = ?', [jID], function(
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

/*delete job */
router.put('/delete/:jID', function(req, res, next) {
  const jID = req.params.jID;

  gPool.query('UPDATE jobtype SET active = 0 where j_id = ?', [jID], function(
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

/*update job */

router.put('/update/:jID', function(req, res, next) {
  const jID = req.params.jID;
  const jType = req.body.jType;
  const reportBy = req.body.reportBy;

  gPool.query(
    `UPDATE
        jobtype 
    SET
        j_type = ?, report_by = ? 
    WHERE
        j_id = ?`,
    [jType, reportBy, jID],
    function(error, results, fields) {
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
    }
  );
});

/*methods for table Zonetype*/

/*get zone list */
router.get('/zoneList', function(req, res, next) {
  gPool.query(
    'SELECT z_id  AS zID, z_number  AS zNumber, z_name  AS zName, rd_pallet AS rDpallet,  rf_pallet AS rFpallet, active  AS active FROM zonetype ORDER BY z_number, z_name',
    function(error, results, fields) {
      // Handle error after the release.
      if (error) {
        next(error);
        return;
      }
      res.send(JSON.stringify({ status: 200, error: null, response: results }));
      //If there is no error, all is good and response is 200OK.
    }
  );
});

/*to add a zone */

router.post('/addZone', function(req, res, next) {
  const zNumber = req.body.zNumber;
  const zName = req.body.zName;
  const rdPallet = req.body.rDpallet;
  const rfPallet = req.body.rFpallet;

  gPool.query(
    'INSERT INTO zonetype SET ?',
    {
      z_number: zNumber,
      z_name: zName,
      rd_pallet: rdPallet,
      rf_pallet: rfPallet
    },
    function(err, results) {
      // Handle error after the release.
      if (err) {
        // not connected!
        next(err);
        return;
      }

      let zId = results.insertId;
      res.send(JSON.stringify({ status: 200, error: null, response: zId }));
    }
  );
});

/*Active zone */
router.put('/activezone/:zID', function(req, res, next) {
  const zID = req.params.zID;

  gPool.query('UPDATE zonetype SET active = 1 where z_id = ?', [zID], function(
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

/*delete zone */
router.put('/deletezone/:zID', function(req, res, next) {
  const zID = req.params.zID;

  gPool.query('UPDATE zonetype SET active = 0 where z_id = ?', [zID], function(
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

/*update zone */

router.put('/updatezone/:zID', function(req, res, next) {
  const zID = req.params.zID;
  const zNumber = req.body.zNumber;
  const zName = req.body.zName;
  const rdPallet = req.body.rDpallet;
  const rfPallet = req.body.rFpallet;
  const applyToAll = req.body.applyToAll;

  let updateQuery = '';

  if (applyToAll) {
    updateQuery = `
    ;UPDATE zonetype SET
      rd_pallet = '${rdPallet}', rf_pallet = '${rfPallet}'
    WHERE
      z_number = '${zNumber}'`;
  }

  gPool.query(
    `UPDATE
        zonetype 
    SET
        z_number = ?, z_name = ?, rd_pallet = ?, rf_pallet = ?
    WHERE
        z_id = ?${updateQuery}`,
    [zNumber, zName, rdPallet, rfPallet, zID],
    function(error, results, fields) {
      //If there is error, we send the error in the error section with 500 status
      if (error) {
        next(error);
        return;
      }

      if (!results.affectedRows) {
        results = results[0];
      }

      res.send(
        JSON.stringify({
          status: 200,
          error: null,
          response: results.affectedRows > 0
        })
      );
    }
  );
});

// job Detail
router.get('/:jID', function(req, res, next) {
  const jID = req.params.jID;

  gPool.query(
    `SELECT
        j_id AS jId,
        j_type AS jType,
        report_by As reportBy
       
    FROM
        jobtype 
    WHERE
        j_id =?`,

    [jID],
    function(error, results, fields) {
      //If there is error, we send the error in the error section with 500 status
      if (error) {
        next(error);
        return;
      }

      //If there is no error, all is good and response is 200OK.
      res.send(JSON.stringify({ status: 200, error: null, response: results }));
    }
  );
});

// zone Detail
router.get('/zone/:zID', function(req, res, next) {
  const zID = req.params.zID;

  gPool.query(
    `SELECT
        z_id AS zID,
        z_number AS zNumber,
        z_name As zName,
        rd_pallet As rDpallet,
        rf_pallet AS rFpallet 
    FROM
        zonetype 
    WHERE
        z_id =?`,

    [zID],
    function(error, results, fields) {
      //If there is error, we send the error in the error section with 500 status
      if (error) {
        next(error);
        return;
      }

      //If there is no error, all is good and response is 200OK.
      res.send(JSON.stringify({ status: 200, error: null, response: results }));
    }
  );
});

module.exports = router;
