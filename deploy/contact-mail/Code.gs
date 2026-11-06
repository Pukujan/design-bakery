/**
 * Design Bakery contact mail: the site's copilot posts a visitor's message here, and this emails it to the
 * owner of this Google account. It runs as you, with one permission: send email as you (MailApp). It cannot
 * read your mail. Setup and rollback: deploy/contact-mail/README.md.
 *
 * Script property TOKEN must equal CONTACT_MAIL_TOKEN in the site's API env; anything else is refused.
 */
function doPost(e) {
  var body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return reply({ ok: false, error: 'bad json' });
  }
  var token = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!token || body.token !== token) return reply({ ok: false, error: 'unauthorized' });

  var name = String(body.name || '').slice(0, 80);
  var email = String(body.email || '').slice(0, 200);
  var message = String(body.message || '').slice(0, 4000);
  if (!name || !email || !message) return reply({ ok: false, error: 'name, email and message are required' });
  if (MailApp.getRemainingDailyQuota() < 1) return reply({ ok: false, error: 'daily quota used' });

  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    replyTo: email,
    name: 'AI Pujan (design-bakery.com)',
    subject: 'Message from ' + name + ' via design-bakery.com',
    body: message + '\n\n— ' + name + ' <' + email + '>\nSent through AI Pujan on ' + String(body.page || 'design-bakery.com') + '. Reply to this email to answer them.',
  });
  return reply({ ok: true });
}

function reply(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
