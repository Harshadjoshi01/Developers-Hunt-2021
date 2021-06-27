const express = require("express");
const { google } = require("googleapis");
const bodyParser = require('body-parser');
// const mysql = require("mysql");
const nodemailer = require('nodemailer');
const session = require('express-session');
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
  })
);

//flash message middleware
app.use((req, res, next) => {
    res.locals.message = req.session.message
    delete req.session.message
    next()
})
  
app.use(express.static("public"));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    }
  });
  

app.get("/", (req, res) => {
    res.locals.title = "Developers Hunt 2021"
    res.render("form.ejs");
});

app.post("/formdata1", async (req, res) => {
  const wp_link = "a;okdjfa;kjrfaokjrfoajrofadijka";
  let stud_name = req.body.stud_name.toString();
  let stud_dob = req.body.stud_dob.toString();
  let stud_wp_num = req.body.stud_wp_num.toString();
  let stud_email = req.body.stud_email.toString();
  let stud_department = req.body.stud_department.toString();
  let stud_year = req.body.stud_year.toString();

  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  // Create client instance for auth
  const client = await auth.getClient();

  // Instance of Google Sheets API
  const googleSheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = "1h0Xtf3OcBXbMoiSRV1CYj2DhLppsfz9aXHlF19tzD1s";

  // Get metadata about spreadsheet
  const metaData = await googleSheets.spreadsheets.get({
    auth,
    spreadsheetId,
  });

  // Read rows from spreadsheet
  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: "Sheet1!D:D",
  });

  const length = getRows.data.values.length;
  var email_exists = false;
  for(let i = 1; i < length; i++) {
    var email = getRows.data.values[i][0];
    if(email === stud_email){
      email_exists = true;
      break;
    }
    continue;
  }
  if (email_exists){
    req.session.message = {
      type: "danger",
      message: 'Email already exists ! Try with different Email Id'
    }
    res.redirect("/")
  } else {
    var msg = "Thank You "+stud_name+" for registering for Developer's Hunt 2021 Here is Our Whatsapp group Join It for further Updates "+ wp_link;
    var mailOptions = {
      from: process.env.EMAIL,
      to: stud_email,
      subject: 'Email From GRCS DEVELOPERS CLUB',
      text: msg
    };
    transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
  //Write row(s) to spreadsheet
  await googleSheets.spreadsheets.values.append({
    auth,
    spreadsheetId,
    range: "Sheet1!A:F",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [[stud_name, stud_dob, stud_wp_num, stud_email, stud_department, stud_year]],
    },
  });
  req.session.message = {
    type: "success",
    message: 'Thank You '+stud_name+' successfully regestered Please Check your mailbox for Whatsaap group link'
  }
  res.redirect("/")
  }
});


const port = process.env.PORT || 3000;

app.listen(port, function() {
    console.log("server is running @ port: "+port.toString());
});
