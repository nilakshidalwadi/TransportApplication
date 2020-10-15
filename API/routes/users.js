var express = require('express');
// Authentication
const jwt = require('jsonwebtoken');

var router = express.Router();

const secretKey = gConfig.secretKey;
const tokenValidity = gConfig.tokenValidity;

/* GET users listing. */
router.get('/list', function(req, res, next) {
  gPool.query(
    `SELECT u.u_id                   AS uID, 
            u.user_id			           AS uName,
            ud.f_name                AS fName, 
            ud.l_name                AS lName, 
            ud.phone_num             AS phoneNumber, 
            ud.address               AS address, 
            ud.driving_licence       AS licenceNumber, 
            ud.licence_expiry_date   AS licenceExpiryDate, 
            ud.induction_expiry_date AS inductionExpiryDate,
            u.is_Admin               AS isAdmin,
            u.active                 AS isActive
        FROM   users u 
            INNER JOIN userdetail ud 
                    ON ud.u_id = u.u_id`,
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

// User Detail
router.get('/:uID', function(req, res, next) {
  const uID = req.params.uID;

  gPool.query(
    `SELECT u.u_id                   AS uID, 
            u.user_id                AS uName,
            ud.f_name                AS fName, 
            ud.l_name                AS lName, 
            ud.phone_num             AS phoneNum, 
            ud.address               AS address, 
            ud.driving_licence       AS drivingLicence, 
            ud.licence_expiry_date   AS licenceExpiryDate, 
            ud.induction_expiry_date AS inductionExpiryDate 
        FROM   users u 
            INNER JOIN userdetail ud 
                    ON ud.u_id = u.u_id 
        WHERE  u.active = 1 AND u.u_id = ? LIMIT 1`,
    [uID],
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

// Make admin
router.put('/toggleAdmin/:uID', function(req, res, next) {
  const uID = req.params.uID;
  if (req.user.isAdmin != 1) {
    return res.sendStatus(401);
  }

  gPool.query(
    `UPDATE users SET is_admin = IF(is_admin = 1, 0, 1) WHERE u_id = ?`,
    [uID],
    function(error, results, fields) {
      //If there is error, we send the error in the error section with 500 status
      if (error) {
        next(error);
        return;
      }

      //If there is no error, all is good and response is 200OK.
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

/*delete user*/
router.put('/delete/:uID', function(req, res, next) {
  const uID = req.params.uID;

  gPool.query('UPDATE users SET active = 0 where u_id = ?', [uID], function(
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

/*active user*/
router.put('/active/:uID', function(req, res, next) {
  const uID = req.params.uID;

  gPool.query('UPDATE users SET active = 1 where u_id = ?', [uID], function(
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

/*update user*/
router.put('/update/:uID', function(req, res, next) {
  const uID = req.params.uID;
  const uName = req.body.uName;
  const fName = req.body.fName;
  const lName = req.body.lName;
  const phoneNum = req.body.phoneNum;
  const address = req.body.address;
  const drivingLicence = req.body.drivingLicence;
  const licenceExpiryDate = req.body.licenceExpiryDate;
  const inductionExpiryDate = req.body.inductionExpiryDate;

  gPool.query(
    `SELECT 
      u_id, 
      user_id 
    FROM 
      users 
    WHERE 
      user_id = ? 
      AND u_id <> ?
    `,
    [uName, uID],
    function(err, result) {
      if (err) {
        // not connected!
        next(err);
        return;
      }
      if (result.length > 0) {
        res.send(
          JSON.stringify({
            status: 400,
            error: 'Username already exists',
            response: null
          })
        );
      } else {
        gPool.query(
          `UPDATE 
              users u 
              INNER JOIN userdetail ud ON (u.u_id = ud.u_id) 
            SET 
              u.user_id = ?, 
              ud.f_name = ?, 
              ud.l_name = ?, 
              ud.phone_num = ?, 
              ud.address = ?, 
              ud.driving_licence = ?, 
              ud.licence_expiry_date = ?, 
              ud.induction_expiry_date = ? 
            WHERE 
              u.u_id = ?`,
          [
            uName,
            fName,
            lName,
            phoneNum,
            address,
            drivingLicence,
            licenceExpiryDate,
            inductionExpiryDate,
            uID
          ],
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
      }
    }
  );
});

router.post('/login', function(req, res, next) {
  const body = req.body;

  gPool.query(
    'SELECT u.u_id, u.user_id, u.is_admin, ud.f_name, ud.l_name FROM users u INNER JOIN userdetail ud ON u.u_id = ud.u_id WHERE user_id = ? AND passwd = ? AND active = 1 LIMIT 1',
    [body.username, body.password],
    function(error, results, fields) {
      // Handle error after the release.
      if (error) {
        next(error);
        return;
      }

      if (results.length == 1) {
        //If there is no error, all is good and response is 200OK.
        const user = results[0];
        const token = jwt.sign(
          {
            userID: user.u_id,
            userName: user.user_id,
            isAdmin: user.is_admin
          },
          secretKey,
          { expiresIn: tokenValidity }
        );
        res.send({
          id: user.u_id,
          firstName: user.f_name,
          lastName: user.l_name,
          role: user.is_admin === 1 ? 'Admin' : 'User',
          token: token
        });
      } else {
        return res.sendStatus(401);
      }
    }
  );
});

router.post('/add', function(req, res, next) {
  const uName = req.body.uName;
  const passwd = '1234'; // Fix password for all the user
  const fName = req.body.fName;
  const lName = req.body.lName;
  const phoneNum = req.body.phoneNum;
  const address = req.body.address;
  const drivingLicence = req.body.drivingLicence;
  const licenceExpiryDate = req.body.licenceExpiryDate;
  const inductionExpiryDate = req.body.inductionExpiryDate;

  gPool.query(
    `SELECT 
      u_id, 
      user_id 
    FROM 
      users 
    WHERE 
      user_id = ?`,
    [uName],
    function(err, result) {
      if (err) {
        // not connected!
        next(err);
        return;
      }

      if (result.length > 0) {
        res.send(
          JSON.stringify({
            status: 400,
            error: 'Username already exists',
            response: null
          })
        );
      } else {
        gPool.query(
          'INSERT INTO users SET ?',
          { user_id: uName, passwd: passwd },
          function(err, result) {
            if (err) {
              // not connected!
              next(err);
              return;
            }

            let uID = result.insertId;

            gPool.query(
              'INSERT INTO userdetail SET ?',
              {
                u_id: uID,
                f_name: fName,
                l_name: lName,
                phone_num: phoneNum,
                address: address,
                driving_licence: drivingLicence,
                licence_expiry_date: licenceExpiryDate,
                induction_expiry_date: inductionExpiryDate
              },
              function(err, result) {
                // Handle error after the release.
                if (err) {
                  // not connected!
                  next(err);
                  return;
                }

                res.send(
                  JSON.stringify({ status: 200, error: null, response: uID })
                );
              }
            );
          }
        );
      }
    }
  );
});

router.put('/updatePassword', function(req, res, next) {
  if (req.user.isAdmin != 1) {
    return res.sendStatus(401);
  }

  const u_id = req.body.uID;
  const passwd = req.body.passwd;

  gPool.query(
    'UPDATE users SET passwd = ? WHERE u_id = ?',
    [passwd, u_id],
    function(error, results, fields) {
      // Handle error after the release.
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

module.exports = router;
