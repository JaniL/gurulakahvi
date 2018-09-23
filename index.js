require('dotenv').config()
const twilio = require('twilio')
const VoiceResponse = require('twilio').twiml.VoiceResponse
const express = require('express')
const urlencoded = require('body-parser').urlencoded

const { 
  GURULAKAHVI_PHONENUMBER,
  GURULAKAHVI_ACCOUNTSID,
  GURULAKAHVI_AUTHTOKEN,
  GURULAKAHVI_BASEURL
} = process.env

const app = express()

app.use(urlencoded({ extended: false }))

let coffeeStatus = {
  isCoffee: false,
  when: null
}

const baseUrl = GURULAKAHVI_BASEURL
const askForMilk = false

app.post('/voice', (request, response) => {
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse();

  const { body: { Digits } } = request

  if (request.query.milk) {
    twiml.say('Thank you for your help.')
    console.log(Digits === '1' ? 'Yes we have milk' : 'No we do not have milk')
  } else if (Digits && ['1','2'].includes(Digits)) {
    twiml.say('Thank you for your help.')
    coffeeStatus = { isCoffee: Digits === '1', when: new Date() }
    console.log(coffeeStatus)
    if (askForMilk && Digits === '1') {
      const gather = twiml.gather({ numDigits: 1, action: baseUrl + '/voice?milk=true' })
      gather.say('Do we have milk? Press one, if yes. Otherwise press two.')
    }
  } else {
    const gather = twiml.gather({ numDigits: 1 });
    gather.pause({ length: 2 })
    gather.say('Coffee bot here. Press one, if the coffee machine has coffee. Otherwise, press two.');
    twiml.redirect('/voice');
  }

  response.type('text/xml');
  response.send(twiml.toString());
})

app.post('/status', (request, response) => {
  const { body: { CallStatus } } = request
  console.log('Call status: ' + CallStatus)
  response.json({})
})

const port = 5000

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)

  const client = new twilio(GURULAKAHVI_ACCOUNTSID, GURULAKAHVI_AUTHTOKEN)

  const gurulanumero = '+358504480186'

  client.calls
        .create({
          url: baseUrl + '/voice',
          to: gurulanumero,
          statusCallback: baseUrl + '/status',
          statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
          from: GURULAKAHVI_PHONENUMBER
        })
        .then(call => console.log(call.sid))
        .done();
})