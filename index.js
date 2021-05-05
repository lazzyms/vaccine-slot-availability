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
  const pincode = 364001;
  const center_id = 599643;
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

      const centers = jsonData.centers;
      const availability = centers
        .filter((item) => item.center_id == center_id)[0]
        .sessions.map((dates, i) => {
          if (
            dates.available_capacity > 0 &&
            dates.min_age_limit >= 18 &&
            dates.min_age_limit < 45
          ) {
            return dates.date;
          }
        })
        .filter((item) => item);

      if (availability.length > 0) {
        let html = `<h1>Slots are available for following dates at ${
          centers.filter((item) => item.center_id == center_id)[0].name
        }</h1>`;
        for (let i = 0; i < availability.length; i++) {
          html += `<p>${availability[i]}<p>`;
        }
        let mailOptions = {
          from: "maulik.sompura06@gmail.com",
          to: [
            "mauliksompura+zkyo3uj8czbq2ch3fw5d@boards.trello.com",
            "maulik.sompura06@gmail.com",
          ],
          subject: "Slot Available",
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
