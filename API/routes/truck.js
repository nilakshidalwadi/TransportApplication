var express = require('express');
var router = express.Router();

router.get('/truckNameList', function(req, res, next) {
  gPool.query(
    'SELECT t_id AS tID, rego_no AS regoNummber FROM truck WHERE in_use = 1',
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

/* get user list */
router.get('/userList', function(req, res, next) {
  gPool.query(
    `SELECT u.u_id  AS uID, 
        Concat(ud.f_name, ' ', ud.l_name) AS uName 
     FROM   userdetail ud 
      INNER JOIN users u 
        ON ud.u_id = u.u_id 
      WHERE  u.is_admin = 0 
       AND u.active = 1`,
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

router.get('/zoneNameList', function(req, res, next) {
  gPool.query(
    'SELECT z_id AS zID, z_number AS zNumber, z_name AS zName, rd_pallet AS rDpallet, rf_pallet AS rFpallet FROM zonetype WHERE active = 1 ORDER BY z_number, z_name',
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

router.post('/addTruck', function(req, res, next) {
  const regoNum = req.body.regoNum;
  const cName = req.body.cName;
  const model = req.body.model;
  const mYear = req.body.mYear;

  gPool.query(
    'INSERT INTO truck SET ?',
    {
      rego_no: regoNum,
      company: cName,
      model: model,
      maft_year: mYear
    },
    function(err, results) {
      // Handle error after the release.
      if (err) {
        // not connected!
        next(err);
        return;
      }

      let tId = results.insertId;
      res.send(JSON.stringify({ status: 200, error: null, response: tId }));
    }
  );
});

router.post('/addTruckService', function(req, res, next) {
  const tID = req.body.tID;
  const sDate = req.body.sDate;
  const sKm = req.body.sKm;
  const sFrom = req.body.sFrom;
  const sNextDueKm = req.body.sNextDueKm;
  const sNextDueDate = req.body.sNextDueDate;
  const sDesc = req.body.sDesc;

  gPool.query(
    'INSERT INTO truckservicehistory SET ?',
    {
      t_id: tID,
      service_date: sDate,
      service_kms: sKm,
      service_from: sFrom,
      description: sDesc,
      next_due_date: sNextDueDate,
      next_due_kms: sNextDueKm
    },
    function(err, results) {
      // Handle error after the release.
      if (err) {
        // not connected!
        next(err);
        return;
      }

      let tServiceId = results.insertId;
      res.send(
        JSON.stringify({ status: 200, error: null, response: tServiceId })
      );
    }
  );
});

/*get truck list */
router.get('/truckList', function(req, res, next) {
  gPool.query(
    'SELECT t_id  AS tID, rego_no  AS regoNum, company  AS cName, model AS model,  maft_year AS maftYear, in_use  AS inUse FROM truck',
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

/*Active truck */
router.put('/active/:tID', function(req, res, next) {
  const tID = req.params.tID;

  gPool.query('UPDATE truck SET in_use = 1 where t_id = ?', [tID], function(
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

/*delete truck */
router.put('/delete/:tID', function(req, res, next) {
  const tID = req.params.tID;

  gPool.query('UPDATE truck SET in_use = 0 where t_id = ?', [tID], function(
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

/*update truck */

router.put('/update/:tID', function(req, res, next) {
  const tID = req.params.tID;
  const regoNum = req.body.regoNum;
  const cName = req.body.cName;
  const model = req.body.model;
  const maftYear = req.body.maftYear;
  gPool.query(
    `UPDATE
        truck 
    SET
        rego_no = ?, company = ?, model = ?, maft_year = ? 
    WHERE
        t_id = ?`,
    [regoNum, cName, model, maftYear, tID],
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

// /*methods for truck service */

// /*get truckservice list */
router.get('/serviceList', function(req, res, next) {
  gPool.query(
    `SELECT
        tsh.ts_id AS tsID,
        t.rego_no AS regoNum,
        service_date AS sDate,
        service_kms AS sKm,
        service_from AS sFrom,
        next_due_kms AS sNextDueKm,
        next_due_date AS sNextDueDate,
        description AS sDesc,
        t.in_use AS truckInUse 
    FROM
        truckservicehistory tsh 
        INNER JOIN
          truck t 
          ON t.t_id = tsh.t_id`,
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

// /*delete truckservice */
router.post('/servicedelete/:tsID', function(req, res, next) {
  const tsID = req.params.tsID;

  gPool.query(
    'DELETE FROM truckservicehistory where ts_id = ?',
    [tsID],
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

// /*update truckservice */
router.put('/updateservice/:tsID', function(req, res, next) {
  const tsID = req.params.tsID;
  const tID = req.body.tID;
  const sDate = req.body.sDate;
  const sKm = req.body.sKm;
  const sFrom = req.body.sFrom;
  const sNextDueKm = req.body.sNextDueKm;
  const sNextDueDate = req.body.sNextDueDate;
  const sDesc = req.body.sDesc;

  gPool.query(
    `UPDATE truckservicehistory 
      SET t_id=?,
        service_date = ?,
        service_kms=?,
        service_from=?,
        next_due_kms=?,
        next_due_date=?,
        description=?
    WHERE ts_id=?`,
    [tID, sDate, sKm, sFrom, sNextDueKm, sNextDueDate, sDesc, tsID],
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

// truck service history Detail
router.get('/servicedetail/:tsID', function(req, res, next) {
  const tsID = req.params.tsID;

  gPool.query(
    `SELECT
        t_id AS tID,
        service_date AS sDate,
        service_kms As sKm,
        service_from As sFrom,
        next_due_kms AS sNextDueKm,
        next_due_date AS sNextDueDate,
        description AS sDesc
    FROM
        truckservicehistory 
    where ts_id=?`,
    [tsID],
    function(error, results, fields) {
      //If there is error, we send the error in the error section with 500 status
      if (error) {
        next(error);
        return;
      }

      res.send(JSON.stringify({ status: 200, error: null, response: results }));
    }
  );
});

// truck Detail
router.get('/:tID', function(req, res, next) {
  const tID = req.params.tID;

  gPool.query(
    `SELECT
        t_id AS tID,
        rego_no AS regoNum,
        company As cName,
        model As model,
        maft_year AS maftYear 
    FROM
        truck 
    WHERE
        t_id =?`,

    [tID],
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
