const schedule = require("node-schedule");
const nodemailer = require("nodemailer");
const https = require("follow-redirects").https;
const dotenv = require("dotenv");
dotenv.config();
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  service: "gmail",
  auth: {
    type: "OAUTH2",
    user: process.env.EMAIL,
    clientId: process.env.CLIENTID,
    clientSecret: process.env.CLIENTSECRET,
    refreshToken: process.env.REFRESHTOKEN,
    accessToken: process.env.ACCESSTOKEN,
  },
});

schedule.scheduleJob("*/10 * * * *", async function () {
  const date = new Date();
  console.log(date);
  const pincode = process.env.PINCODE;
  const options = {
    method: "GET",
    hostname: "cdn-api.co-vin.in",
    path: `/api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${date.toLocaleDateString()}`,
    headers: {
      "Accept-Language": "hi_IN",
    },
    maxRedirects: 20,
  };

  const req = https.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function (chunk) {
      var body = Buffer.concat(chunks);
      let jsonData = JSON.parse(body.toString());
      let html = "<h1>Available slots in your area:</h1>";
      let data = ``;
      const centers = jsonData.centers;
      centers.map((center) => {
        center.sessions.map((session) => {
          if (
            session.available_capacity > 0 &&
            session.min_age_limit > 18 &&
            session.min_age_limit < 45
          ) {
            data += `<p>Center: <strong>${center.name}</strong></p>`;
            data += `<p>Address: <strong>${center.address}</strong></p>`;
            data += `<p>Date: <strong>${session.date}</strong></p>`;
            data += `<p>Capacity: <strong>${session.available_capacity}</strong></p><hr/>`;
          }
        });
      });
      if (data) {
        let mailOptions = {
          from: process.env.EMAIL,
          to: [process.env.TOEMAIL],
          subject: "Slot Available - " + date.toLocaleDateString(),
          html: html,
        };
        transporter.sendMail(mailOptions, function (err, data) {
          if (err) {
            console.log(err);
          } else {
            console.log("Email sent successfully", data);
          }
        });
      }
    });

    res.on("error", function (error) {
      console.error(error);
    });
  });

  req.end();
});
