/*
* Import @sendgrid/mail and set the sendgrid_api_key to it.
*/
const sg = require('@sendgrid/mail');

sg.setApiKey(process.env.SENDGRID_API_KEY);

/*
* Export a function that sends an email. With to,subject,email, it sends the email. The console.log statements are for debugging purposes.
*/
module.exports = (to, subject, email) => {
  /**
   * @name sendEmail
   * @description Is used to send an email to a user
   */
  const msg = {
    from: "karanikio@auth.gr",
    to,
    subject,
    html: email
  };

  console.log(msg);
  sg.send(msg).then(() => console.log("HERE"));
};
