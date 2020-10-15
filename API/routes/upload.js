var express = require('express');
const multipart = require('connect-multiparty');
const fs = require('fs');
const atob = require('atob');

const multipartMiddleware = multipart({
  uploadDir: gConfig.uploadFilePath
});

var router = express.Router();

router.post('/', multipartMiddleware, function(req, res, next) {
  // don't forget to delete all req.files when done
  let uploads = req.files.uploads;

  if (!uploads) {
    res.send(
      JSON.stringify({
        status: 200,
        error: null,
        response: 'No files to upload'
      })
    );
    return;
  }

  let upData = [];

  for (let i = 0; i < uploads.length; i++) {
    let fileDetails = uploads[i]['name'].toString().split('|~|');
    let originalFileName = '';
    let tripID = 0;
    if (fileDetails.length > 0) {
      originalFileName = fileDetails[fileDetails.length - 1];
      tripID = fileDetails[0] || null;
      fileDetails = fileDetails.slice(1, fileDetails.length - 1);
    }
    let path = uploads[i]['path'];

    upData.push([
      req.user.userID,
      tripID,
      fileDetails.join('|~|'),
      originalFileName,
      path
    ]);
  }

  gPool.query(
    'INSERT INTO attachments (u_id, trip_id, field_name, original_f_name, path) VALUES ?',
    [upData],
    function(err, results) {
      if (err) {
        // not connected!
        next(err);
        return;
      }

      let attachmentID = results.insertId;

      res.send(
        JSON.stringify({
          status: 200,
          error: null,
          response: 'File uploaded succesfully.' + attachmentID
        })
      );
    }
  );
});

router.get('/download/:path', function(req, res, next) {
  const path = atob(req.params.path);
  fs.readFile(path, function(error, file) {
    if (error) {
      res.writeHead(404);
      res.write(
        JSON.stringify({
          status: 400,
          error: 'Contents you are looking are Not Found',
          response: null
        })
      );
    } else {
      res.write(
        JSON.stringify({
          status: 200,
          error: null,
          response: file.toString('base64')
        })
      );
    }
    res.end();
  });
});

router.put('/toggleDriverVisible/:attachID', function(req, res, next) {
  const attachID = req.params.attachID;

  gPool.query(
    `UPDATE attachments SET field_name = CASE WHEN field_name = 'docs|~|driver' THEN 'docs' ELSE 'docs|~|driver' END WHERE attach_id = ?`,
    [attachID],
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

router.put('/delete/:attachID', function(req, res, next) {
  const attachID = req.params.attachID;

  gPool.query(
    'UPDATE attachments SET deleted = 1 where attach_id=?',
    [attachID],
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

router.get('/docList', function(req, res, next) {
  let filter = req.user.isAdmin == 1 ? 'docs%' : 'docs|~|driver';

  gPool.query(
    `SELECT attach_id       AS attachID, 
          CASE 
            WHEN field_name = 'docs|~|driver' THEN 1 
            ELSE 0 
          END             AS driverVisible, 
          original_f_name AS originalFileName, 
          path            AS path, 
          time            AS time 
      FROM   attachments 
      WHERE  field_name LIKE '${filter}' AND deleted = 0 
      ORDER  BY time DESC 
  `,

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

router.get('/userDocList/:uID', function(req, res, next) {
  const uID = req.params.uID;

  gPool.query(
    `SELECT attach_id       AS attachID, 
            field_name      AS fieldName, 
            original_f_name AS originalFileName, 
            path            AS path, 
            time            AS time 
        FROM   attachments 
        WHERE  field_name = 'userDocs|~|${uID}' AND deleted = 0
        ORDER  BY time DESC 
  `,

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
